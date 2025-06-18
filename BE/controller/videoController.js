import Video from '../models/videoSchema.js';
import Chapter from '../models/chapterSchema.js';
import Course from '../models/courseSchema.js';
import Purchase from '../models/purchaseSchema.js';
import validator from 'validator';

export const createVideo = async (req, res, next) => {
  try {
    const { title, youtubeUrl, duration, order } = req.body;
    const chapterId = req.params.chapterId;

    // Kiểm tra chương
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: 'Không tìm thấy chương' });
    }

    // Kiểm tra khóa học
    const course = await Course.findById(chapter.course);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    // Kiểm tra đầu vào
    if (!title || !youtubeUrl || !duration || !order) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }
    if (!validator.isLength(title, { min: 3, max: 100 })) {
      return res.status(400).json({ message: 'Tiêu đề phải từ 3-100 ký tự' });
    }
    if (!youtubeUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)) {
      return res.status(400).json({ message: 'Link YouTube không hợp lệ' });
    }
    if (!Number.isInteger(duration) || duration < 1) {
      return res.status(400).json({ message: 'Thời lượng phải là số nguyên dương' });
    }
    if (!Number.isInteger(order) || order < 1) {
      return res.status(400).json({ message: 'Thứ tự phải là số nguyên dương' });
    }

    // Kiểm tra thứ tự trùng lặp
    const existingVideo = await Video.findOne({ chapter: chapterId, order });
    if (existingVideo) {
      return res.status(400).json({ message: 'Thứ tự video đã tồn tại' });
    }

    const video = await Video.create({ chapter: chapterId, title, youtubeUrl, duration, order });

    // Cập nhật thời lượng khóa học
    await Course.findByIdAndUpdate(chapter.course, {
      $inc: { duration: duration },
    });

    res.status(201).json({ message: 'Tạo video thành công', video });
  } catch (error) {
    console.error('Lỗi tạo video:', error.message);
    next(error);
  }
};

export const getVideos = async (req, res, next) => {
  try {
    const chapterId = req.params.chapterId;
    const userId = req.user ? req.user._id : null;

    // Kiểm tra chương
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: 'Không tìm thấy chương' });
    }

    // Kiểm tra khóa học
    const course = await Course.findById(chapter.course);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    // Kiểm tra quyền truy cập
    if (course.status === 'draft' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Không có quyền truy cập khóa học này' });
    }
    if (req.user && req.user.role === 'student') {
      const purchase = await Purchase.findOne({ user: userId, course: chapter.course });
      if (!purchase) {
        return res.status(403).json({ message: 'Bạn chưa sở hữu khóa học này' });
      }
    }

    const videos = await Video.find({ chapter: chapterId }).sort('order').select('-__v');
    res.status(200).json({ videos });
  } catch (error) {
    console.error('Lỗi lấy danh sách video:', error.message);
    next(error);
  }
};

export const updateVideo = async (req, res, next) => {
  try {
    const { title, youtubeUrl, duration, order } = req.body;
    const videoId = req.params.videoId;

    // Kiểm tra video
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Không tìm thấy video' });
    }

    // Kiểm tra chương
    const chapter = await Chapter.findById(video.chapter);
    if (!chapter) {
      return res.status(404).json({ message: 'Không tìm thấy chương' });
    }

    // Kiểm tra khóa học
    const course = await Course.findById(chapter.course);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    // Kiểm tra đầu vào
    if (title && !validator.isLength(title, { min: 3, max: 100 })) {
      return res.status(400).json({ message: 'Tiêu đề phải từ 3-100 ký tự' });
    }
    if (youtubeUrl && !youtubeUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)) {
      return res.status(400).json({ message: 'Link YouTube không hợp lệ' });
    }
    if (duration && (!Number.isInteger(duration) || duration < 1)) {
      return res.status(400).json({ message: 'Thời lượng phải là số nguyên dương' });
    }
    if (order && (!Number.isInteger(order) || order < 1)) {
      return res.status(400).json({ message: 'Thứ tự phải là số nguyên dương' });
    }

    // Kiểm tra thứ tự trùng lặp
    if (order && order !== video.order) {
      const existingVideo = await Video.findOne({ chapter: video.chapter, order });
      if (existingVideo) {
        return res.status(400).json({ message: 'Thứ tự video đã tồn tại' });
      }
    }

    // Cập nhật thời lượng khóa học
    if (duration && duration !== video.duration) {
      await Course.findByIdAndUpdate(chapter.course, {
        $inc: { duration: duration - video.duration },
      });
    }

    // Cập nhật video
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        title: title || video.title,
        youtubeUrl: youtubeUrl || video.youtubeUrl,
        duration: duration || video.duration,
        order: order || video.order,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Cập nhật video thành công', video: updatedVideo });
  } catch (error) {
    console.error('Lỗi cập nhật video:', error.message);
    next(error);
  }
};

export const deleteVideo = async (req, res, next) => {
  try {
    const videoId = req.params.videoId;

    // Kiểm tra video
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Không tìm thấy video' });
    }

    // Kiểm tra chương
    const chapter = await Chapter.findById(video.chapter);
    if (!chapter) {
      return res.status(404).json({ message: 'Không tìm thấy chương' });
    }

    // Cập nhật thời lượng khóa học
    await Course.findByIdAndUpdate(chapter.course, {
      $inc: { duration: -video.duration },
    });

    // Xóa video
    await Video.findByIdAndDelete(videoId);

    res.status(200).json({ message: 'Xóa video thành công' });
  } catch (error) {
    console.error('Lỗi xóa video:', error.message);
    next(error);
  }
};