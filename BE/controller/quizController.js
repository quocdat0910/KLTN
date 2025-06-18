import Quiz from '../models/quizSchema.js';
import QuizSubmission from '../models/quizSubmissionSchema.js';
import Chapter from '../models/chapterSchema.js';
import Course from '../models/courseSchema.js';
import Purchase from '../models/purchaseSchema.js';
import validator from 'validator';

export const createQuiz = async (req, res, next) => {
  try {
    const { title, questions, order } = req.body;
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
    if (!title || !questions || !order) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }
    if (!validator.isLength(title, { min: 3, max: 100 })) {
      return res.status(400).json({ message: 'Tiêu đề phải từ 3-100 ký tự' });
    }
    if (!Number.isInteger(order) || order < 1) {
      return res.status(400).json({ message: 'Thứ tự phải là số nguyên dương' });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Danh sách câu hỏi không hợp lệ' });
    }

    // Kiểm tra câu hỏi
    for (const question of questions) {
      if (!question.text || !Array.isArray(question.options) || question.options.length !== 4) {
        return res.status(400).json({ message: 'Mỗi câu hỏi phải có 4 đáp án' });
      }
      const correctOptions = question.options.filter(opt => opt.isCorrect);
      if (correctOptions.length !== 1) {
        return res.status(400).json({ message: 'Mỗi câu hỏi phải có đúng 1 đáp án đúng' });
      }
    }

    // Kiểm tra thứ tự trùng lặp
    const existingQuiz = await Quiz.findOne({ chapter: chapterId, order });
    if (existingQuiz) {
      return res.status(400).json({ message: 'Thứ tự bài tập đã tồn tại' });
    }

    const quiz = await Quiz.create({ chapter: chapterId, title, questions, order });
    res.status(201).json({ message: 'Tạo bài tập thành công', quiz });
  } catch (error) {
    console.error('Lỗi tạo bài tập:', error.message);
    next(error);
  }
};

export const getQuizzes = async (req, res, next) => {
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

    const quizzes = await Quiz.find({ chapter: chapterId }).sort('order').select('-questions.options.isCorrect');
    res.status(200).json({ quizzes });
  } catch (error) {
    console.error('Lỗi lấy danh sách bài tập:', error.message);
    next(error);
  }
};

export const updateQuiz = async (req, res, next) => {
  try {
    const { title, questions, order } = req.body;
    const quizId = req.params.quizId;

    // Kiểm tra bài tập
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Không tìm thấy bài tập' });
    }

    // Kiểm tra chương
    const chapter = await Chapter.findById(quiz.chapter);
    if (!chapter) {
      return res.status(404).json({ message: 'Không tìm thấy chương' });
    }

    // Kiểm tra đầu vào
    if (title && !validator.isLength(title, { min: 3, max: 100 })) {
      return res.status(400).json({ message: 'Tiêu đề phải từ 3-100 ký tự' });
    }
    if (order && (!Number.isInteger(order) || order < 1)) {
      return res.status(400).json({ message: 'Thứ tự phải là số nguyên dương' });
    }
    if (questions && (!Array.isArray(questions) || questions.length === 0)) {
      return res.status(400).json({ message: 'Danh sách câu hỏi không hợp lệ' });
    }
    if (questions) {
      for (const question of questions) {
        if (!question.text || !Array.isArray(question.options) || question.options.length !== 4) {
          return res.status(400).json({ message: 'Mỗi câu hỏi phải có 4 đáp án' });
        }
        const correctOptions = question.options.filter(opt => opt.isCorrect);
        if (correctOptions.length !== 1) {
          return res.status(400).json({ message: 'Mỗi câu hỏi phải có đúng 1 đáp án đúng' });
        }
      }
    }

    // Kiểm tra thứ tự trùng lặp
    if (order && order !== quiz.order) {
      const existingQuiz = await Quiz.findOne({ chapter: quiz.chapter, order });
      if (existingQuiz) {
        return res.status(400).json({ message: 'Thứ tự bài tập đã tồn tại' });
      }
    }

    // Cập nhật bài tập
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      {
        title: title || quiz.title,
        questions: questions || quiz.questions,
        order: order || quiz.order,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Cập nhật bài tập thành công', quiz: updatedQuiz });
  } catch (error) {
    console.error('Lỗi cập nhật bài tập:', error.message);
    next(error);
  }
};

export const deleteQuiz = async (req, res, next) => {
  try {
    const quizId = req.params.quizId;

    // Kiểm tra bài tập
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Không tìm thấy bài tập' });
    }

    // Xóa các bài nộp liên quan
    await QuizSubmission.deleteMany({ quiz: quizId });

    // Xóa bài tập
    await Quiz.findByIdAndDelete(quizId);

    res.status(200).json({ message: 'Xóa bài tập thành công' });
  } catch (error) {
    console.error('Lỗi xóa bài tập:', error.message);
    next(error);
  }
};

export const submitQuiz = async (req, res, next) => {
  try {
    const quizId = req.params.quizId;
    const userId = req.user._id;
    const { answers } = req.body; // answers: [{ questionId, selectedOption }]

    // Kiểm tra bài tập
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Không tìm thấy bài tập' });
    }

    // Kiểm tra chương
    const chapter = await Chapter.findById(quiz.chapter);
    if (!chapter) {
      return res.status(404).json({ message: 'Không tìm thấy chương' });
    }

    // Kiểm tra quyền sở hữu khóa học
    const course = await Course.findById(chapter.course);
    const purchase = await Purchase.findOne({ user: userId, course: chapter.course });
    if (!purchase) {
      return res.status(403).json({ message: 'Bạn chưa sở hữu khóa học này' });
    }

    // Kiểm tra đầu vào
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      return res.status(400).json({ message: 'Số lượng đáp án không khớp' });
    }
    for (const answer of answers) {
      if (!answer.questionId || answer.selectedOption === undefined || answer.selectedOption < 0 || answer.selectedOption > 3) {
        return res.status(400).json({ message: 'Đáp án không hợp lệ' });
      }
      const question = quiz.questions.find(q => q._id.toString() === answer.questionId.toString());
      if (!question) {
        return res.status(400).json({ message: 'Câu hỏi không tồn tại' });
      }
    }

    // Tính điểm
    let score = 0;
    const processedAnswers = [];
    for (const answer of answers) {
      const question = quiz.questions.find(q => q._id.toString() === answer.questionId.toString());
      if (question.options[answer.selectedOption].isCorrect) {
        score += 1 / quiz.questions.length * 100; // Điểm mỗi câu = 100 / số câu hỏi
      }
      processedAnswers.push({
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
      });
    }
    score = Math.round(score);

    // Lưu kết quả
    const submission = await QuizSubmission.create({
      user: userId,
      quiz: quizId,
      answers: processedAnswers,
      score,
    });

    res.status(201).json({ message: 'Nộp bài thành công', submission, score });
  } catch (error) {
    console.error('Lỗi nộp bài tập:', error.message);
    next(error);
  }
};