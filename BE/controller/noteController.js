import Note from "../models/noteSchema.js";
import Lesson from "../models/lessonSchema.js";
import Chapter from "../models/chapterSchema.js";
import Course from "../models/courseSchema.js";
import Enrollment from "../models/enrollmentSchema.js";
import mongoose from "mongoose";

// @route GET /api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId/notes
// @desc Get all notes of the current user for a lesson
// @access Protected
export const getLessonNotes = async (req, res, next) => {
  try {
    const { courseId, chapterId, lessonId } = req.params;
    const userId = req.user._id;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài học không hợp lệ" });
    }

    // Kiểm tra khóa học, chương và bài học tồn tại
    const course = await Course.findById(courseId);
    if (!course || course.status !== "published") {
      return res.status(404).json({ message: "Không tìm thấy khóa học hoặc khóa học chưa được xuất bản" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }
    const lesson = await Lesson.findById(lessonId);
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

    // Lấy ghi chú của người dùng
    const notes = await Note.find({ userId, lessonId })
      .select("content timestamp createdAt updatedAt")
      .sort({ timestamp: 1 });

    res.status(200).json({
      message: "Lấy danh sách ghi chú thành công",
      notes
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách ghi chú:", error.message);
    next(error);
  }
};

// @route POST /api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId/notes
// @desc Add a new note for a lesson
// @access Protected
export const addLessonNote = async (req, res, next) => {
  try {
    const { courseId, chapterId, lessonId } = req.params;
    const { content, timestamp } = req.body;
    const userId = req.user._id;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài học không hợp lệ" });
    }
    if (!content || typeof content !== "string" || content.trim().length < 1 || content.trim().length > 1000) {
      return res.status(400).json({ message: "Nội dung ghi chú phải từ 1 đến 1000 ký tự" });
    }
    if (!Number.isFinite(timestamp) || timestamp < 0) {
      return res.status(400).json({ message: "Thời gian ghi chú phải là số không âm" });
    }

    // Kiểm tra khóa học, chương và bài học tồn tại
    const course = await Course.findById(courseId);
    if (!course || course.status !== "published") {
      return res.status(404).json({ message: "Không tìm thấy khóa học hoặc khóa học chưa được xuất bản" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }
    const lesson = await Lesson.findById(lessonId);
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

    // Tạo ghi chú mới
    const note = new Note({
      userId,
      lessonId,
      content: content.trim(),
      timestamp
    });

    await note.save();

    res.status(201).json({
      message: "Thêm ghi chú thành công",
      note: {
        content: note.content,
        timestamp: note.timestamp,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      }
    });
  } catch (error) {
    console.error("Lỗi thêm ghi chú:", error.message);
    next(error);
  }
};

// @route PUT /api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId/notes/:noteId
// @desc Update a note
// @access Protected
export const updateLessonNote = async (req, res, next) => {
  try {
    const { courseId, chapterId, lessonId, noteId } = req.params;
    const { content, timestamp } = req.body;
    const userId = req.user._id;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(lessonId) || !mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: "ID khóa học, chương, bài học hoặc ghi chú không hợp lệ" });
    }
    if (content && (typeof content !== "string" || content.trim().length < 1 || content.trim().length > 1000)) {
      return res.status(400).json({ message: "Nội dung ghi chú phải từ 1 đến 1000 ký tự" });
    }
    if (timestamp !== undefined && (!Number.isFinite(timestamp) || timestamp < 0)) {
      return res.status(400).json({ message: "Thời gian ghi chú phải là số không âm" });
    }

    // Kiểm tra khóa học, chương và bài học tồn tại
    const course = await Course.findById(courseId);
    if (!course || course.status !== "published") {
      return res.status(404).json({ message: "Không tìm thấy khóa học hoặc khóa học chưa được xuất bản" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }
    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.chapterId.toString() !== chapterId) {
      return res.status(404).json({ message: "Không tìm thấy bài học hoặc bài học không thuộc chương này" });
    }

    // Tìm ghi chú
    const note = await Note.findById(noteId);
    if (!note || note.lessonId.toString() !== lessonId || note.userId.toString() !== userId.toString()) {
      return res.status(404).json({ message: "Không tìm thấy ghi chú hoặc bạn không có quyền chỉnh sửa" });
    }

    // Kiểm tra quyền truy cập
    const isEnrolled = await Enrollment.exists({ courseId, userId });
    if (!chapter.isPublished && !isEnrolled && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập chương này" });
    }
    if (!lesson.isPublished && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập bài học này" });
    }

    // Cập nhật ghi chú
    if (content) note.content = content.trim();
    if (timestamp !== undefined) note.timestamp = timestamp;
    note.updatedAt = Date.now();
    await note.save();

    res.status(200).json({
      message: "Cập nhật ghi chú thành công",
      note: {
        content: note.content,
        timestamp: note.timestamp,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      }
    });
  } catch (error) {
    console.error("Lỗi cập nhật ghi chú:", error.message);
    next(error);
  }
};

// @route DELETE /api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId/notes/:noteId
// @desc Delete a note
// @access Protected
export const deleteLessonNote = async (req, res, next) => {
  try {
    const { courseId, chapterId, lessonId, noteId } = req.params;
    const userId = req.user._id;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(lessonId) || !mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: "ID khóa học, chương, bài học hoặc ghi chú không hợp lệ" });
    }

    // Kiểm tra khóa học, chương và bài học tồn tại
    const course = await Course.findById(courseId);
    if (!course || course.status !== "published") {
      return res.status(404).json({ message: "Không tìm thấy khóa học hoặc khóa học chưa được xuất bản" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }
    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.chapterId.toString() !== chapterId) {
      return res.status(404).json({ message: "Không tìm thấy bài học hoặc bài học không thuộc chương này" });
    }

    // Tìm ghi chú
    const note = await Note.findById(noteId);
    if (!note || note.lessonId.toString() !== lessonId || note.userId.toString() !== userId.toString()) {
      return res.status(404).json({ message: "Không tìm thấy ghi chú hoặc bạn không có quyền xóa" });
    }

    // Kiểm tra quyền truy cập
    const isEnrolled = await Enrollment.exists({ courseId, userId });
    if (!chapter.isPublished && !isEnrolled && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập chương này" });
    }
    if (!lesson.isPublished && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập bài học này" });
    }

    // Xóa ghi chú khỏi Lesson.notes
    await Lesson.updateOne(
      { _id: lessonId },
      { $pull: { notes: noteId } }
    );

    // Xóa ghi chú
    await Note.deleteOne({ _id: noteId });

    res.status(200).json({ message: "Xóa ghi chú thành công" });
  } catch (error) {
    console.error("Lỗi xóa ghi chú:", error.message);
    next(error);
  }
};

// @route GET /api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId/notes/all
// @desc Get all notes for a lesson (admin only)
// @access Admin
export const getAllLessonNotes = async (req, res, next) => {
  try {
    const { courseId, chapterId, lessonId } = req.params;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài học không hợp lệ" });
    }

    // Kiểm tra khóa học, chương và bài học tồn tại
    const course = await Course.findById(courseId);
    if (!course || course.status !== "published") {
      return res.status(404).json({ message: "Không tìm thấy khóa học hoặc khóa học chưa được xuất bản" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }
    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.chapterId.toString() !== chapterId) {
      return res.status(404).json({ message: "Không tìm thấy bài học hoặc bài học không thuộc chương này" });
    }

    // Lấy tất cả ghi chú
    const notes = await Note.find({ lessonId })
      .populate("userId", "name email")
      .select("userId content timestamp createdAt updatedAt")
      .sort({ timestamp: 1 });

    res.status(200).json({
      message: "Lấy tất cả ghi chú thành công",
      notes
    });
  } catch (error) {
    console.error("Lỗi lấy tất cả ghi chú:", error.message);
    next(error);
  }
};

// @route GET /api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId/notes/user/:userId
// @desc Get all notes of a specific user for a lesson (admin only)
// @access Admin
export const getNotesByUser = async (req, res, next) => {
  try {
    const { courseId, chapterId, lessonId, userId } = req.params;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(lessonId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID khóa học, chương, bài học hoặc người dùng không hợp lệ" });
    }

    // Kiểm tra khóa học, chương và bài học tồn tại
    const course = await Course.findById(courseId);
    if (!course || course.status !== "published") {
      return res.status(404).json({ message: "Không tìm thấy khóa học hoặc khóa học chưa được xuất bản" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }
    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.chapterId.toString() !== chapterId) {
      return res.status(404).json({ message: "Không tìm thấy bài học hoặc bài học không thuộc chương này" });
    }

    // Lấy ghi chú của người dùng
    const notes = await Note.find({ userId, lessonId })
      .select("content timestamp createdAt updatedAt")
      .sort({ timestamp: 1 });

    res.status(200).json({
      message: "Lấy ghi chú của người dùng thành công",
      notes
    });
  } catch (error) {
    console.error("Lỗi lấy ghi chú của người dùng:", error.message);
    next(error);
  }
};