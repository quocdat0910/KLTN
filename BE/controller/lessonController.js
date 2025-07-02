import Lesson from "../models/lessonSchema.js";
import Chapter from "../models/chapterSchema.js";
import Course from "../models/courseSchema.js";
import Note from "../models/noteSchema.js";
import Enrollment from "../models/enrollmentSchema.js";
import UserProgress from "../models/userProgressSchema.js";
import validator from "validator";
import mongoose from "mongoose";

// @route GET /api/v1/courses/:courseId/chapters/:chapterId/lessons
// @desc Get all lessons of a chapter
// @access Authenticated users
export const getAllLessons = async (req, res, next) => {
  try {
    const { courseId, chapterId } = req.params;
    const userId = req.user._id;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ message: "ID khóa học hoặc chương không hợp lệ" });
    }

    // Kiểm tra khóa học và chương tồn tại
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    // Kiểm tra quyền truy cập
    const isEnrolled = await Enrollment.exists({ courseId, userId });
    if (!chapter.isPublished && !isEnrolled && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập chương này" });
    }

    // Lấy danh sách bài học
    const lessons = await Lesson.find({ chapterId, isPublished: true })
      .select("title videoUrl videoDuration order isPublished")
      .sort({ order: 1 });

    res.status(200).json({
      message: "Lấy danh sách bài học thành công",
      lessons
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách bài học:", error.message);
    next(error);
  }
};

// @route GET /api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId
// @desc Get a lesson by ID
// @access Authenticated users
export const getLessonById = async (req, res, next) => {
  try {
    const { courseId, chapterId, lessonId } = req.params;
    const userId = req.user._id;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài học không hợp lệ" });
    }

    // Kiểm tra khóa học và chương tồn tại
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    // Tìm bài học
    const lesson = await Lesson.findById(lessonId).populate("notes");
    if (!lesson || lesson.chapterId.toString() !== chapterId) {
      return res.status(404).json({ message: "Không tìm thấy bài học hoặc bài học không thuộc chương này" });
    }

    // Kiểm tra quyền truy cập
    const isEnrolled = await Enrollment.exists({ courseId, userId });
    if (!chapter.isPublished && !isEnrolled && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập chương này" });
    }
    if (!lesson.isPublished && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập bài học này" });
    }

    res.status(200).json({
      message: "Lấy bài học thành công",
      lesson: {
        _id: lesson._id,
        chapterId: lesson.chapterId,
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        videoDuration: lesson.videoDuration,
        order: lesson.order,
        transcript: lesson.transcript,
        resources: lesson.resources,
        isPublished: lesson.isPublished,
        notes: lesson.notes
      }
    });
  } catch (error) {
    console.error("Lỗi lấy bài học:", error.message);
    next(error);
  }
};

// @route POST /api/v1/courses/:courseId/chapters/:chapterId/lessons
// @desc Create a new lesson for a chapter
// @access Admin
export const createLesson = async (req, res, next) => {
  try {
    const { courseId, chapterId } = req.params;
    const { title, videoUrl, videoDuration, order, transcript, resources, isPublished } = req.body;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ message: "ID khóa học hoặc chương không hợp lệ" });
    }
    if (!title || !validator.isLength(title, { min: 3, max: 100 })) {
      return res.status(400).json({ message: "Tiêu đề phải có từ 3 đến 100 ký tự" });
    }
    if (!videoUrl || !validator.isURL(videoUrl)) {
      return res.status(400).json({ message: "URL video không hợp lệ" });
    }
    if (!videoDuration || !Number.isFinite(videoDuration) || videoDuration < 0) {
      return res.status(400).json({ message: "Thời lượng video phải là số không âm" });
    }
    if (!order || !Number.isInteger(Number(order)) || order < 1) {
      return res.status(400).json({ message: "Thứ tự phải là số nguyên lớn hơn hoặc bằng 1" });
    }
    if (transcript && !validator.isLength(transcript, { min: 1 })) {
      return res.status(400).json({ message: "Bản ghi không được để trống" });
    }
    if (resources && Array.isArray(resources)) {
      for (const resource of resources) {
        if (!resource.name || !validator.isLength(resource.name, { min: 1, max: 100 })) {
          return res.status(400).json({ message: "Tên tài liệu phải có từ 1 đến 100 ký tự" });
        }
        if (!resource.url || !validator.isURL(resource.url)) {
          return res.status(400).json({ message: "URL tài liệu không hợp lệ" });
        }
        if (!resource.type || !["pdf", "doc", "link", "image"].includes(resource.type)) {
          return res.status(400).json({ message: "Loại tài liệu không hợp lệ" });
        }
      }
    }

    // Kiểm tra khóa học và chương tồn tại
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    // Kiểm tra thứ tự bài học
    const existingLesson = await Lesson.findOne({ chapterId, order });
    if (existingLesson) {
      return res.status(400).json({ message: "Thứ tự bài học đã tồn tại" });
    }

    // Tạo bài học mới
    const lesson = new Lesson({
      chapterId,
      title,
      videoUrl,
      videoDuration,
      order,
      transcript: transcript || null,
      resources: resources && Array.isArray(resources) ? resources : [],
      isPublished: isPublished !== undefined ? isPublished : false,
      notes: []
    });

    await lesson.save();

    // Cập nhật Chapter.lessons
    chapter.lessons.push(lesson._id);
    await chapter.save();

    res.status(201).json({
      message: "Tạo bài học thành công",
      lesson: {
        _id: lesson._id,
        chapterId: lesson.chapterId,
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        videoDuration: lesson.videoDuration,
        order: lesson.order,
        isPublished: lesson.isPublished
      }
    });
  } catch (error) {
    console.error("Lỗi tạo bài học:", error.message);
    next(error);
  }
};

// @route PUT /api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId
// @desc Update a lesson
// @access Admin
export const updateLesson = async (req, res, next) => {
  try {
    const { courseId, chapterId, lessonId } = req.params;
    const { title, videoUrl, videoDuration, order, transcript, resources, isPublished } = req.body;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài học không hợp lệ" });
    }
    if (title && !validator.isLength(title, { min: 3, max: 100 })) {
      return res.status(400).json({ message: "Tiêu đề phải có từ 3 đến 100 ký tự" });
    }
    if (videoUrl && !validator.isURL(videoUrl)) {
      return res.status(400).json({ message: "URL video không hợp lệ" });
    }
    if (videoDuration && (!Number.isFinite(videoDuration) || videoDuration < 0)) {
      return res.status(400).json({ message: "Thời lượng video phải là số không âm" });
    }
    if (order && (!Number.isInteger(Number(order)) || order < 1)) {
      return res.status(400).json({ message: "Thứ tự phải là số nguyên lớn hơn hoặc bằng 1" });
    }
    if (transcript && !validator.isLength(transcript, { min: 1 })) {
      return res.status(400).json({ message: "Bản ghi không được để trống" });
    }
    if (resources && Array.isArray(resources)) {
      for (const resource of resources) {
        if (!resource.name || !validator.isLength(resource.name, { min: 1, max: 100 })) {
          return res.status(400).json({ message: "Tên tài liệu phải có từ 1 đến 100 ký tự" });
        }
        if (!resource.url || !validator.isURL(resource.url)) {
          return res.status(400).json({ message: "URL tài liệu không hợp lệ" });
        }
        if (!resource.type || !["pdf", "doc", "link", "image"].includes(resource.type)) {
          return res.status(400).json({ message: "Loại tài liệu không hợp lệ" });
        }
      }
    }

    // Tìm bài học
    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.chapterId.toString() !== chapterId) {
      return res.status(404).json({ message: "Không tìm thấy bài học hoặc bài học không thuộc chương này" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    // Kiểm tra thứ tự bài học nếu thay đổi
    if (order && order !== lesson.order) {
      const existingLesson = await Lesson.findOne({ chapterId, order, _id: { $ne: lessonId } });
      if (existingLesson) {
        return res.status(400).json({ message: "Thứ tự bài học đã tồn tại" });
      }
    }

    // Cập nhật các trường
    if (title) lesson.title = title;
    if (videoUrl) lesson.videoUrl = videoUrl;
    if (videoDuration !== undefined) lesson.videoDuration = videoDuration;
    if (order) lesson.order = order;
    if (transcript !== undefined) lesson.transcript = transcript || null;
    if (resources && Array.isArray(resources)) lesson.resources = resources;
    if (isPublished !== undefined) lesson.isPublished = isPublished;

    lesson.updatedAt = Date.now();
    await lesson.save();

    res.status(200).json({
      message: "Cập nhật bài học thành công",
      lesson: {
        _id: lesson._id,
        chapterId: lesson.chapterId,
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        videoDuration: lesson.videoDuration,
        order: lesson.order,
        isPublished: lesson.isPublished
      }
    });
  } catch (error) {
    console.error("Lỗi cập nhật bài học:", error.message);
    next(error);
  }
};

// @route DELETE /api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId
// @desc Delete a lesson and related data
// @access Admin
export const deleteLesson = async (req, res, next) => {
  try {
    const { courseId, chapterId, lessonId } = req.params;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài học không hợp lệ" });
    }

    // Tìm bài học
    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.chapterId.toString() !== chapterId) {
      return res.status(404).json({ message: "Không tìm thấy bài học hoặc bài học không thuộc chương này" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    // Kiểm tra khóa học có người đăng ký
    const enrollmentCount = await Enrollment.countDocuments({ courseId });
    if (enrollmentCount > 0) {
      return res.status(400).json({ message: "Không thể xóa bài học khi khóa học đã có người đăng ký" });
    }

    // Xóa notes liên quan
    await Note.deleteMany({ _id: { $in: lesson.notes } });

    // Xóa tiến độ liên quan trong UserProgress
    await UserProgress.updateMany(
      { courseId },
      { $pull: { lessonProgress: { lessonId } } }
    );

    // Xóa bài học khỏi Chapter.lessons
    await Chapter.updateOne(
      { _id: chapterId },
      { $pull: { lessons: lessonId } }
    );

    // Xóa bài học
    await Lesson.deleteOne({ _id: lessonId });

    res.status(200).json({ message: "Xóa bài học thành công" });
  } catch (error) {
    console.error("Lỗi xóa bài học:", error.message);
    next(error);
  }
};

// @route PUT /api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId/publish
// @desc Publish or unpublish a lesson
// @access Admin
export const publishLesson = async (req, res, next) => {
  try {
    const { courseId, chapterId, lessonId } = req.params;
    const { isPublished } = req.body;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài học không hợp lệ" });
    }
    if (isPublished === undefined || typeof isPublished !== "boolean") {
      return res.status(400).json({ message: "Trạng thái xuất bản không hợp lệ" });
    }

    // Tìm bài học
    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.chapterId.toString() !== chapterId) {
      return res.status(404).json({ message: "Không tìm thấy bài học hoặc bài học không thuộc chương này" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    // Cập nhật trạng thái
    lesson.isPublished = isPublished;
    lesson.updatedAt = Date.now();
    await lesson.save();

    res.status(200).json({
      message: `Bài học đã được ${isPublished ? "xuất bản" : "hủy xuất bản"}`,
      lesson: {
        _id: lesson._id,
        chapterId: lesson.chapterId,
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        videoDuration: lesson.videoDuration,
        order: lesson.order,
        isPublished: lesson.isPublished
      }
    });
  } catch (error) {
    console.error("Lỗi xuất bản/hủy xuất bản bài học:", error.message);
    next(error);
  }
};

// @route POST /api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId/resources
// @desc Add a resource to a lesson
// @access Admin
export const addLessonResource = async (req, res, next) => {
  try {
    const { courseId, chapterId, lessonId } = req.params;
    const { name, url, type } = req.body;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài học không hợp lệ" });
    }
    if (!name || !validator.isLength(name, { min: 1, max: 100 })) {
      return res.status(400).json({ message: "Tên tài liệu phải có từ 1 đến 100 ký tự" });
    }
    if (!url || !validator.isURL(url)) {
      return res.status(400).json({ message: "URL tài liệu không hợp lệ" });
    }
    if (!type || !["pdf", "doc", "link", "image"].includes(type)) {
      return res.status(400).json({ message: "Loại tài liệu không hợp lệ" });
    }

    // Tìm bài học
    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.chapterId.toString() !== chapterId) {
      return res.status(404).json({ message: "Không tìm thấy bài học hoặc bài học không thuộc chương này" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    // Thêm tài liệu
    lesson.resources.push({ name, url, type });
    lesson.updatedAt = Date.now();
    await lesson.save();

    res.status(200).json({
      message: "Thêm tài liệu thành công",
      resource: { name, url, type }
    });
  } catch (error) {
    console.error("Lỗi thêm tài liệu:", error.message);
    next(error);
  }
};

// @route DELETE /api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId/resources/:resourceId
// @desc Delete a resource from a lesson
// @access Admin
export const deleteLessonResource = async (req, res, next) => {
  try {
    const { courseId, chapterId, lessonId, resourceId } = req.params;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài học không hợp lệ" });
    }
    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ message: "ID tài liệu không hợp lệ" });
    }

    // Tìm bài học
    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.chapterId.toString() !== chapterId) {
      return res.status(404).json({ message: "Không tìm thấy bài học hoặc bài học không thuộc chương này" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    // Kiểm tra khóa học có người đăng ký
    const enrollmentCount = await Enrollment.countDocuments({ courseId });
    if (enrollmentCount > 0) {
      return res.status(400).json({ message: "Không thể xóa tài liệu khi khóa học đã có người đăng ký" });
    }

    // Xóa tài liệu
    const resourceIndex = lesson.resources.findIndex(r => r._id.toString() === resourceId);
    if (resourceIndex === -1) {
      return res.status(404).json({ message: "Không tìm thấy tài liệu" });
    }
    lesson.resources.splice(resourceIndex, 1);
    lesson.updatedAt = Date.now();
    await lesson.save();

    res.status(200).json({ message: "Xóa tài liệu thành công" });
  } catch (error) {
    console.error("Lỗi xóa tài liệu:", error.message);
    next(error);
  }
};