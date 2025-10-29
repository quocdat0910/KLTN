import { FinalTestQuestionBank, FinalTest, FinalTestResult } from '../models/finalTestSchema.js';
import Course from '../models/courseSchema.js';
import User from '../models/userSchema.js';
import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../utils/errorHandler.js';
import CourseProgressionService from '../services/courseProgressionService.js';
import axios from 'axios';

// ==================== FINAL TEST QUESTION BANK ====================

// Lấy tất cả câu hỏi trong ngân hàng câu hỏi Final Test
export const getFinalTestQuestions = catchAsyncErrors(async (req, res, next) => {
  const { testType, questionType, difficulty, page = 1, limit = 10 } = req.query;
  
  const filter = { isActive: true };
  if (testType) filter.testType = testType;
  if (questionType) filter.questionType = questionType;
  if (difficulty) filter.difficulty = difficulty;

  const skip = (page - 1) * limit;
  
  const questions = await FinalTestQuestionBank.find(filter)
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await FinalTestQuestionBank.countDocuments(filter);

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

// Tạo câu hỏi Final Test thủ công
export const createFinalTestQuestion = catchAsyncErrors(async (req, res, next) => {
  const questionData = req.body;
  
  const question = await FinalTestQuestionBank.create({
    ...questionData,
    source: 'admin',
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'Tạo câu hỏi thành công',
    data: question
  });
});

// Tạo câu hỏi Final Test bằng AI
export const generateAIFinalTestQuestions = catchAsyncErrors(async (req, res, next) => {
  const { 
    questionType, 
    testType, 
    difficulty, 
    count = 5,
    courseId,
    courseType,
    targetScoreRange,
    skills = [z],
    questionCount = 50
  } = req.body;

  if (!testType) {
    return next(new ErrorHandler("Vui lòng cung cấp loại test", 400));
  }

  try {
    // Gọi AI service để generate questions
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:5000";
    const response = await axios.post(
      `${aiServiceUrl}/api/generate-final-test-questions`,
      {
        testType,
        difficulty: difficulty || 'medium',
        count: questionCount || count,
        courseType,
        targetScoreRange,
        skills
      }
    );

    const generatedQuestions = response.data.questions;

    // Lưu vào database
    const savedQuestions = [];
    for (const questionData of generatedQuestions) {
      const question = await FinalTestQuestionBank.create({
        ...questionData,
        source: "ai_generated",
        createdBy: req.user.id,
      });
      savedQuestions.push(question);
    }

    res.status(201).json({
      success: true,
      message: `Đã tạo ${savedQuestions.length} câu hỏi Final Test bằng AI`,
      data: {
        questions: savedQuestions
      }
    });
  } catch (error) {
    console.error("Error generating AI Final Test questions:", error);
    return next(new ErrorHandler("Không thể tạo câu hỏi Final Test bằng AI", 500));
  }
});

// Cập nhật câu hỏi Final Test
export const updateFinalTestQuestion = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  
  const question = await FinalTestQuestionBank.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!question) {
    return next(new ErrorHandler("Câu hỏi không tồn tại", 404));
  }

  res.status(200).json({
    success: true,
    message: "Cập nhật câu hỏi thành công",
    data: question
  });
});

// Xóa câu hỏi Final Test
export const deleteFinalTestQuestion = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  
  const question = await FinalTestQuestionBank.findByIdAndDelete(id);

  if (!question) {
    return next(new ErrorHandler("Câu hỏi không tồn tại", 404));
  }

  res.status(200).json({
    success: true,
    message: "Xóa câu hỏi thành công"
  });
});

// ==================== FINAL TEST ====================

// Lấy tất cả Final Test
export const getFinalTests = catchAsyncErrors(async (req, res, next) => {
  const { courseId, testType, page = 1, limit = 10 } = req.query;
  
  const filter = { isActive: true };
  if (courseId) filter.courseId = courseId;
  if (testType) filter.testType = testType;

  // Nếu không phải admin, chỉ lấy Final Test của khóa học mà user đã đăng ký
  if (req.user.role !== 'admin') {
    const user = await User.findById(req.user.id);
    const enrolledCourseIds = user.enrolledCourses
      .filter(enrollment => enrollment.status === 'active')
      .map(enrollment => enrollment.course.toString());
    
    if (enrolledCourseIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          finalTests: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        }
      });
    }
    
    filter.courseId = { $in: enrolledCourseIds };
  }

  const skip = (page - 1) * limit;
  
  const finalTests = await FinalTest.find(filter)
    .populate('courseId', 'title courseType')
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await FinalTest.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      finalTests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Lấy Final Test theo ID
export const getFinalTestById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  
  const finalTest = await FinalTest.findById(id)
    .populate('courseId', 'title courseType targetScoreRange')
    .populate('createdBy', 'firstName lastName')
    .populate({
      path: 'questions.questionId',
      select: 'questionText questionType questionSubType options correctAnswer explanation passageText questionAudio speakingPrompt expectedResponse'
    });

  if (!finalTest) {
    return next(new ErrorHandler("Final Test không tồn tại", 404));
  }

  // Kiểm tra quyền truy cập: Admin có thể xem tất cả, User chỉ xem được Final Test của khóa học đã đăng ký
  if (req.user.role !== 'admin') {
    const user = await User.findById(req.user.id);
    const isEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === finalTest.courseId._id.toString() && enrollment.status === 'active'
    );

    if (!isEnrolled) {
      return next(new ErrorHandler("Bạn chưa đăng ký khóa học này", 403));
    }
  }

  res.status(200).json({
    success: true,
    data: finalTest
  });
});

// Tạo Final Test
export const createFinalTest = catchAsyncErrors(async (req, res, next) => {
  const {
    courseId,
    title,
    description,
    testType,
    questionIds,
    questions,
    timeLimit = 120,
    passingScore = 70,
    targetScoreRange
  } = req.body;

  if (!courseId || !title || !testType || !targetScoreRange) {
    return next(new ErrorHandler("Vui lòng cung cấp đầy đủ thông tin", 400));
  }

  // Kiểm tra khóa học tồn tại
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new ErrorHandler("Khóa học không tồn tại", 404));
  }

  let questionIdArray = [];

  // Handle both formats: questionIds array or questions array of objects
  if (questionIds && Array.isArray(questionIds)) {
    questionIdArray = questionIds;
  } else if (questions && Array.isArray(questions)) {
    questionIdArray = questions
      .map((q) => q.questionId || q._id)
      .filter(Boolean);
  } else {
    return next(new ErrorHandler("Vui lòng cung cấp danh sách câu hỏi", 400));
  }

  if (questionIdArray.length === 0) {
    return next(new ErrorHandler("Phải có ít nhất 5 câu hỏi", 400));
  }

  // Validate questions exist
  const questionsFromDB = await FinalTestQuestionBank.find({
    _id: { $in: questionIdArray },
    testType,
    isActive: true,
  });

  if (questionsFromDB.length !== questionIdArray.length) {
    return next(
      new ErrorHandler("Một số câu hỏi không tồn tại hoặc không phù hợp", 400)
    );
  }

  // Tạo Final Test
  const finalTest = await FinalTest.create({
    courseId,
    title,
    description,
    testType,
    questions: questionsFromDB.map((q) => ({
      questionId: q._id,
      questionType: q.questionType,
      weight: 1,
    })),
    totalQuestions: questionsFromDB.length,
    timeLimit,
    passingScore,
    targetScoreRange,
    createdBy: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: "Tạo Final Test thành công",
    data: finalTest,
  });
});

// Cập nhật Final Test
export const updateFinalTest = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  
  const finalTest = await FinalTest.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!finalTest) {
    return next(new ErrorHandler("Final Test không tồn tại", 404));
  }

  res.status(200).json({
    success: true,
    message: "Cập nhật Final Test thành công",
    data: finalTest
  });
});

// Tạo Final Test với AI-generated questions
export const createFinalTestWithAI = catchAsyncErrors(async (req, res, next) => {
  const {
    courseId,
    title,
    description,
    testType,
    questions,
    totalQuestions,
    timeLimit,
    passingScore,
    targetScoreRange
  } = req.body;

  // Validate required fields
  if (!courseId || !testType || !questions) {
    return next(new ErrorHandler("Vui lòng cung cấp đầy đủ thông tin Final Test", 400));
  }

  // Tạo câu hỏi trong FinalTestQuestionBank trước
  const savedQuestions = [];
  for (const questionData of questions) {
    console.log('[DEBUG] Processing question data:', JSON.stringify(questionData, null, 2));
    
    // Helper function để map questionType sang questionSubType
    const getQuestionSubType = (qType) => {
      const typeMapping = {
        'multiple-choice': 'multiple-choice',
        'true-false-notgiven': 'true-false-notgiven',
        'fill-in-blank': 'fill-in-blank',
        'essay': 'essay',
        'short-answer': 'short-answer',
        'summary': 'summary'
      };
      return typeMapping[qType] || 'multiple-choice';
    };

    // Helper function để map section sang questionType
    const getSkillFromSection = (section) => {
      if (!section) return 'reading';
      const skillMap = {
        'reading': 'reading',
        'listening': 'listening', 
        'writing': 'writing',
        'speaking': 'speaking'
      };
      return skillMap[section.toLowerCase()] || 'reading';
    };

    // Helper function để normalize difficulty
    const normalizeDifficulty = (difficulty, testType) => {
      if (!difficulty) return testType === 'IELTS' ? '5.5' : '500';
      
      // Nếu là string number, convert sang number
      if (typeof difficulty === 'string' && !isNaN(parseFloat(difficulty))) {
        return parseFloat(difficulty);
      }
      
      // Nếu là number, return luôn
      if (typeof difficulty === 'number') {
        return difficulty;
      }
      
      // Fallback
      return testType === 'IELTS' ? '5.5' : '500';
    };

    const questionBankItem = await FinalTestQuestionBank.create({
      questionText: questionData.questionText || questionData.question || 'Question text missing',
      questionType: getSkillFromSection(questionData.section),
      questionSubType: getQuestionSubType(questionData.questionType),
      testType,
      difficulty: normalizeDifficulty(questionData.difficulty, testType),
      passageText: questionData.passageText || null,
      options: questionData.options || [],
      correctAnswer: questionData.correctAnswer || 'A',
      explanation: questionData.explanation || '',
      source: 'ai_generated',
      createdBy: req.user.id
    });
    
    savedQuestions.push({
      questionId: questionBankItem._id,
      questionType: getSkillFromSection(questionData.section),
      questionSubType: getQuestionSubType(questionData.questionType),
      weight: 1
    });
  }

  // Tạo Final Test
  const finalTest = await FinalTest.create({
    courseId,
    title: title || `AI Generated ${testType} Final Test`,
    testLabel: `AI_${testType}_Final_${Date.now()}`,
    description: description || `Auto-generated Final Test with ${savedQuestions.length} questions`,
    testType,
    skillsCovered: ['reading', 'listening'], // Default skills
    questions: savedQuestions,
    totalQuestions: savedQuestions.length,
    timeLimit: timeLimit || 120,
    passingScore: passingScore || 70,
    targetScoreRange,
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    message: "Tạo Final Test với AI thành công",
    data: finalTest
  });
});

// Xóa Final Test
export const deleteFinalTest = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  
  const finalTest = await FinalTest.findByIdAndDelete(id);

  if (!finalTest) {
    return next(new ErrorHandler("Final Test không tồn tại", 404));
  }

  res.status(200).json({
    success: true,
    message: "Xóa Final Test thành công"
  });
});

// ==================== FINAL TEST RESULTS ====================

// Lấy kết quả Final Test của user
export const getFinalTestResults = catchAsyncErrors(async (req, res, next) => {
  const { courseId, page = 1, limit = 10 } = req.query;
  
  const filter = { userId: req.user.id };
  if (courseId) filter.courseId = courseId;

  const skip = (page - 1) * limit;
  
  const results = await FinalTestResult.find(filter)
    .populate('courseId', 'title courseType')
    .populate('finalTestId', 'title testType')
    .sort({ completedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await FinalTestResult.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Lấy kết quả Final Test theo ID
export const getFinalTestResultById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  
  const result = await FinalTestResult.findById(id)
    .populate('courseId', 'title courseType targetScoreRange')
    .populate('finalTestId', 'title testType targetScoreRange')
    .populate({
      path: 'aiAnalysis.suggestedCourses.courseId',
      select: 'title description thumbnail price targetScoreRange'
    });

  if (!result) {
    return next(new ErrorHandler("Kết quả không tồn tại", 404));
  }

  // Kiểm tra quyền truy cập
  if (result.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorHandler("Không có quyền truy cập", 403));
  }

  res.status(200).json({
    success: true,
    data: result
  });
});

// Submit Final Test
export const submitFinalTest = catchAsyncErrors(async (req, res, next) => {
  const { finalTestId, courseId, answers, timeSpent, startedAt } = req.body;

  if (!finalTestId || !courseId || !answers || !Array.isArray(answers)) {
    return next(new ErrorHandler("Dữ liệu không hợp lệ", 400));
  }

  // Validate Final Test exists
  const finalTest = await FinalTest.findById(finalTestId).populate(
    "questions.questionId"
  );

  if (!finalTest) {
    return next(new ErrorHandler("Final Test không tồn tại", 404));
  }

  // Kiểm tra user đã đăng ký khóa học
  const user = await User.findById(req.user.id);
  const isEnrolled = user.enrolledCourses.some(
    enrollment => enrollment.course.toString() === courseId && enrollment.status === 'active'
  );

  if (!isEnrolled) {
    return next(new ErrorHandler("Bạn chưa đăng ký khóa học này", 400));
  }

  // Kiểm tra user đã làm test này chưa
  const existingResult = await FinalTestResult.findOne({
    userId: req.user.id,
    finalTestId,
    courseId,
    isCompleted: true,
  });

  let attempts = 1;
  if (existingResult) {
    attempts = existingResult.attempts + 1;
  }

  // Validate answers
  const processedAnswers = [];
  for (const answer of answers) {
    const question = finalTest.questions.find(
      (q) => q.questionId._id.toString() === answer.questionId
    );

    if (!question) {
      return next(new ErrorHandler("Câu hỏi không hợp lệ", 400));
    }

    // So sánh userAnswer (A, B, C, D) với option text - giống placement test
    let isCorrect = null;
    if (question.questionId.questionType !== "writing" && question.questionId.questionType !== "speaking") {
      const optionIndex = answer.userAnswer.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      const selectedOption = question.questionId.options[optionIndex];
      
      // Kiểm tra correctAnswer có thể là A/B/C/D hoặc text
      let correctAnswer = question.questionId.correctAnswer;
      
      // Kiểm tra nếu correctAnswer bị null hoặc rỗng
      if (!correctAnswer || correctAnswer === "" || correctAnswer === null) {
        console.log(`❌ Question ${answer.questionId}: Missing correctAnswer`);
        console.log(`   Question Text: ${question.questionId.questionText}`);
        console.log(`   Options: ${JSON.stringify(question.questionId.options)}`);
        isCorrect = false;
      } else {
        // Xử lý đặc biệt cho true-false-notgiven
        if (question.questionId.questionSubType === 'true-false-notgiven') {
          // So sánh trực tiếp userAnswer với correctAnswer (A/B/C)
          isCorrect = answer.userAnswer.toUpperCase() === correctAnswer.toUpperCase();
          console.log(`🔍 True-False Question ${answer.questionId}:`);
          console.log(`   User answer: ${answer.userAnswer}`);
          console.log(`   Correct answer: ${correctAnswer}`);
          console.log(`   Is correct: ${isCorrect}`);
        } else {
          // Nếu correctAnswer là A/B/C/D, chuyển thành text
          if (correctAnswer && /^[A-D]$/i.test(correctAnswer)) {
            const correctIndex = correctAnswer.charCodeAt(0) - 65;
            correctAnswer = question.questionId.options[correctIndex];
          }
          
          isCorrect = selectedOption === correctAnswer;
          
          // Debug log để kiểm tra
          console.log(`🔍 Question ${answer.questionId}:`);
          console.log(`   Type: ${question.questionId.questionSubType}`);
          console.log(`   User answer: ${answer.userAnswer} (${selectedOption})`);
          console.log(`   Correct answer: ${question.questionId.correctAnswer} -> ${correctAnswer}`);
          console.log(`   Is correct: ${isCorrect}`);
          console.log(`   Options: ${JSON.stringify(question.questionId.options)}`);
          
          // Debug đặc biệt cho fill-in-blank
          if (question.questionId.questionSubType === 'fill-in-blank') {
            console.log(`   Fill-in-blank Debug:`);
            console.log(`     User answer: "${answer.userAnswer}"`);
            console.log(`     Selected option: "${selectedOption}"`);
            console.log(`     Correct answer: "${correctAnswer}"`);
            console.log(`     Comparison: "${selectedOption}" === "${correctAnswer}" = ${selectedOption === correctAnswer}`);
          }
        }
      }
    }

    processedAnswers.push({
      questionId: answer.questionId,
      userAnswer: answer.userAnswer,
      isCorrect,
      questionType: question.questionId.questionType,
      questionSubType: question.questionId.questionSubType || 'multiple-choice',
      timeSpent: answer.timeSpent || 0,
    });
  }

  // Tạo result
  const result = new FinalTestResult({
    userId: req.user.id,
    courseId,
    finalTestId,
    testType: finalTest.testType,
    answers: processedAnswers,
    timeSpent: timeSpent || 0,
    startedAt: startedAt || new Date(),
    completedAt: new Date(),
    isCompleted: true,
    attempts
  });

  // Tính điểm (sẽ được gọi trong pre-save middleware)
  console.log('Saving final test result...');
  await result.save();
  console.log('Final test result saved successfully');

    // Gọi AI để đánh giá writing/speaking và tổng thể
  try {
    await evaluateFinalTestWithAI(result);
  } catch (error) {
    console.error('AI evaluation error:', error);
  }

  // Gọi AI để đề xuất khóa học tiếp theo
  try {
    await generateNextCourseRecommendations(result);
  } catch (error) {
    console.error('Course recommendation error:', error);
  }

  // Kiểm tra target achieved và cập nhật AI analysis
  try {
    await checkTargetAchievement(result);
  } catch (error) {
    console.error('Target achievement check error:', error);
  }

  // Cập nhật learning journey (bỏ qua generate-learning-path để tăng tốc)
  try {
    await CourseProgressionService.updateLearningJourney(req.user.id, result);
  } catch (error) {
    console.error('Learning journey update error:', error);
  }

  // Xử lý course progression
  let progressionResult = null;
  try {
    progressionResult = await CourseProgressionService.processPostFinalTest(result);
  } catch (error) {
    console.error('Course progression error:', error);
  }

  // Reload result từ database để đảm bảo có dữ liệu mới nhất
  const finalResult = await FinalTestResult.findById(result._id)
    .populate("finalTestId")
    .populate("courseId");

  res.status(201).json({
    success: true,
    message: "Hoàn thành Final Test thành công",
    data: {
      result: finalResult || result,
      progression: progressionResult
    }
  });
});

// Lấy kết quả Final Test theo user và course
export const getUserFinalTestResults = catchAsyncErrors(async (req, res, next) => {
  const { courseId } = req.query;
  const userId = req.user.id;

  if (!courseId) {
    return next(new ErrorHandler("CourseId là bắt buộc", 400));
  }

  const results = await FinalTestResult.find({
    userId,
    courseId,
    isCompleted: true
  })
    .populate('courseId', 'title courseType targetScoreRange')
    .populate('finalTestId', 'title testType targetScoreRange')
    .populate({
      path: 'aiAnalysis.suggestedCourses.courseId',
      select: 'title description thumbnail price targetScoreRange'
    })
    .sort({ completedAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      results,
      total: results.length
    }
  });
});

// Lấy progress overview của user
export const getUserProgressOverview = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  try {
    const progressOverview = await CourseProgressionService.getUserProgressOverview(userId);

    res.status(200).json({
      success: true,
      data: progressOverview
    });
  } catch (error) {
    console.error('Get progress overview error:', error);
    return next(new ErrorHandler("Không thể lấy thông tin tiến độ", 500));
  }
});

// Kiểm tra điều kiện tiến tới khóa học tiếp theo
export const checkProgressionEligibility = catchAsyncErrors(async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  const canProgress = await CourseProgressionService.canProgressToNextCourse(userId, courseId);

  res.status(200).json({
    success: true,
    data: {
      canProgress,
      message: canProgress 
        ? "Có thể tiến tới khóa học tiếp theo"
        : "Cần hoàn thành khóa học hiện tại trước"
    }
  });
});

// ==================== HELPER FUNCTIONS ====================

// Helper function: Đánh giá Final Test bằng AI
async function evaluateFinalTestWithAI(result) {
  const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:5000";

  try {
    // Lấy thông tin user goals
    const user = await User.findById(result.userId).select('targetGoals');
    
    // Chuẩn bị dữ liệu cho AI
    const finalTest = await FinalTest.findById(result.finalTestId).populate('questions.questionId');
    const questions = result.answers.map(answer => {
      const question = finalTest.questions.find(q => q.questionId._id.toString() === answer.questionId);
      
      return {
        questionType: answer.questionType,
        questionSubType: answer.questionSubType,
        correctAnswer: question?.questionId?.correctAnswer || '',
        options: question?.questionId?.options || [],
        userAnswer: answer.userAnswer,
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent
      };
    });

            // Gọi AI service để đánh giá với retry logic
        let response;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          try {
            response = await axios.post(
              `${aiServiceUrl}/api/evaluate-final-test`,
              {
                testType: result.testType,
                scores: result.scores,
                totalScore: result.totalScore,
                targetScoreRange: finalTest.targetScoreRange,
                userGoals: user?.targetGoals || {}
              },
              {
                timeout: 0, // Không giới hạn timeout cho AI local
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            break; // Thành công, thoát khỏi loop
          } catch (error) {
            retryCount++;
            console.log(`⚠️ AI evaluation attempt ${retryCount} failed:`, error.message);
            if (retryCount > maxRetries) {
              throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 2000)); // Đợi 2 giây trước khi thử lại
          }
        }

        const aiEvaluation = response.data;
        console.log("🔍 AI Response:", JSON.stringify(aiEvaluation, null, 2));

        if (aiEvaluation.status === 200) {
          // Cập nhật AI analysis
          if (aiEvaluation.aiAnalysis) {
            result.aiAnalysis = {
              ...result.aiAnalysis,
              strengths: aiEvaluation.aiAnalysis.strengths || [],
              weaknesses: aiEvaluation.aiAnalysis.weaknesses || [],
              recommendations: aiEvaluation.aiAnalysis.recommendations || [],
              learningStyle: aiEvaluation.aiAnalysis.learningStyle || null,
              confidenceLevel: aiEvaluation.aiAnalysis.confidenceLevel || 'medium',
              motivationLevel: aiEvaluation.aiAnalysis.motivationLevel || 'medium',
              studyPlan: aiEvaluation.aiAnalysis.studyPlan || {
                duration: 12,
                hoursPerWeek: 10,
                focusAreas: []
              },
              // Thêm thông tin mới từ AI
              overallAssessment: aiEvaluation.aiAnalysis.overallAssessment || {},
              learningPath: aiEvaluation.aiAnalysis.learningPath || {},
              studyAdvice: aiEvaluation.aiAnalysis.studyAdvice || {}
            };
          }

          await result.save();
          console.log("✅ AI evaluation saved successfully");
        }
  } catch (error) {
    console.error("❌ AI evaluation failed:", error);
    console.error("❌ Error details:", error.response?.data || error.message);
  }
}

// Helper function: Đề xuất khóa học tiếp theo bằng AI
async function generateNextCourseRecommendations(result) {
  const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:5000";

  try {
    // Lấy thông tin user goals
    const user = await User.findById(result.userId).select('targetGoals');
    
    // Lấy danh sách khóa học phù hợp (không bao gồm khóa học hiện tại)
    const availableCourses = await Course.find({
      courseType: result.testType,
      status: "published",
      _id: { $ne: result.courseId } // Loại trừ khóa học hiện tại
    }).select("title description skills targetScoreRange price thumbnail");

    if (availableCourses.length === 0) {
      console.log("⚠️ No available courses for recommendation");
      return;
    }

    // Gọi AI service để đề xuất khóa học với retry logic
    let response;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        response = await axios.post(
          `${aiServiceUrl}/api/recommend-next-courses`,
          {
            testType: result.testType,
            achievedLevel: result.estimatedLevel,
            availableCourses: availableCourses.map((course) => ({
              _id: course._id,
              title: course.title,
              description: course.description,
              skills: course.skills,
              targetScoreRange: course.targetScoreRange,
            })),
            strengths: result.aiAnalysis?.strengths || [],
            weaknesses: result.aiAnalysis?.weaknesses || []
          },
          {
            timeout: 0, // Không giới hạn timeout cho AI local
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        break; // Thành công, thoát khỏi loop
      } catch (error) {
        retryCount++;
        console.log(`⚠️ Course recommendation attempt ${retryCount} failed:`, error.message);
        if (retryCount > maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Đợi 2 giây trước khi thử lại
      }
    }

            const aiRecommendations = response.data.recommendations;
        console.log("🔍 AI Course Recommendations:", JSON.stringify(aiRecommendations, null, 2));

        if (aiRecommendations && aiRecommendations.suggestedCourses && aiRecommendations.suggestedCourses.length > 0) {
          const aiRecommendationsData = aiRecommendations;
      
      result.aiAnalysis.suggestedCourses = aiRecommendationsData.suggestedCourses.map((rec) => ({
        courseId: rec.courseId,
        reason: rec.reason,
        priority: rec.priority,
        expectedOutcome: rec.expectedOutcome,
        timeToComplete: rec.timeToComplete
      }));

      // Cập nhật learning path và study advice
      if (aiRecommendationsData.learningPath) {
        result.aiAnalysis.learningPath = aiRecommendationsData.learningPath;
      }
      
      if (aiRecommendationsData.studyAdvice) {
        result.aiAnalysis.studyAdvice = aiRecommendationsData.studyAdvice;
      }

      await result.save();
      console.log("✅ Course recommendations saved successfully");
    } else {
      console.log("⚠️ No course recommendations from AI, using fallback");
      
      // Fallback: tạo recommendations đơn giản
      const fallbackRecommendations = availableCourses.slice(0, 3).map((course, index) => ({
        courseId: course._id,
        reason: `Khóa học phù hợp với trình độ ${result.testType} hiện tại`,
        priority: index === 0 ? "high" : "medium",
        expectedOutcome: `Cải thiện kỹ năng ${course.skills.join(", ")}`,
        timeToComplete: "2-3 tháng"
      }));
      
      result.aiAnalysis.suggestedCourses = fallbackRecommendations;
      await result.save();
      console.log("✅ Fallback course recommendations saved successfully");
    }
  } catch (error) {
    console.error("❌ Course recommendation failed:", error);
    console.error("❌ Error details:", error.response?.data || error.message);
  }
}

// Helper function: Kiểm tra đạt mục tiêu
async function checkTargetAchievement(result) {
  try {
    const course = await Course.findById(result.courseId);
    const user = await User.findById(result.userId);
    
    if (!course || !user) return;

    const achievedScore = result.testType === 'IELTS' 
      ? result.estimatedLevel?.ielts?.overall 
      : result.estimatedLevel?.toeic?.overall;

    if (!achievedScore) return;

    // Kiểm tra đạt mục tiêu khóa học
    const courseTargetRange = course.targetScoreRange;
    let courseTargetMet = false;
    
    if (courseTargetRange) {
      if (courseTargetRange.includes('+')) {
        // Handle cases like "8.0+" or "850+"
        const minTarget = parseFloat(courseTargetRange.replace('+', ''));
        courseTargetMet = achievedScore >= minTarget;
      } else {
        // Handle ranges like "6.0-7.0" or "550-650"
        const [minTarget, maxTarget] = courseTargetRange.split('-').map(Number);
        courseTargetMet = achievedScore >= minTarget;
      }
    }

    // Kiểm tra đạt mục tiêu cá nhân của user
    const userTargetGoal = result.testType === 'IELTS' 
      ? user.targetGoals?.ielts?.overall 
      : user.targetGoals?.toeic?.overall;

    let personalTargetMet = false;
    if (userTargetGoal) {
      personalTargetMet = achievedScore >= userTargetGoal;
    }

    // Cập nhật kết quả
    result.targetAchieved = courseTargetMet;
    result.personalTargetAchieved = personalTargetMet;
    
    // Cập nhật currentScore của user nếu đạt được điểm cao hơn
    if (result.testType === 'IELTS') {
      if (!user.currentScore.ielts || user.currentScore.ielts < achievedScore) {
        user.currentScore.ielts = achievedScore;
      }
    } else if (result.testType === 'TOEIC') {
      if (!user.currentScore.toeic || user.currentScore.toeic < achievedScore) {
        user.currentScore.toeic = achievedScore;
      }
    }

    // Cập nhật enrollment status nếu hoàn thành khóa học
    if (courseTargetMet) {
      const enrollment = user.enrolledCourses.find(
        e => e.course.toString() === result.courseId.toString()
      );
      if (enrollment && enrollment.status === 'active') {
        enrollment.status = 'completed';
        enrollment.completedAt = new Date();
      }
    }

    await Promise.all([result.save(), user.save()]);

    console.log(`✅ Target achievement check completed:
      - Course target (${courseTargetRange}): ${courseTargetMet ? 'MET' : 'NOT MET'}
      - Personal target (${userTargetGoal}): ${personalTargetMet ? 'MET' : 'NOT MET'}
      - Achieved score: ${achievedScore}`);

  } catch (error) {
    console.error("❌ Target achievement check failed:", error);
  }
}
