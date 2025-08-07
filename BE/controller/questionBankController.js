import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { QuestionBank } from "../models/placementTestSchema.js";
import ErrorHandler from "../utils/errorHandler.js";
import axios from "axios";

// Lấy tất cả câu hỏi trong ngân hàng
export const getAllQuestions = catchAsyncErrors(async (req, res, next) => {
  const { questionType, testType, difficulty, source, page = 1, limit = 20 } = req.query;
  
  const filter = {};
  if (questionType) filter.questionType = questionType;
  if (testType) filter.testType = testType;
  if (difficulty) filter.difficulty = difficulty;
  if (source) filter.source = source;
  filter.isActive = true;

  const skip = (page - 1) * limit;
  
  const questions = await QuestionBank.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await QuestionBank.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Tạo câu hỏi bằng AI
export const generateQuestionsWithAI = catchAsyncErrors(async (req, res, next) => {
  const { questionType, testType, difficulty, count = 5, autoAddToBank = false } = req.body;

  if (!questionType || !testType || !difficulty) {
    return next(new ErrorHandler('Thiếu thông tin bắt buộc', 400));
  }

  try {
    // Gọi AI service
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    const response = await axios.post(`${aiServiceUrl}/api/generate-questions`, {
      questionType,
      testType,
      difficulty,
      count: parseInt(count),
      autoAddToBank
    });

    const { questions, addedToBank } = response.data;

    // Nếu không tự động thêm vào bank, thêm thủ công
    let manuallyAdded = [];
    if (!autoAddToBank && questions.length > 0) {
      manuallyAdded = await addQuestionsToBank(questions, req.user.id);
    }

    res.status(200).json({
      success: true,
      data: {
        questions,
        addedToBank: autoAddToBank ? addedToBank : manuallyAdded,
        totalGenerated: questions.length
      }
    });

  } catch (error) {
    console.error('AI service error:', error);
    return next(new ErrorHandler('Lỗi khi tạo câu hỏi bằng AI', 500));
  }
});

// Thêm câu hỏi vào ngân hàng
export const addQuestionToBank = catchAsyncErrors(async (req, res, next) => {
  const {
    question,
    questionType,
    testType,
    difficulty,
    options,
    correctAnswer,
    explanation,
    passage,
    audioUrl
  } = req.body;

  if (!question || !questionType || !testType || !difficulty) {
    return next(new ErrorHandler('Thiếu thông tin bắt buộc', 400));
  }

  const newQuestion = new QuestionBank({
    question,
    questionType,
    testType,
    difficulty,
    options: options || [],
    correctAnswer,
    explanation: explanation || '',
    passage: passage || '',
    audioUrl: audioUrl || '',
    source: 'admin',
    createdBy: req.user.id,
    isActive: true,
    usageCount: 0
  });

  await newQuestion.save();

  res.status(201).json({
    success: true,
    data: newQuestion
  });
});

// Cập nhật câu hỏi
export const updateQuestion = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const question = await QuestionBank.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!question) {
    return next(new ErrorHandler('Không tìm thấy câu hỏi', 404));
  }

  res.status(200).json({
    success: true,
    data: question
  });
});

// Xóa câu hỏi (soft delete)
export const deleteQuestion = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const question = await QuestionBank.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!question) {
    return next(new ErrorHandler('Không tìm thấy câu hỏi', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Đã xóa câu hỏi thành công'
  });
});

// Lấy thống kê câu hỏi
export const getQuestionStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await QuestionBank.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: {
          questionType: '$questionType',
          testType: '$testType',
          source: '$source'
        },
        count: { $sum: 1 },
        totalUsage: { $sum: '$usageCount' }
      }
    }
  ]);

  const difficultyStats = await QuestionBank.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$difficulty',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      byType: stats,
      byDifficulty: difficultyStats
    }
  });
});

// Helper function: Thêm câu hỏi vào bank
async function addQuestionsToBank(questions, userId) {
  const addedQuestions = [];
  for (const question of questions) {
    const newQuestion = new QuestionBank({
      question: question.question,
      questionType: question.questionType,
      testType: question.testType,
      difficulty: question.difficulty,
      options: question.options || [],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
      passage: question.passage || '',
      audioUrl: question.audioUrl || '',
      source: 'ai_generated',
      createdBy: userId,
      isActive: true,
      usageCount: 0
    });

    await newQuestion.save();
    addedQuestions.push({
      id: newQuestion._id,
      question: newQuestion.question,
      questionType: newQuestion.questionType
    });
  }

  return addedQuestions;
}

// Thêm câu hỏi từ AI service (không cần authentication)
export const addQuestionsFromAI = catchAsyncErrors(async (req, res, next) => {
  const { questions } = req.body;

  if (!questions || !Array.isArray(questions)) {
    return next(new ErrorHandler('Thiếu dữ liệu câu hỏi', 400));
  }

  try {
    const addedQuestions = [];
    
    for (const question of questions) {
      const newQuestion = new QuestionBank({
        question: question.question,
        questionType: question.questionType,
        testType: question.testType,
        difficulty: question.difficulty,
        options: question.options || [],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || '',
        passage: question.passage || '',
        audioUrl: question.audioUrl || '',
        source: 'ai_generated',
        // Không set createdBy vì source là ai_generated
        isActive: true,
        usageCount: 0
      });

      await newQuestion.save();
      addedQuestions.push({
        id: newQuestion._id,
        question: newQuestion.question,
        questionType: newQuestion.questionType
      });
    }

    res.status(201).json({
      success: true,
      data: {
        addedQuestions,
        totalAdded: addedQuestions.length
      }
    });

  } catch (error) {
    console.error('Error adding questions from AI:', error);
    return next(new ErrorHandler('Lỗi khi thêm câu hỏi từ AI service', 500));
  }
}); 