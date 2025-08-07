import Exercise from "../models/exerciseSchema.js";
import Chapter from "../models/chapterSchema.js";
import Course from "../models/courseSchema.js";
import Enrollment from "../models/enrollmentSchema.js";
import UserProgress from "../models/userProgressSchema.js";
import validator from "validator";
import mongoose from "mongoose";
import cloudinary from "cloudinary";

// @route GET /api/v1/courses/:courseId/chapters/:chapterId/exercises
// @desc Get all exercises of a chapter
// @access Protected
export const getAllExercises = async (req, res, next) => {
  try {
    const { courseId, chapterId } = req.params;
    const userId = req.user._id;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ message: "ID khóa học hoặc chương không hợp lệ" });
    }

    // Kiểm tra khóa học và chương tồn tại
    const course = await Course.findById(courseId);
    if (!course || course.status !== "published") {
      return res.status(404).json({ message: "Không tìm thấy khóa học hoặc khóa học chưa được xuất bản" });
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

    // Lấy danh sách bài tập
    const exercises = await Exercise.find({ chapterId, isPublished: true })
      .select("title type passingScore timeLimit")
      .sort({ order: 1 });

    res.status(200).json({
      message: "Lấy danh sách bài tập thành công",
      exercises
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách bài tập:", error.message);
    next(error);
  }
};

// @route GET /api/v1/courses/:courseId/chapters/:chapterId/exercises/:exerciseId
// @desc Get an exercise by ID for attempting
// @access Protected
export const getExerciseById = async (req, res, next) => {
  try {
    const { courseId, chapterId, exerciseId } = req.params;
    const userId = req.user._id;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(exerciseId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài tập không hợp lệ" });
    }

    // Kiểm tra khóa học và chương tồn tại
    const course = await Course.findById(courseId);
    if (!course || course.status !== "published") {
      return res.status(404).json({ message: "Không tìm thấy khóa học hoặc khóa học chưa được xuất bản" });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này" });
    }

    // Tìm bài tập
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise || exercise.chapterId.toString() !== chapterId) {
      return res.status(404).json({ message: "Không tìm thấy bài tập hoặc bài tập không thuộc chương này" });
    }

    // Kiểm tra quyền truy cập
    const isEnrolled = await Enrollment.exists({ courseId, userId });
    if (!chapter.isPublished && !isEnrolled && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập chương này" });
    }
    if (!exercise.isPublished && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền truy cập bài tập này" });
    }

    // Loại bỏ correctAnswer và explanation từ questions (trừ khi là admin)
    const modifiedQuestions = req.user.role === "admin" ? exercise.questions : exercise.questions.map(q => ({
      questionText: q.questionText,
      questionAudio: q.questionAudio,
      questionImage: q.questionImage,
      options: q.options,
      points: q.points
    }));

    res.status(200).json({
      message: "Lấy bài tập thành công",
      exercise: {
        title: exercise.title,
        type: exercise.type,
        passingScore: exercise.passingScore,
        timeLimit: exercise.timeLimit,
        questions: modifiedQuestions
      }
    });
  } catch (error) {
    console.error("Lỗi lấy bài tập:", error.message);
    next(error);
  }
};

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
    if (!course || course.status !== "published") {
      return res.status(404).json({ message: "Không tìm thấy khóa học hoặc khóa học chưa được xuất bản" });
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

    // Xử lý upload file cho questionAudio/questionImage nếu có
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      // Nếu req.files có file cho câu hỏi này
      if (req.files && req.files[`questionAudio_${i}`]) {
        const audioFile = req.files[`questionAudio_${i}`];
        const result = await cloudinary.v2.uploader.upload(audioFile.tempFilePath, {
          folder: "ielts-toeic-platform/questions/questionAudio"
        });
        q.questionAudio = result.secure_url;
      }
      if (req.files && req.files[`questionImage_${i}`]) {
        const imageFile = req.files[`questionImage_${i}`];
        const result = await cloudinary.v2.uploader.upload(imageFile.tempFilePath, {
          folder: "ielts-toeic-platform/questions/questionImage"
        });
        q.questionImage = result.secure_url;
      }
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
        title: exercise.title,
        type: exercise.type,
        passingScore: exercise.passingScore,
        timeLimit: exercise.timeLimit
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
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        // Nếu có file mới cho audio/image
        if (req.files && req.files[`questionAudio_${i}`]) {
          // Xóa file cũ nếu là Cloudinary
          if (exercise.questions[i] && exercise.questions[i].questionAudio && exercise.questions[i].questionAudio.includes("cloudinary")) {
            const publicId = exercise.questions[i].questionAudio.split("/").slice(-1)[0].split(".")[0];
            await cloudinary.v2.uploader.destroy(`ielts-toeic-platform/questions/questionAudio/${publicId}`);
          }
          const audioFile = req.files[`questionAudio_${i}`];
          const result = await cloudinary.v2.uploader.upload(audioFile.tempFilePath, {
            folder: "ielts-toeic-platform/questions/questionAudio"
          });
          q.questionAudio = result.secure_url;
        }
        if (req.files && req.files[`questionImage_${i}`]) {
          if (exercise.questions[i] && exercise.questions[i].questionImage && exercise.questions[i].questionImage.includes("cloudinary")) {
            const publicId = exercise.questions[i].questionImage.split("/").slice(-1)[0].split(".")[0];
            await cloudinary.v2.uploader.destroy(`ielts-toeic-platform/questions/questionImage/${publicId}`);
          }
          const imageFile = req.files[`questionImage_${i}`];
          const result = await cloudinary.v2.uploader.upload(imageFile.tempFilePath, {
            folder: "ielts-toeic-platform/questions/questionImage"
          });
          q.questionImage = result.secure_url;
        }
        // Nếu xóa audio/image (truyền rỗng/null)
        if (exercise.questions[i] && exercise.questions[i].questionAudio && !q.questionAudio) {
          if (exercise.questions[i].questionAudio.includes("cloudinary")) {
            const publicId = exercise.questions[i].questionAudio.split("/").slice(-1)[0].split(".")[0];
            await cloudinary.v2.uploader.destroy(`ielts-toeic-platform/questions/questionAudio/${publicId}`);
          }
          q.questionAudio = null;
        }
        if (exercise.questions[i] && exercise.questions[i].questionImage && !q.questionImage) {
          if (exercise.questions[i].questionImage.includes("cloudinary")) {
            const publicId = exercise.questions[i].questionImage.split("/").slice(-1)[0].split(".")[0];
            await cloudinary.v2.uploader.destroy(`ielts-toeic-platform/questions/questionImage/${publicId}`);
          }
          q.questionImage = null;
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
        title: exercise.title,
        type: exercise.type,
        passingScore: exercise.passingScore,
        timeLimit: exercise.timeLimit
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

    // Xóa tất cả file questionAudio/questionImage trên Cloudinary nếu là file Cloudinary
    for (const q of exercise.questions) {
      if (q.questionAudio && q.questionAudio.includes("cloudinary")) {
        const publicId = q.questionAudio.split("/").slice(-1)[0].split(".")[0];
        await cloudinary.v2.uploader.destroy(`ielts-toeic-platform/questions/questionAudio/${publicId}`);
      }
      if (q.questionImage && q.questionImage.includes("cloudinary")) {
        const publicId = q.questionImage.split("/").slice(-1)[0].split(".")[0];
        await cloudinary.v2.uploader.destroy(`ielts-toeic-platform/questions/questionImage/${publicId}`);
      }
    }

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
        title: exercise.title,
        type: exercise.type,
        passingScore: exercise.passingScore,
        timeLimit: exercise.timeLimit
      }
    });
  } catch (error) {
    console.error("Lỗi xuất bản/hủy xuất bản bài tập:", error.message);
    next(error);
  }
};

// @route POST /api/v1/courses/:courseId/chapters/:chapterId/exercises/:exerciseId/submit
// @desc Submit exercise answers and get results
// @access Protected
export const submitExercise = async (req, res, next) => {
  try {
    const { courseId, chapterId, exerciseId } = req.params;
    const { answers, timeSpent } = req.body;
    const userId = req.user._id;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(exerciseId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài tập không hợp lệ" });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Câu trả lời phải là một mảng" });
    }

    // Kiểm tra quyền truy cập
    const isEnrolled = await Enrollment.exists({ courseId, userId });
    if (!isEnrolled && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn chưa đăng ký khóa học này" });
    }

    // Tìm bài tập
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise || exercise.chapterId.toString() !== chapterId) {
      return res.status(404).json({ message: "Không tìm thấy bài tập" });
    }

    // Tính điểm và kiểm tra đáp án
    let correctAnswers = 0;
    let totalQuestions = exercise.questions.length;
    const detailedAnswers = [];

    for (let i = 0; i < exercise.questions.length; i++) {
      const question = exercise.questions[i];
      const userAnswer = answers[i];
      
      // Convert to same type for comparison
      const userAnswerNum = Number(userAnswer);
      const correctAnswerNum = Number(question.correctAnswer);
      const isCorrect = userAnswerNum === correctAnswerNum;

      console.log(`Question ${i}: userAnswer=${userAnswer} (${typeof userAnswer}), correctAnswer=${question.correctAnswer} (${typeof question.correctAnswer}), isCorrect=${isCorrect}`);

      if (isCorrect) {
        correctAnswers++;
      }

      detailedAnswers.push({
        questionIndex: i,
        userAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect
      });
    }

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const isPassed = score >= exercise.passingScore;

    // Tìm UserProgress
    let userProgress = await UserProgress.findOne({ userId, courseId });
    if (!userProgress) {
      return res.status(404).json({ message: "Không tìm thấy tiến độ học tập" });
    }

    // Tìm chapter progress
    let chapterProgress = userProgress.chapterProgress.find(
      cp => cp.chapterId.toString() === chapterId
    );

    if (!chapterProgress) {
      return res.status(404).json({ message: "Không tìm thấy tiến độ chương" });
    }

    // Tìm hoặc tạo exercise result
    let exerciseResult = chapterProgress.exerciseResults.find(
      er => er.exerciseId.toString() === exerciseId
    );

    console.log(`Found ${chapterProgress.exerciseResults.length} exercise results for chapter ${chapterId}`);
    console.log(`Looking for exercise ${exerciseId}`);
    chapterProgress.exerciseResults.forEach((er, index) => {
      console.log(`Exercise result ${index}: exerciseId=${er.exerciseId}, attempts=${er.attempts}, score=${er.score}`);
    });

    if (!exerciseResult) {
      console.log(`Creating new exercise result for exercise ${exerciseId}`);
      exerciseResult = {
        exerciseId: exerciseId,
        score: 0,
        totalQuestions: totalQuestions,
        correctAnswers: 0,
        isPassed: false,
        timeSpent: 0,
        attempts: 1,
        lastAttemptAt: new Date(),
        answers: []
      };
      chapterProgress.exerciseResults.push(exerciseResult);
    } else {
      console.log(`Found existing exercise result: attempts=${exerciseResult.attempts}, score=${exerciseResult.score}`);
    }

    // Cập nhật kết quả
    exerciseResult.score = score;
    exerciseResult.correctAnswers = correctAnswers;
    exerciseResult.isPassed = isPassed;
    exerciseResult.timeSpent = timeSpent || 0;
    exerciseResult.attempts += 1;
    exerciseResult.lastAttemptAt = new Date();
    exerciseResult.answers = detailedAnswers;

    await userProgress.save();

    res.status(200).json({
      message: "Nộp bài tập thành công",
      result: {
        score: score,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        isPassed: isPassed,
        timeSpent: exerciseResult.timeSpent,
        attempts: exerciseResult.attempts,
        detailedAnswers: detailedAnswers
      }
    });

  } catch (error) {
    console.error("Lỗi nộp bài tập:", error.message);
    next(error);
  }
};

// @route GET /api/v1/courses/:courseId/chapters/:chapterId/exercises/:exerciseId/results
// @desc Get exercise results for the current user
// @access Protected
export const getExerciseResults = async (req, res, next) => {
  try {
    const { courseId, chapterId, exerciseId } = req.params;
    const userId = req.user._id;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(exerciseId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài tập không hợp lệ" });
    }

    // Kiểm tra quyền truy cập
    const isEnrolled = await Enrollment.exists({ courseId, userId });
    if (!isEnrolled && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn chưa đăng ký khóa học này" });
    }

    // Tìm UserProgress
    const userProgress = await UserProgress.findOne({ userId, courseId });
    if (!userProgress) {
      return res.status(404).json({ message: "Không tìm thấy tiến độ học tập" });
    }

    // Tìm exercise result
    const chapterProgress = userProgress.chapterProgress.find(
      cp => cp.chapterId.toString() === chapterId
    );

    if (!chapterProgress) {
      return res.status(404).json({ message: "Không tìm thấy tiến độ chương" });
    }

    console.log(`Getting results: Found ${chapterProgress.exerciseResults.length} exercise results for chapter ${chapterId}`);
    console.log(`Looking for exercise ${exerciseId}`);
    chapterProgress.exerciseResults.forEach((er, index) => {
      console.log(`Exercise result ${index}: exerciseId=${er.exerciseId}, attempts=${er.attempts}, score=${er.score}`);
    });

    const exerciseResult = chapterProgress.exerciseResults.find(
      er => er.exerciseId.toString() === exerciseId
    );

    if (!exerciseResult) {
      return res.status(404).json({ message: "Chưa có kết quả bài tập này" });
    }

    console.log(`Found exercise result: attempts=${exerciseResult.attempts}, score=${exerciseResult.score}, answers=${exerciseResult.answers.length}`);

    res.status(200).json({
      message: "Lấy kết quả bài tập thành công",
      result: {
        score: exerciseResult.score,
        correctAnswers: exerciseResult.correctAnswers,
        totalQuestions: exerciseResult.totalQuestions,
        isPassed: exerciseResult.isPassed,
        timeSpent: exerciseResult.timeSpent,
        attempts: exerciseResult.attempts,
        lastAttemptAt: exerciseResult.lastAttemptAt,
        detailedAnswers: exerciseResult.answers
      }
    });

  } catch (error) {
    console.error("Lỗi lấy kết quả bài tập:", error.message);
    next(error);
  }
};