import Chapter from "../models/chapterSchema.js";
import Course from "../models/courseSchema.js";
import Lesson from "../models/lessonSchema.js";
import Exercise from "../models/exerciseSchema.js";
import Enrollment from "../models/enrollmentSchema.js";
import UserProgress from "../models/userProgressSchema.js";
import validator from "validator";
import mongoose from "mongoose";

// @route POST /api/v1/courses/:courseId/chapters
// @desc Create a new chapter for a course
// @access Admin
export const createChapter = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, order, isLocked, isPublished, lessons, exercises } = req.body;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "ID khóa học không hợp lệ" });
    }
    if (!title || !validator.isLength(title, { min: 3, max: 100 })) {
      return res.status(400).json({ message: "Tiêu đề phải có từ 3 đến 100 ký tự" });
    }
    if (!order || !Number.isInteger(Number(order)) || order < 1) {
      return res.status(400).json({ message: "Thứ tự phải là số nguyên lớn hơn hoặc bằng 1" });
    }

    // Kiểm tra khóa học tồn tại
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Kiểm tra thứ tự chương
    const existingChapter = await Chapter.findOne({ courseId, order });
    if (existingChapter) {
      return res.status(400).json({ message: "Thứ tự chương đã tồn tại" });
    }

    // Kiểm tra lessons và exercises nếu được cung cấp
    if (lessons && Array.isArray(lessons)) {
      const validLessons = await Lesson.find({ _id: { $in: lessons } });
      if (validLessons.length !== lessons.length) {
        return res.status(400).json({ message: "Một hoặc nhiều bài học không hợp lệ" });
      }
    }
    if (exercises && Array.isArray(exercises)) {
      const validExercises = await Exercise.find({ _id: { $in: exercises } });
      if (validExercises.length !== exercises.length) {
        return res.status(400).json({ message: "Một hoặc nhiều bài tập không hợp lệ" });
      }
    }

    // Tạo chương mới
    const chapter = new Chapter({
      courseId,
      title,
      order,
      isLocked: isLocked !== undefined ? isLocked : true,
      isPublished: isPublished !== undefined ? isPublished : false,
      lessons: lessons && Array.isArray(lessons) ? lessons : [],
      exercises: exercises && Array.isArray(exercises) ? exercises : [],
      duration: 0 // Sẽ được tính trong pre-save hook
    });

    await chapter.save();

    // Cập nhật Course.chapters
    course.chapters.push(chapter._id);
    await course.save();

    res.status(201).json({
      message: "Tạo chương thành công",
      chapter: {
        _id: chapter._id,
        courseId: chapter.courseId,
        title: chapter.title,
        order: chapter.order,
        isLocked: chapter.isLocked,
        isPublished: chapter.isPublished
      }
    });
  } catch (error) {
    console.error("Lỗi tạo chương:", error.message);
    next(error);
  }
};

// @route PUT /api/v1/courses/:courseId/chapters/:chapterId
// @desc Update a chapter
// @access Admin
export const updateChapter = async (req, res, next) => {
  try {
    const { courseId, chapterId } = req.params;
    const { title, order, isLocked, isPublished, lessons, exercises } = req.body;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ message: "ID khóa học hoặc chương không hợp lệ" });
    }
    if (title && !validator.isLength(title, { min: 3, max: 100 })) {
      return res.status(400).json({ message: "Tiêu đề phải có từ 3 đến 100 ký tự" });
    }
    if (order && (!Number.isInteger(Number(order)) || order < 1)) {
      return res.status(400).json({ message: "Thứ tự phải là số nguyên lớn hơn hoặc bằng 1" });
    }

    // Tìm chương
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    // Kiểm tra thứ tự chương nếu thay đổi
    if (order && order !== chapter.order) {
      const existingChapter = await Chapter.findOne({ courseId, order, _id: { $ne: chapterId } });
      if (existingChapter) {
        return res.status(400).json({ message: "Thứ tự chương đã tồn tại" });
      }
    }

    // Kiểm tra lessons và exercises nếu được cung cấp
    if (lessons && Array.isArray(lessons)) {
      const validLessons = await Lesson.find({ _id: { $in: lessons } });
      if (validLessons.length !== lessons.length) {
        return res.status(400).json({ message: "Một hoặc nhiều bài học không hợp lệ" });
      }
    }
    if (exercises && Array.isArray(exercises)) {
      const validExercises = await Exercise.find({ _id: { $in: exercises } });
      if (validExercises.length !== exercises.length) {
        return res.status(400).json({ message: "Một hoặc nhiều bài tập không hợp lệ" });
      }
    }

    // Cập nhật các trường
    if (title) chapter.title = title;
    if (order) chapter.order = order;
    if (isLocked !== undefined) chapter.isLocked = isLocked;
    if (isPublished !== undefined) chapter.isPublished = isPublished;
    if (lessons && Array.isArray(lessons)) chapter.lessons = lessons;
    if (exercises && Array.isArray(exercises)) chapter.exercises = exercises;

    chapter.updatedAt = Date.now();
    await chapter.save();

    res.status(200).json({
      message: "Cập nhật chương thành công",
      chapter: {
        _id: chapter._id,
        courseId: chapter.courseId,
        title: chapter.title,
        order: chapter.order,
        isLocked: chapter.isLocked,
        isPublished: chapter.isPublished
      }
    });
  } catch (error) {
    console.error("Lỗi cập nhật chương:", error.message);
    next(error);
  }
};

// @route DELETE /api/v1/courses/:courseId/chapters/:chapterId
// @desc Delete a chapter and related data
// @access Admin
export const deleteChapter = async (req, res, next) => {
  try {
    const { courseId, chapterId } = req.params;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ message: "ID khóa học hoặc chương không hợp lệ" });
    }

    // Tìm chương
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    // Kiểm tra khóa học có người đăng ký
    const enrollmentCount = await Enrollment.countDocuments({ courseId });
    if (enrollmentCount > 0) {
      return res.status(400).json({ message: "Không thể xóa chương khi khóa học đã có người đăng ký" });
    }

    // Xóa lessons và exercises liên quan
    await Lesson.deleteMany({ _id: { $in: chapter.lessons } });
    await Exercise.deleteMany({ _id: { $in: chapter.exercises } });

    // Xóa tiến độ liên quan trong UserProgress
    await UserProgress.updateMany(
      { courseId },
      { $pull: { chapterProgress: { chapterId } } }
    );

    // Xóa chương khỏi Course.chapters
    await Course.updateOne(
      { _id: courseId },
      { $pull: { chapters: chapterId } }
    );

    // Xóa chương
    await Chapter.deleteOne({ _id: chapterId });

    res.status(200).json({ message: "Xóa chương thành công" });
  } catch (error) {
    console.error("Lỗi xóa chương:", error.message);
    next(error);
  }
};

// @route PUT /api/v1/courses/:courseId/chapters/:chapterId/publish
// @desc Publish or unpublish a chapter
// @access Admin
export const publishChapter = async (req, res, next) => {
  try {
    const { courseId, chapterId } = req.params;
    const { isPublished } = req.body;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ message: "ID khóa học hoặc chương không hợp lệ" });
    }
    if (isPublished === undefined || typeof isPublished !== "boolean") {
      return res.status(400).json({ message: "Trạng thái xuất bản không hợp lệ" });
    }

    // Tìm chương
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    // Cập nhật trạng thái
    chapter.isPublished = isPublished;
    chapter.updatedAt = Date.now();
    await chapter.save();

    res.status(200).json({
      message: `Chương đã được ${isPublished ? "xuất bản" : "hủy xuất bản"}`,
      chapter: {
        _id: chapter._id,
        courseId: chapter.courseId,
        title: chapter.title,
        order: chapter.order,
        isPublished: chapter.isPublished
      }
    });
  } catch (error) {
    console.error("Lỗi xuất bản/hủy xuất bản chương:", error.message);
    next(error);
  }
};

// @route GET /api/v1/courses/:courseId/chapters
export const getAllChaptersByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "ID khóa học không hợp lệ" });
    }

    // Check if the course exists (optional, but good for robust error handling)
    const courseExists = await Course.exists({ _id: courseId });
    if (!courseExists) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Find all chapters for the given courseId and sort them by order
    const chapters = await Chapter.find({ courseId }).sort({ order: 1 });

    res.status(200).json({
      message: "Lấy danh sách chương thành công",
      chapters
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chương:", error.message);
    next(error);
  }
};

// @route GET /api/v1/courses/:courseId/chapters-with-content
// @desc Get all chapters with lessons and exercises for enrolled users
// @access Protected
export const getChaptersWithContent = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "ID khóa học không hợp lệ" });
    }

    // Check if user is enrolled in this course
    const enrollment = await Enrollment.findOne({ userId, courseId });
    if (!enrollment) {
      return res.status(403).json({ message: "Bạn chưa đăng ký khóa học này" });
    }

    // Find all chapters with lessons and exercises
    const chapters = await Chapter.find({ courseId })
      .populate({
        path: 'lessons',
        select: 'title videoUrl videoDuration order isPublished',
        match: { isPublished: true }
      })
      .populate({
        path: 'exercises',
        select: 'title description questions order isPublished',
        match: { isPublished: true }
      })
      .sort({ order: 1 });

    res.status(200).json({
      message: "Lấy danh sách chương với nội dung thành công",
      chapters
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chương với nội dung:", error.message);
    next(error);
  }
};

// @route GET /api/v1/courses/:courseId/chapters/:chapterId
// @desc Get details of a single chapter (and its lessons/exercises)
// @access Public (or adjust based on your needs, e.g., Admin for full details, or if it's for an enrolled user)
export const getChapterDetails = async (req, res, next) => {
  try {
    const { courseId, chapterId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ message: "ID khóa học hoặc chương không hợp lệ" });
    }

    // Find the chapter and populate its lessons and exercises
    // Consider carefully what fields you want to populate for security and performance.
    // For admin, you might want all fields. For public, perhaps only published lessons/exercises.
    const chapter = await Chapter.findOne({ _id: chapterId, courseId })
      .populate({
        path: 'lessons',
        select: '-__v -createdAt -updatedAt' // Exclude these fields from lessons
      })
      .populate({
        path: 'exercises',
        select: '-__v -createdAt -updatedAt' // Exclude these fields from exercises
      });

    if (!chapter) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    res.status(200).json({
      message: "Lấy chi tiết chương thành công",
      chapter
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết chương:", error.message);
    next(error);
  }
};

