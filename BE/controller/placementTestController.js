import { QuestionBank, PlacementTest, PlacementTestResult } from '../models/placementTestSchema.js';
import User from '../models/userSchema.js';
import Course from '../models/courseSchema.js';
import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../utils/errorHandler.js';
import axios from 'axios';

// Tạo ngân hàng câu hỏi (Admin)
export const createQuestionBank = catchAsyncErrors(async (req, res, next) => {
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

  // Validate required fields
  if (!question || !questionType || !testType || !difficulty) {
    return next(new ErrorHandler('Vui lòng cung cấp đầy đủ thông tin câu hỏi', 400));
  }

  // Validate options and correctAnswer for non-writing questions
  if (questionType !== 'writing') {
    if (!options || !Array.isArray(options) || options.length < 2) {
      return next(new ErrorHandler('Câu hỏi phải có ít nhất 2 lựa chọn', 400));
    }
    if (!correctAnswer) {
      return next(new ErrorHandler('Vui lòng cung cấp đáp án đúng', 400));
    }
  }

  const questionBankItem = await QuestionBank.create({
    question,
    questionType,
    testType,
    difficulty,
    options: questionType !== 'writing' ? options : [],
    correctAnswer: questionType !== 'writing' ? correctAnswer : undefined,
    explanation,
    passage,
    audioUrl,
    source: 'admin',
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'Tạo câu hỏi thành công',
    data: questionBankItem
  });
});

// Lấy danh sách câu hỏi trong ngân hàng
export const getQuestionBank = catchAsyncErrors(async (req, res, next) => {
  const { questionType, testType, difficulty, source, page = 1, limit = 20 } = req.query;

  const filter = { isActive: true };
  if (questionType) filter.questionType = questionType;
  if (testType) filter.testType = testType;
  if (difficulty) filter.difficulty = difficulty;
  if (source) filter.source = source;

  const skip = (page - 1) * limit;
  
  const questions = await QuestionBank.find(filter)
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await QuestionBank.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      questions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// Tạo AI-generated questions
export const generateAIQuestions = catchAsyncErrors(async (req, res, next) => {
  const { questionType, testType, difficulty, count = 5 } = req.body;

  if (!questionType || !testType || !difficulty) {
    return next(new ErrorHandler('Vui lòng cung cấp đầy đủ thông tin', 400));
  }

  try {
    // Gọi AI service để generate questions
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    const response = await axios.post(`${aiServiceUrl}/api/generate-questions`, {
      questionType,
      testType,
      difficulty,
      count
    });

    const generatedQuestions = response.data.questions;
    
    // Lưu vào database
    const savedQuestions = [];
    for (const questionData of generatedQuestions) {
      const question = await QuestionBank.create({
        ...questionData,
        source: 'ai_generated',
        createdBy: req.user.id
      });
      savedQuestions.push(question);
    }

    res.status(201).json({
      success: true,
      message: `Đã tạo ${savedQuestions.length} câu hỏi bằng AI`,
      data: savedQuestions
    });

  } catch (error) {
    console.error('Error generating AI questions:', error);
    return next(new ErrorHandler('Không thể tạo câu hỏi bằng AI', 500));
  }
});

// Tạo placement test
export const createPlacementTest = catchAsyncErrors(async (req, res, next) => {
  const { testType, questionIds, timeLimit = 60 } = req.body;

  if (!testType || !questionIds || !Array.isArray(questionIds)) {
    return next(new ErrorHandler('Vui lòng cung cấp đầy đủ thông tin', 400));
  }

  // Validate questions exist
  const questions = await QuestionBank.find({ 
    _id: { $in: questionIds }, 
    testType, 
    isActive: true 
  });

  if (questions.length !== questionIds.length) {
    return next(new ErrorHandler('Một số câu hỏi không tồn tại hoặc không phù hợp', 400));
  }

  // Tạo placement test
  const placementTest = await PlacementTest.create({
    testType,
    questions: questions.map(q => ({
      questionId: q._id,
      questionType: q.questionType,
      weight: 1
    })),
    totalQuestions: questions.length,
    timeLimit,
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'Tạo placement test thành công',
    data: placementTest
  });
});

// Lấy placement test cho user
export const getPlacementTest = catchAsyncErrors(async (req, res, next) => {
  const { testType } = req.params;

  if (!['IELTS', 'TOEIC'].includes(testType)) {
    return next(new ErrorHandler('Loại test không hợp lệ', 400));
  }

  // Kiểm tra user đã làm placement test chưa
  const existingResult = await PlacementTestResult.findOne({
    userId: req.user.id,
    testType,
    isCompleted: true
  }).sort({ createdAt: -1 });

  if (existingResult) {
    return res.status(200).json({
      success: true,
      message: 'Bạn đã hoàn thành placement test',
      data: {
        hasCompleted: true,
        result: existingResult
      }
    });
  }

  // Lấy placement test active
  const placementTest = await PlacementTest.findOne({
    testType,
    isActive: true
  }).populate({
    path: 'questions.questionId',
    select: 'question questionType options passage audioUrl difficulty'
  }).sort({ createdAt: -1 });

  if (!placementTest) {
    return next(new ErrorHandler('Không tìm thấy placement test', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      hasCompleted: false,
      test: placementTest
    }
  });
});

// Submit placement test
export const submitPlacementTest = catchAsyncErrors(async (req, res, next) => {
  const { placementTestId, answers, timeSpent, startedAt } = req.body;

  if (!placementTestId || !answers || !Array.isArray(answers)) {
    return next(new ErrorHandler('Dữ liệu không hợp lệ', 400));
  }

  // Validate placement test exists
  const placementTest = await PlacementTest.findById(placementTestId)
    .populate('questions.questionId');

  if (!placementTest) {
    return next(new ErrorHandler('Placement test không tồn tại', 404));
  }

  // Kiểm tra user đã làm test này chưa
  const existingResult = await PlacementTestResult.findOne({
    userId: req.user.id,
    placementTestId,
    isCompleted: true
  });

  if (existingResult) {
    return next(new ErrorHandler('Bạn đã hoàn thành test này rồi', 400));
  }

  // Validate answers
  const processedAnswers = [];
  for (const answer of answers) {
    const question = placementTest.questions.find(
      q => q.questionId._id.toString() === answer.questionId
    );

    if (!question) {
      return next(new ErrorHandler('Câu hỏi không hợp lệ', 400));
    }

    const isCorrect = question.questionId.questionType === 'writing' 
      ? null 
      : answer.userAnswer === question.questionId.correctAnswer;

    processedAnswers.push({
      questionId: answer.questionId,
      userAnswer: answer.userAnswer,
      isCorrect,
      questionType: question.questionId.questionType,
      timeSpent: answer.timeSpent || 0
    });
  }

  // Tạo result
  const result = new PlacementTestResult({
    userId: req.user.id,
    placementTestId,
    testType: placementTest.testType,
    answers: processedAnswers,
    timeSpent: timeSpent || 0,
    startedAt: startedAt || new Date(),
    completedAt: new Date(),
    isCompleted: true
  });

  // Tính điểm (sẽ được gọi trong pre-save middleware)
  await result.save();

  // Gọi AI để đánh giá writing và tổng thể
  try {
    await evaluateWithAI(result);
  } catch (error) {
    console.error('AI evaluation error:', error);
    // Không block việc lưu kết quả nếu AI lỗi
  }

  // Cập nhật user profile
  await updateUserProfile(req.user.id, result);

  res.status(201).json({
    success: true,
    message: 'Hoàn thành placement test thành công',
    data: result
  });
});

// Lấy kết quả placement test
export const getPlacementTestResult = catchAsyncErrors(async (req, res, next) => {
  const { testType } = req.params;

  const result = await PlacementTestResult.findOne({
    userId: req.user.id,
    testType,
    isCompleted: true
  }).sort({ createdAt: -1 })
    .populate('placementTestId')
    .populate({
      path: 'aiAnalysis.suggestedCourses.courseId',
      select: 'title description thumbnail price targetScoreRange'
    });

  if (!result) {
    return next(new ErrorHandler('Không tìm thấy kết quả test', 404));
  }

  res.status(200).json({
    success: true,
    data: result
  });
});

// Helper function: Đánh giá bằng AI
async function evaluateWithAI(result) {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
  
  try {
    const response = await axios.post(`${aiServiceUrl}/api/evaluate-placement`, {
      testType: result.testType,
      answers: result.answers,
      scores: result.scores,
      totalScore: result.totalScore
    });

    const aiEvaluation = response.data;

    // Cập nhật writing evaluation nếu có
    if (aiEvaluation.writingEvaluation) {
      result.scores.writing.aiEvaluation = aiEvaluation.writingEvaluation;
    }

    // Cập nhật AI analysis
    if (aiEvaluation.analysis) {
      result.aiAnalysis = {
        ...result.aiAnalysis,
        ...aiEvaluation.analysis
      };
    }

    // Cập nhật estimated level nếu AI có đề xuất tốt hơn
    if (aiEvaluation.estimatedLevel) {
      result.estimatedLevel = {
        ...result.estimatedLevel,
        ...aiEvaluation.estimatedLevel
      };
    }

    await result.save();
  } catch (error) {
    console.error('AI evaluation failed:', error);
    throw error;
  }
}

// Helper function: Cập nhật user profile
async function updateUserProfile(userId, result) {
  const updateData = {};

  // Cập nhật điểm số hiện tại
  if (result.testType === 'IELTS' && result.estimatedLevel.ielts.overall) {
    updateData['currentScore.ielts'] = result.estimatedLevel.ielts.overall;
  } else if (result.testType === 'TOEIC' && result.estimatedLevel.toeic.overall) {
    updateData['currentScore.toeic'] = result.estimatedLevel.toeic.overall;
  }

  // Cập nhật AI analytics
  if (result.aiAnalysis) {
    updateData['aiAnalytics.strengths'] = result.aiAnalysis.strengths || [];
    updateData['aiAnalytics.weaknesses'] = result.aiAnalysis.weaknesses || [];
    updateData['aiAnalytics.learningStyle'] = result.aiAnalysis.learningStyle;
    updateData['aiAnalytics.optimalPace'] = result.aiAnalysis.optimalPace || 'moderate';
    updateData['aiAnalytics.lastAnalyzedAt'] = new Date();
  }

  // Cập nhật learning preferences dựa trên performance metrics
  if (result.performanceMetrics) {
    const avgTime = result.performanceMetrics.averageTimePerQuestion;
    if (avgTime > 0) {
      if (avgTime < 30) {
        updateData['learningPreferences.preferredPace'] = 'fast';
      } else if (avgTime > 60) {
        updateData['learningPreferences.preferredPace'] = 'slow';
      } else {
        updateData['learningPreferences.preferredPace'] = 'moderate';
      }
    }

    if (result.performanceMetrics.difficultyPreference) {
      updateData['learningPreferences.preferredDifficulty'] = result.performanceMetrics.difficultyPreference;
    }
  }

  if (Object.keys(updateData).length > 0) {
    await User.findByIdAndUpdate(userId, updateData);
  }
}

// Lấy thống kê placement test (Admin)
export const getPlacementTestStats = catchAsyncErrors(async (req, res, next) => {
  const { testType, startDate, endDate } = req.query;

  const matchFilter = {};
  if (testType) matchFilter.testType = testType;
  if (startDate || endDate) {
    matchFilter.createdAt = {};
    if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
    if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
  }

  const stats = await PlacementTestResult.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$testType',
        totalTests: { $sum: 1 },
        averageScore: { $avg: '$totalScore.percentage' },
        averageTimeSpent: { $avg: '$timeSpent' },
        levelDistribution: {
          $push: {
            ielts: '$estimatedLevel.ielts.overall',
            toeic: '$estimatedLevel.toeic.overall'
          }
        }
      }
    }
  ]);

  const questionStats = await QuestionBank.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: {
          testType: '$testType',
          questionType: '$questionType',
          source: '$source'
        },
        count: { $sum: 1 },
        totalUsage: { $sum: '$usageCount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      testStats: stats,
      questionStats
    }
  });
});

// Xóa câu hỏi (Admin)
export const deleteQuestionBank = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const question = await QuestionBank.findById(id);
  if (!question) {
    return next(new ErrorHandler('Không tìm thấy câu hỏi', 404));
  }

  // Kiểm tra xem câu hỏi có đang được sử dụng trong placement test nào không
  const isUsedInTest = await PlacementTest.findOne({
    'questions.questionId': id,
    isActive: true
  });

  if (isUsedInTest) {
    return next(new ErrorHandler('Không thể xóa câu hỏi đang được sử dụng trong placement test', 400));
  }

  await QuestionBank.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Xóa câu hỏi thành công'
  });
});

// Lấy tất cả placement tests (Admin)
export const getAllPlacementTests = catchAsyncErrors(async (req, res, next) => {
  const { testType, isActive, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (testType) filter.testType = testType;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (page - 1) * limit;
  
  const tests = await PlacementTest.find(filter)
    .populate('createdBy', 'firstName lastName')
    .populate('questions.questionId', 'question questionType difficulty')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await PlacementTest.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: tests,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    }
  });
});

// Xóa placement test (Admin)
export const deletePlacementTest = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const test = await PlacementTest.findById(id);
  if (!test) {
    return next(new ErrorHandler('Không tìm thấy placement test', 404));
  }

  // Kiểm tra xem có kết quả test nào đã được submit chưa
  const hasResults = await PlacementTestResult.findOne({
    placementTestId: id,
    isCompleted: true
  });

  if (hasResults) {
    return next(new ErrorHandler('Không thể xóa placement test đã có kết quả', 400));
  }

  await PlacementTest.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Xóa placement test thành công'
  });
});

// Bật/tắt trạng thái placement test (Admin)
export const togglePlacementTestStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const test = await PlacementTest.findById(id);
  if (!test) {
    return next(new ErrorHandler('Không tìm thấy placement test', 404));
  }

  // Nếu đang kích hoạt test này, vô hiệu hóa các test khác cùng loại
  if (isActive) {
    await PlacementTest.updateMany(
      { testType: test.testType, _id: { $ne: id } },
      { isActive: false }
    );
  }

  test.isActive = isActive;
  await test.save();

  res.status(200).json({
    success: true,
    message: `${isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} placement test thành công`,
    data: test
  });
});
