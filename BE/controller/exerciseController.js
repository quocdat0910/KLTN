import Exercise from "../models/exerciseSchema.js";
import Chapter from "../models/chapterSchema.js";
import Course from "../models/courseSchema.js";
import Enrollment from "../models/enrollmentSchema.js";
import UserProgress from "../models/userProgressSchema.js";
import validator from "validator";
import mongoose from "mongoose";

// @route POST /api/v1/courses/:courseId/chapters/:chapterId/exercises
// @desc Create a new exercise for a chapter
// @access Admin
export const createExercise = async (req, res, next) => {
  try {
    const { courseId, chapterId } = req.params;
    const { title, type, order, passingScore, timeLimit, questions, isPublished } = req.body;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ message: "ID khóa học hoặc chương không hợp lệ" });
    }
    if (!title || !validator.isLength(title, { min: 3, max: 100 })) {
      return res.status(400).json({ message: "Tiêu đề phải có từ 3 đến 100 ký tự" });
    }
    if (!type || !["multiple-choice", "true-false"].includes(type)) {
      return res.status(400).json({ message: "Loại bài tập phải là 'multiple-choice' hoặc 'true-false'" });
    }
    if (!order || !Number.isInteger(Number(order)) || order < 1) {
      return res.status(400).json({ message: "Thứ tự phải là số nguyên lớn hơn hoặc bằng 1" });
    }
    if (!Number.isFinite(passingScore) || passingScore < 0 || passingScore > 100) {
      return res.status(400).json({ message: "Điểm tối thiểu phải từ 0 đến 100" });
    }
    if (timeLimit !== undefined && timeLimit !== null && (!Number.isFinite(timeLimit) || timeLimit < 0)) {
      return res.status(400).json({ message: "Thời gian giới hạn phải là số không âm hoặc null" });
    }
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Cần ít nhất một câu hỏi" });
    }

    // Kiểm tra các câu hỏi
    for (const q of questions) {
      if (!q.questionText || !validator.isLength(q.questionText, { min: 1 })) {
        return res.status(400).json({ message: "Câu hỏi không được để trống" });
      }
      if (q.questionAudio && !validator.isURL(q.questionAudio)) {
        return res.status(400).json({ message: "URL âm thanh không hợp lệ" });
      }
      if (q.questionImage && !validator.isURL(q.questionImage)) {
        return res.status(400).json({ message: "URL hình ảnh không hợp lệ" });
      }
      if (type === "multiple-choice" && (!q.options || !Array.isArray(q.options) || q.options.length < 2)) {
        return res.status(400).json({ message: "Câu hỏi trắc nghiệm phải có ít nhất 2 đáp án" });
      }
      if (!q.correctAnswer) {
        return res.status(400).json({ message: "Đáp án đúng là bắt buộc" });
      }
      if (type === "multiple-choice" && (!Number.isInteger(Number(q.correctAnswer)) || q.correctAnswer < 0 || q.correctAnswer >= q.options.length)) {
        return res.status(400).json({ message: "Đáp án đúng không hợp lệ cho câu hỏi trắc nghiệm" });
      }
      if (type === "true-false" && q.correctAnswer !== "true" && q.correctAnswer !== "false") {
        return res.status(400).json({ message: "Đáp án đúng phải là true hoặc false" });
      }
      if (!Number.isFinite(q.points) || q.points < 0) {
        return res.status(400).json({ message: "Điểm câu hỏi phải là số không âm" });
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

    // Kiểm tra thứ tự bài tập
    const existingExercise = await Exercise.findOne({ chapterId, order });
    if (existingExercise) {
      return res.status(400).json({ message: "Thứ tự bài tập đã tồn tại" });
    }

    // Tạo bài tập mới
    const exercise = new Exercise({
      chapterId,
      title,
      type,
      order,
      passingScore,
      timeLimit: timeLimit || null,
      isPublished: isPublished !== undefined ? isPublished : false,
      questions
    });

    await exercise.save();

    // Cập nhật Chapter.exercises
    chapter.exercises.push(exercise._id);
    await chapter.save();

    res.status(201).json({
      message: "Tạo bài tập thành công",
      exercise: {
        _id: exercise._id,
        chapterId: exercise.chapterId,
        title: exercise.title,
        type: exercise.type,
        order: exercise.order,
        passingScore: exercise.passingScore,
        timeLimit: exercise.timeLimit,
        isPublished: exercise.isPublished
      }
    });
  } catch (error) {
    console.error("Lỗi tạo bài tập:", error.message);
    next(error);
  }
};

// @route PUT /api/v1/courses/:courseId/chapters/:chapterId/exercises/:exerciseId
// @desc Update an exercise
// @access Admin
export const updateExercise = async (req, res, next) => {
  try {
    const { courseId, chapterId, exerciseId } = req.params;
    const { title, type, order, passingScore, timeLimit, questions, isPublished } = req.body;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(exerciseId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài tập không hợp lệ" });
    }
    if (title && !validator.isLength(title, { min: 3, max: 100 })) {
      return res.status(400).json({ message: "Tiêu đề phải có từ 3 đến 100 ký tự" });
    }
    if (type && !["multiple-choice", "true-false"].includes(type)) {
      return res.status(400).json({ message: "Loại bài tập phải là 'multiple-choice' hoặc 'true-false'" });
    }
    if (order && (!Number.isInteger(Number(order)) || order < 1)) {
      return res.status(400).json({ message: "Thứ tự phải là số nguyên lớn hơn hoặc bằng 1" });
    }
    if (passingScore !== undefined && (!Number.isFinite(passingScore) || passingScore < 0 || passingScore > 100)) {
      return res.status(400).json({ message: "Điểm tối thiểu phải từ 0 đến 100" });
    }
    if (timeLimit !== undefined && timeLimit !== null && (!Number.isFinite(timeLimit) || timeLimit < 0)) {
      return res.status(400).json({ message: "Thời gian giới hạn phải là số không âm hoặc null" });
    }
    if (questions && (!Array.isArray(questions) || questions.length === 0)) {
      return res.status(400).json({ message: "Cần ít nhất một câu hỏi" });
    }

    // Kiểm tra các câu hỏi nếu được cung cấp
    if (questions) {
      for (const q of questions) {
        if (!q.questionText || !validator.isLength(q.questionText, { min: 1 })) {
          return res.status(400).json({ message: "Câu hỏi không được để trống" });
        }
        if (q.questionAudio && !validator.isURL(q.questionAudio)) {
          return res.status(400).json({ message: "URL âm thanh không hợp lệ" });
        }
        if (q.questionImage && !validator.isURL(q.questionImage)) {
          return res.status(400).json({ message: "URL hình ảnh không hợp lệ" });
        }
        if (type === "multiple-choice" && (!q.options || !Array.isArray(q.options) || q.options.length < 2)) {
          return res.status(400).json({ message: "Câu hỏi trắc nghiệm phải có ít nhất 2 đáp án" });
        }
        if (!q.correctAnswer) {
          return res.status(400).json({ message: "Đáp án đúng là bắt buộc" });
        }
        if (type === "multiple-choice" && (!Number.isInteger(Number(q.correctAnswer)) || q.correctAnswer < 0 || q.correctAnswer >= q.options.length)) {
          return res.status(400).json({ message: "Đáp án đúng không hợp lệ cho câu hỏi trắc nghiệm" });
        }
        if (type === "true-false" && q.correctAnswer !== "true" && q.correctAnswer !== "false") {
          return res.status(400).json({ message: "Đáp án đúng phải là true hoặc false" });
        }
        if (!Number.isFinite(q.points) || q.points < 0) {
          return res.status(400).json({ message: "Điểm câu hỏi phải là số không âm" });
        }
      }
    }

    // Tìm bài tập
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise || exercise.chapterId.toString() !== chapterId) {
      return res.status(404).json({ message: "Không tìm thấy bài tập hoặc bài tập không thuộc chương này" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    // Kiểm tra thứ tự bài tập nếu thay đổi
    if (order && order !== exercise.order) {
      const existingExercise = await Exercise.findOne({ chapterId, order, _id: { $ne: exerciseId } });
      if (existingExercise) {
        return res.status(400).json({ message: "Thứ tự bài tập đã tồn tại" });
      }
    }

    // Cập nhật các trường
    if (title) exercise.title = title;
    if (type) exercise.type = type;
    if (order) exercise.order = order;
    if (passingScore !== undefined) exercise.passingScore = passingScore;
    if (timeLimit !== undefined) exercise.timeLimit = timeLimit || null;
    if (questions) exercise.questions = questions;
    if (isPublished !== undefined) exercise.isPublished = isPublished;

    exercise.updatedAt = Date.now();
    await exercise.save();

    res.status(200).json({
      message: "Cập nhật bài tập thành công",
      exercise: {
        _id: exercise._id,
        chapterId: exercise.chapterId,
        title: exercise.title,
        type: exercise.type,
        order: exercise.order,
        passingScore: exercise.passingScore,
        timeLimit: exercise.timeLimit,
        isPublished: exercise.isPublished
      }
    });
  } catch (error) {
    console.error("Lỗi cập nhật bài tập:", error.message);
    next(error);
  }
};

// @route DELETE /api/v1/courses/:courseId/chapters/:chapterId/exercises/:exerciseId
// @desc Delete an exercise and related data
// @access Admin
export const deleteExercise = async (req, res, next) => {
  try {
    const { courseId, chapterId, exerciseId } = req.params;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(exerciseId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài tập không hợp lệ" });
    }

    // Tìm bài tập
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise || exercise.chapterId.toString() !== chapterId) {
      return res.status(404).json({ message: "Không tìm thấy bài tập hoặc bài tập không thuộc chương này" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    // Kiểm tra khóa học có người đăng ký
    const enrollmentCount = await Enrollment.countDocuments({ courseId });
    if (enrollmentCount > 0) {
      return res.status(400).json({ message: "Không thể xóa bài tập khi khóa học đã có người đăng ký" });
    }

    // Xóa tiến độ liên quan trong UserProgress
    await UserProgress.updateMany(
      { courseId },
      { $pull: { exerciseProgress: { exerciseId } } }
    );

    // Xóa bài tập khỏi Chapter.exercises
    await Chapter.updateOne(
      { _id: chapterId },
      { $pull: { exercises: exerciseId } }
    );

    // Xóa bài tập
    await Exercise.deleteOne({ _id: exerciseId });

    res.status(200).json({ message: "Xóa bài tập thành công" });
  } catch (error) {
    console.error("Lỗi xóa bài tập:", error.message);
    next(error);
  }
};

// @route PUT /api/v1/courses/:courseId/chapters/:chapterId/exercises/:exerciseId/publish
// @desc Publish or unpublish an exercise
// @access Admin
export const publishExercise = async (req, res, next) => {
  try {
    const { courseId, chapterId, exerciseId } = req.params;
    const { isPublished } = req.body;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(exerciseId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài tập không hợp lệ" });
    }
    if (isPublished === undefined || typeof isPublished !== "boolean") {
      return res.status(400).json({ message: "Trạng thái xuất bản không hợp lệ" });
    }

    // Tìm bài tập
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise || exercise.chapterId.toString() !== chapterId) {
      return res.status(404).json({ message: "Không tìm thấy bài tập hoặc bài tập không thuộc chương này" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    // Cập nhật trạng thái
    exercise.isPublished = isPublished;
    exercise.updatedAt = Date.now();
    await exercise.save();

    res.status(200).json({
      message: `Bài tập đã được ${isPublished ? "xuất bản" : "hủy xuất bản"}`,
      exercise: {
        _id: exercise._id,
        chapterId: exercise.chapterId,
        title: exercise.title,
        type: exercise.type,
        order: exercise.order,
        passingScore: exercise.passingScore,
        timeLimit: exercise.timeLimit,
        isPublished: exercise.isPublished
      }
    });
  } catch (error) {
    console.error("Lỗi xuất bản/hủy xuất bản bài tập:", error.message);
    next(error);
  }
};