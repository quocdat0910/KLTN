import Exercise from "../models/exerciseSchema.js";
import Chapter from "../models/chapterSchema.js";
import Course from "../models/courseSchema.js";
import Enrollment from "../models/enrollmentSchema.js";
import UserProgress from "../models/userProgressSchema.js";
import validator from "validator";
import mongoose from "mongoose";

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
    const exercises = await Exercise.find(req.user.role === "admin" ? { chapterId } : { chapterId, isPublished: true })
      .select("title type passingScore timeLimit googleSheetUrl")
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
    const { courseId, chapterId, exerciseId } = req.params; // exerciseId sẽ có mặt cho các yêu cầu PUT
    const { title, type, order, passingScore, timeLimit, questions, isPublished, googleSheetUrl } = req.body;

    // 1. Xác thực các trường đầu vào chung (áp dụng cho cả tạo và cập nhật)
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ message: "ID khóa học hoặc chương không hợp lệ" });
    }
    if (!title || !validator.isLength(title.trim(), { min: 3, max: 100 })) {
      return res.status(400).json({ message: "Tiêu đề phải có từ 3 đến 100 ký tự" });
    }
    if (!type || !["multiple-choice", "true-false"].includes(type)) {
      return res.status(400).json({ message: "Loại bài tập phải là 'multiple-choice' hoặc 'true-false'" });
    }
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Cần ít nhất một câu hỏi để tạo bài tập" });
    }

    // Xác thực mảng câu hỏi
    for (const q of questions) {
      if (!q.questionText || !validator.isLength(q.questionText.trim(), { min: 1 })) {
        return res.status(400).json({ message: "Câu hỏi không được để trống" });
      }
      if (q.questionAudio && !validator.isURL(q.questionAudio, { require_protocol: true })) {
        return res.status(400).json({ message: "URL âm thanh không hợp lệ" });
      }
      if (q.questionImage && !validator.isURL(q.questionImage, { require_protocol: true })) {
        return res.status(400).json({ message: "URL hình ảnh không hợp lệ" });
      }

      if (type === "multiple-choice") {
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({ message: "Câu hỏi trắc nghiệm phải có ít nhất 2 đáp án" });
        }
        const parsedCorrectAnswer = Number(q.correctAnswer);
        if (!Number.isInteger(parsedCorrectAnswer) || parsedCorrectAnswer < 0 || parsedCorrectAnswer >= q.options.length) {
          return res.status(400).json({ message: "Đáp án đúng không hợp lệ cho câu hỏi trắc nghiệm (phải là chỉ số từ 0 đến số lượng đáp án - 1)" });
        }
      } else if (type === "true-false") {
        if (String(q.correctAnswer).toLowerCase() !== "true" && String(q.correctAnswer).toLowerCase() !== "false") {
          return res.status(400).json({ message: "Đáp án đúng phải là 'true' hoặc 'false' cho câu hỏi Đúng/Sai" });
        }
      } else {
        return res.status(400).json({ message: "Loại bài tập không hợp lệ cho câu hỏi chi tiết" });
      }

      if (!Number.isFinite(q.points) || q.points < 0) {
        return res.status(400).json({ message: "Điểm câu hỏi phải là số không âm" });
      }
    }

    // 2. Kiểm tra sự tồn tại của Khóa học và Chương
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học." });
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.courseId.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này." });
    }

    let exerciseDoc;

    if (exerciseId) { // Đây là thao tác cập nhật (PUT)
      if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
        return res.status(400).json({ message: "ID bài tập không hợp lệ" });
      }
      exerciseDoc = await Exercise.findById(exerciseId);
      if (!exerciseDoc) {
        return res.status(404).json({ message: "Không tìm thấy bài tập để cập nhật." });
      }

      // Xử lý trường 'order' cho cập nhật: chỉ cập nhật nếu được cung cấp và hợp lệ
      // Đối với import từ Google Sheet, trường order KHÔNG được gửi trong req.body cho PUT, vì vậy khối này sẽ bị bỏ qua.
      if (order !== undefined && order !== null) { // Nếu order được gửi rõ ràng để cập nhật
        const parsedOrder = parseInt(order);
        if (isNaN(parsedOrder) || parsedOrder < 1) {
          return res.status(400).json({ message: "Thứ tự phải là số nguyên lớn hơn hoặc bằng 1" });
        }
        // Kiểm tra tính duy nhất của thứ tự, loại trừ bài tập đang được cập nhật
        const existingExerciseWithSameOrder = await Exercise.findOne({
          chapterId,
          order: parsedOrder,
          _id: { $ne: exerciseId }
        });
        if (existingExerciseWithSameOrder) {
          return res.status(400).json({ message: "Thứ tự bài tập đã tồn tại trong chương này cho bài tập khác. Vui lòng chọn thứ tự khác." });
        }
        exerciseDoc.order = parsedOrder; // Cập nhật thứ tự
      }
      // Cập nhật các trường khác
      exerciseDoc.title = title.trim();
      exerciseDoc.type = type;
      // Chỉ cập nhật passingScore, timeLimit, isPublished nếu chúng được cung cấp rõ ràng trong req.body
      // Điều này đảm bảo rằng nếu frontend không gửi chúng, chúng sẽ giữ nguyên giá trị cũ.
      if (passingScore !== undefined) exerciseDoc.passingScore = passingScore;
      if (timeLimit !== undefined) exerciseDoc.timeLimit = timeLimit === '' ? null : timeLimit;
      if (isPublished !== undefined) exerciseDoc.isPublished = isPublished;
      exerciseDoc.questions = questions; // Cập nhật mảng câu hỏi

      console.log("Exercise object trước khi save:", JSON.stringify(exerciseDoc, null, 2));
      await exerciseDoc.save();

      res.status(200).json({
        message: "Cập nhật bài tập thành công!",
        exercise: {
          _id: exerciseDoc._id,
          title: exerciseDoc.title,
          type: exerciseDoc.type,
          order: exerciseDoc.order,
          passingScore: exerciseDoc.passingScore,
          timeLimit: exerciseDoc.timeLimit,
          isPublished: exerciseDoc.isPublished,
          questions: exerciseDoc.questions,
          googleSheetUrl: exerciseDoc.googleSheetUrl,
        }
      });

    } else { // Đây là thao tác tạo mới (POST)
      let finalOrder;

      // Xác định thứ tự cho bài tập mới
      const parsedOrderFromReq = parseInt(order);
      if (order !== undefined && order !== null && !isNaN(parsedOrderFromReq) && parsedOrderFromReq >= 1) {
        // Nếu order được cung cấp và hợp lệ trong req.body, sử dụng nó.
        finalOrder = parsedOrderFromReq;
      } else {
        // Ngược lại, tìm số nguyên dương nhỏ nhất chưa được sử dụng làm thứ tự.
        const existingOrders = await Exercise.find({ chapterId }, { order: 1, _id: 0 }).sort({ order: 1 });
        const orderSet = new Set(existingOrders.map(ex => ex.order));
        let candidateOrder = 1;
        while (orderSet.has(candidateOrder)) {
            candidateOrder++;
        }
        finalOrder = candidateOrder;
      }

      // Kiểm tra cuối cùng về tính duy nhất của thứ tự (nên hiếm khi cần nếu logic trên đúng)
      const existingExerciseWithSameOrder = await Exercise.findOne({ chapterId, order: finalOrder });
      if (existingExerciseWithSameOrder) {
          // Trường hợp này cực kỳ hiếm nếu logic trên là đúng.
          // Nó ngụ ý một tình huống race condition hoặc trạng thái không mong muốn.
          return res.status(400).json({ message: "Không thể gán thứ tự duy nhất cho bài tập mới. Vui lòng thử lại hoặc kiểm tra dữ liệu chương." });
      }

      // Tạo bài tập mới
      exerciseDoc = new Exercise({
        chapterId,
        title: title.trim(),
        type,
        order: finalOrder, // Sử dụng thứ tự duy nhất cuối cùng đã xác định
        passingScore: passingScore !== undefined ? passingScore : 0, // Mặc định cho bài tập mới
        timeLimit: timeLimit !== undefined ? (timeLimit === '' ? null : timeLimit) : null, // Mặc định cho bài tập mới
        isPublished: isPublished !== undefined ? isPublished : false, // Mặc định cho bài tập mới
        questions,
        googleSheetUrl: googleSheetUrl?.trim() || ''
      });

      console.log("Exercise object trước khi save:", JSON.stringify(exerciseDoc, null, 2));
      await exerciseDoc.save();

      // Cập nhật Chapter.exercises
      if (!chapter.exercises) {
        chapter.exercises = [];
      }
      chapter.exercises.push(exerciseDoc._id);
      await chapter.save();

      res.status(201).json({
        message: "Tạo bài tập thành công!",
        exercise: {
          _id: exerciseDoc._id,
          title: exerciseDoc.title,
          type: exerciseDoc.type,
          order: exerciseDoc.order,
          passingScore: exerciseDoc.passingScore,
          timeLimit: exerciseDoc.timeLimit,
          isPublished: exerciseDoc.isPublished,
          questions: exerciseDoc.questions
        }
      });
    }
  } catch (error) {
    console.error("Lỗi xử lý bài tập:", error.message);
    next(error);
  }
};

// @route PUT /api/v1/courses/:courseId/chapters/:chapterId/exercises/:exerciseId
// @desc Update an exercise
// @access Admin
export const updateExercise = async (req, res, next) => {
  try {
    const { courseId, chapterId, exerciseId } = req.params;
    const { title, type, order, passingScore, timeLimit, questions, isPublished, googleSheetUrl } = req.body;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId) || !mongoose.Types.ObjectId.isValid(exerciseId)) {
      return res.status(400).json({ message: "ID khóa học, chương hoặc bài tập không hợp lệ" });
    }
    // if (googleSheetUrl !== undefined) {
    //   exercise.googleSheetUrl = googleSheetUrl?.trim() || '';
    // }
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
        if (q.correctAnswer === undefined || q.correctAnswer === null) {
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
    if (googleSheetUrl !== undefined) exercise.googleSheetUrl = googleSheetUrl?.trim() || '';

    console.log("Exercise object trước khi save:", JSON.stringify(exercise, null, 2));
    exercise.updatedAt = Date.now();
    await exercise.save();

    res.status(200).json({
      message: "Cập nhật bài tập thành công",
      exercise: {
        title: exercise.title,
        type: exercise.type,
        passingScore: exercise.passingScore,
        timeLimit: exercise.timeLimit,
        googleSheetUrl: exercise.googleSheetUrl,
      }
    });
  } catch (error) {
    console.error("Lỗi cập nhật bài tập:", error, error.stack);
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

// @route POST /api/v1/courses/:courseId/chapters/:chapterId/exercises/sync-from-sheet
// @desc Sync exercises from Google Sheet (dùng googleSheetUrl lưu trong Chapter)
// @access Admin
export const syncQuizzesFromGoogleSheet = async (req, res, next) => {
  try {
    const { courseId, chapterId } = req.params;

    // 1. Tìm chương học và kiểm tra thuộc khóa học
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.course.toString() !== courseId) {
      return res.status(404).json({ message: "Không tìm thấy chương hoặc chương không thuộc khóa học này để đồng bộ bài tập." });
    }

    // 2. Lấy URL Google Sheet từ Chapter
    const googleSheetUrl = chapter.googleSheetUrl;
    if (!googleSheetUrl) {
      return res.status(400).json({ message: "Chương này chưa có URL Google Sheet để đồng bộ bài tập." });
    }

    // 3. Trích xuất spreadsheet ID từ URL
    const sheetIdMatch = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch || !sheetIdMatch[1]) {
      return res.status(400).json({ message: "URL Google Sheet không hợp lệ. Không tìm thấy Spreadsheet ID." });
    }
    const spreadsheetId = sheetIdMatch[1];
    const range = 'Sheet1!A:Z'; // Giả định dữ liệu nằm trong Sheet1

    // 4. Xác thực Google API
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // 5. Đọc dữ liệu từ sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return res.status(200).json({ message: "Không có dữ liệu trong Google Sheet hoặc thiếu hàng." });
    }

    const headers = rows[0].map(h => h.trim());
    const exercisesDataFromSheet = rows.slice(1).map(row => {
      const exercise = {};
      headers.forEach((header, index) => {
        exercise[header.replace(/\s/g, '')] = row[index];
      });
      return exercise;
    });

    // 6. Xử lý dữ liệu
    const existingExercises = await Exercise.find({ chapter: chapterId });
    const existingMap = new Map(existingExercises.map(ex => [ex._id.toString(), ex]));
    const changes = { created: 0, updated: 0, deleted: 0 };
    const exercisesToKeep = new Set();
    const newExerciseIds = [];

    for (let i = 0; i < exercisesDataFromSheet.length; i++) {
      const sheetExercise = exercisesDataFromSheet[i];
      const rowIndex = i + 2;

      if (!sheetExercise.Title || !sheetExercise.Question || !sheetExercise.Order) {
        console.warn(`Hàng ${rowIndex} thiếu thông tin cần thiết, bỏ qua.`);
        continue;
      }

      const type = sheetExercise.Type || 'multiple-choice';
      const questions = [];
      let correctAnswer = sheetExercise.CorrectAnswer;

      if (type === 'multiple-choice') {
        const options = ['A', 'B', 'C', 'D'].map((label, idx) => ({
          text: sheetExercise[`Option${label}`] || '',
          isCorrect: false,
        })).filter(o => o.text.trim() !== '');

        if (options.length < 2) {
          console.warn(`Hàng ${rowIndex}: cần ít nhất 2 đáp án.`);
          continue;
        }

        const indexMap = { A: 0, B: 1, C: 2, D: 3 };
        const correctIndex = indexMap[correctAnswer?.toUpperCase()] ?? -1;
        if (correctIndex === -1 || !options[correctIndex]) {
          console.warn(`Hàng ${rowIndex}: đáp án không hợp lệ.`);
          continue;
        }
        options[correctIndex].isCorrect = true;

        questions.push({
          questionText: sheetExercise.Question,
          options,
          correctAnswer: correctIndex,
          points: parseInt(sheetExercise.Points) || 1,
          questionAudio: sheetExercise.QuestionAudio || '',
          questionImage: sheetExercise.QuestionImage || '',
        });
      } else if (type === 'true-false') {
        const answer = String(correctAnswer).toLowerCase();
        if (answer !== 'true' && answer !== 'false') {
          console.warn(`Hàng ${rowIndex}: đáp án true/false không hợp lệ.`);
          continue;
        }
        questions.push({
          questionText: sheetExercise.Question,
          correctAnswer: answer,
          points: parseInt(sheetExercise.Points) || 1,
          questionAudio: sheetExercise.QuestionAudio || '',
          questionImage: sheetExercise.QuestionImage || '',
        });
      } else {
        console.warn(`Hàng ${rowIndex}: loại bài tập không hỗ trợ.`);
        continue;
      }

      const exerciseObj = {
        title: sheetExercise.Title,
        type,
        order: parseInt(sheetExercise.Order),
        passingScore: parseInt(sheetExercise.PassingScore) || 0,
        timeLimit: parseInt(sheetExercise.TimeLimit) || null,
        isPublished: (sheetExercise.IsPublished || '').toLowerCase() === 'true',
        questions,
        chapter: chapterId,
      };

      const exerciseId = sheetExercise.ExerciseId;
      if (exerciseId && mongoose.Types.ObjectId.isValid(exerciseId) && existingMap.has(exerciseId)) {
        const updated = await Exercise.findByIdAndUpdate(exerciseId, exerciseObj, { new: true });
        if (updated) {
          changes.updated++;
          exercisesToKeep.add(updated._id.toString());
        }
      } else {
        const created = await Exercise.create(exerciseObj);
        changes.created++;
        exercisesToKeep.add(created._id.toString());
        newExerciseIds.push({ rowIndex, newId: created._id.toString() });
      }
    }

    // 7. Xóa bài tập không còn trong sheet
    for (const oldExercise of existingExercises) {
      if (!exercisesToKeep.has(oldExercise._id.toString())) {
        await Exercise.findByIdAndDelete(oldExercise._id);
        changes.deleted++;
      }
    }

    // 8. Cập nhật lại danh sách bài tập của chương
    const updatedExercises = await Exercise.find({ chapter: chapterId }).select('_id');
    chapter.exercises = updatedExercises.map(ex => ex._id);
    await chapter.save();

    // 9. Ghi lại các ID mới vào Google Sheet
    try {
      if (newExerciseIds.length > 0) {
        const exerciseIdIndex = headers.indexOf('ExerciseId');
        if (exerciseIdIndex !== -1) {
          const colLetter = String.fromCharCode(65 + exerciseIdIndex);
          const updates = newExerciseIds.map(item => ({
            range: `Sheet1!${colLetter}${item.rowIndex}`,
            values: [[item.newId]],
          }));

          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            requestBody: {
              data: updates,
              valueInputOption: 'RAW',
            },
          });
        }
      }
    } catch (err) {
      console.warn("Không thể ghi ID mới lên Google Sheet:", err.message);
    }

    res.status(200).json({
      message: `Đồng bộ thành công: ${changes.created} tạo mới, ${changes.updated} cập nhật, ${changes.deleted} xóa.`,
      changes,
    });

  } catch (error) {
    console.error("Lỗi khi đồng bộ bài tập từ Google Sheet:", error.message);
    next(error);
  }
};

