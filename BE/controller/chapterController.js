import Chapter from '../models/chapterSchema.js';
import Course from '../models/courseSchema.js';
import Purchase from '../models/purchaseSchema.js';
import validator from 'validator';

export const createChapter = async (req, res, next) => {
  try {
    const { title, order } = req.body;
    const courseId = req.params.courseId;

    // Kiểm tra khóa học
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    // Kiểm tra đầu vào
    if (!title || !order) {
      return res.status(400).json({ message: 'Vui lòng cung cấp tiêu đề và thứ tự' });
    }
    if (!validator.isLength(title, { min: 3, max: 50 })) {
      return res.status(400).json({ message: 'Tiêu đề phải từ 3-50 ký tự' });
    }
    if (!Number.isInteger(order) || order < 1) {
      return res.status(400).json({ message: 'Thứ tự phải là số nguyên dương' });
    }

    // Kiểm tra thứ tự trùng lặp
    const existingChapter = await Chapter.findOne({ course: courseId, order });
    if (existingChapter) {
      return res.status(400).json({ message: 'Thứ tự chương đã tồn tại' });
    }

    const chapter = await Chapter.create({ course: courseId, title, order });
    res.status(201).json({ message: 'Tạo chương thành công', chapter });
  } catch (error) {
    console.error('Lỗi tạo chương:', error.message);
    next(error);
  }
};

export const getChapters = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user ? req.user._id : null;

    // Kiểm tra khóa học
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    // Kiểm tra quyền truy cập
    if (course.status === 'draft' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Không có quyền truy cập khóa học này' });
    }
    if (req.user && req.user.role === 'student') {
      const purchase = await Purchase.findOne({ user: userId, course: courseId });
      if (!purchase) {
        return res.status(403).json({ message: 'Bạn chưa sở hữu khóa học này' });
      }
    }

    const chapters = await Chapter.find({ course: courseId }).sort('order').select('-__v');
    res.status(200).json({ chapters });
  } catch (error) {
    console.error('Lỗi lấy danh sách chương:', error.message);
    next(error);
  }
};

export const updateChapter = async (req, res, next) => {
  try {
    const { title, order } = req.body;
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
    if (title && !validator.isLength(title, { min: 3, max: 50 })) {
      return res.status(400).json({ message: 'Tiêu đề phải từ 3-50 ký tự' });
    }
    if (order && (!Number.isInteger(order) || order < 1)) {
      return res.status(400).json({ message: 'Thứ tự phải là số nguyên dương' });
    }

    // Kiểm tra thứ tự trùng lặp
    if (order && order !== chapter.order) {
      const existingChapter = await Chapter.findOne({ course: chapter.course, order });
      if (existingChapter) {
        return res.status(400).json({ message: 'Thứ tự chương đã tồn tại' });
      }
    }

    // Cập nhật chương
    const updatedChapter = await Chapter.findByIdAndUpdate(
      chapterId,
      {
        title: title || chapter.title,
        order: order || chapter.order,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Cập nhật chương thành công', chapter: updatedChapter });
  } catch (error) {
    console.error('Lỗi cập nhật chương:', error.message);
    next(error);
  }
};

export const deleteChapter = async (req, res, next) => {
  try {
    const chapterId = req.params.chapterId;

    // Kiểm tra chương
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: 'Không tìm thấy chương' });
    }

    // Xóa video và bài tập liên quan
    await Video.deleteMany({ chapter: chapterId });
    await Quiz.deleteMany({ chapter: chapterId });

    // Xóa chương
    await Chapter.findByIdAndDelete(chapterId);

    res.status(200).json({ message: 'Xóa chương thành công' });
  } catch (error) {
    console.error('Lỗi xóa chương:', error.message);
    next(error);
  }
};

export const getChapterDetails = async (req, res, next) => {
    try {
        const { chapterId } = req.params; // Lấy chapterId từ URL params

        // 1. Tìm chương bằng ID
        const chapter = await Chapter.findById(chapterId).select('-__v'); // Loại bỏ trường __v không cần thiết

        // 2. Nếu không tìm thấy chương, trả về 404
        if (!chapter) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chương này.',
            });
        }

        // 3. (Tùy chọn) Kiểm tra quyền truy cập nếu cần thiết
        // Nếu bạn muốn hạn chế ai có thể xem chi tiết chương (ví dụ: chỉ admin hoặc người đã mua khóa học)
        // bạn sẽ cần lấy courseId từ chapter.course và thực hiện kiểm tra tương tự như trong getChapters.
        // Ví dụ:
        const course = await Course.findById(chapter.course);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Khóa học của chương không tồn tại.' });
        }

        // Kiểm tra quyền truy cập (chỉ admin hoặc người đã mua khóa học có thể xem chi tiết nếu khóa học không phải public/draft)
        if (req.user && req.user.role === 'student') {
            const purchase = await Purchase.findOne({ user: req.user._id, course: course._id });
            if (!purchase) {
                // Nếu khóa học này là có phí và người dùng chưa mua
                if (course.price > 0 && course.status !== 'public') { // Hoặc bất kỳ logic nào bạn dùng để xác định khóa học miễn phí/công khai
                    return res.status(403).json({ success: false, message: 'Bạn chưa sở hữu khóa học này để xem chi tiết chương.' });
                }
            }
        }
        // Admin luôn có quyền truy cập
        if (req.user && req.user.role !== 'admin' && course.status === 'draft') {
             return res.status(403).json({ success: false, message: 'Không có quyền xem chương trong khóa học nháp.' });
        }


        // 4. Trả về thông tin chi tiết chương
        res.status(200).json({
            success: true,
            chapter,
        });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết chương:', error.message);
        // Nếu ID không hợp lệ (ví dụ: định dạng sai), Mongoose sẽ ném lỗi.
        // Kiểm tra lỗi cast để trả về 400 thay vì 500 cho ID không hợp lệ
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'ID chương không hợp lệ.' });
        }
        next(error); // Chuyển lỗi cho middleware xử lý lỗi tổng quát
    }
};