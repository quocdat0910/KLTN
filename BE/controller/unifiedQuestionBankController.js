import { QuestionBank } from '../models/placementTestSchema.js';
import { FinalTestQuestionBank } from '../models/finalTestSchema.js';
import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../utils/errorHandler.js';
import { 
  isValidDifficulty, 
  migrateLegacyDifficulty,
  getDifficultyDescription,
  getValidDifficultyLevels 
} from '../utils/difficultyMapping.js';
import axios from 'axios';

// Lấy tất cả câu hỏi từ cả placement test và final test
export const getAllQuestions = catchAsyncErrors(async (req, res, next) => {
  const { 
    testType, 
    questionType, 
    difficulty, 
    source, // 'placement', 'final', hoặc 'all'
    page = 1, 
    limit = 20 
  } = req.query;
  
  const filter = { isActive: true };
  if (testType) filter.testType = testType;
  if (questionType) filter.questionType = questionType;
  if (difficulty) filter.difficulty = difficulty;

  const skip = (page - 1) * limit;
  const limitNum = parseInt(limit);

  let placementQuestions = [];
  let finalTestQuestions = [];

  // Lấy câu hỏi placement test
  if (!source || source === 'all' || source === 'placement') {
    placementQuestions = await QuestionBank.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
    
    // Thêm source field
    placementQuestions = placementQuestions.map(q => ({
      ...q,
      source: 'placement_test'
    }));
  }

  // Lấy câu hỏi final test
  if (!source || source === 'all' || source === 'final') {
    finalTestQuestions = await FinalTestQuestionBank.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
    
    // Thêm source field
    finalTestQuestions = finalTestQuestions.map(q => ({
      ...q,
      source: 'final_test'
    }));
  }

  // Kết hợp và sắp xếp
  const allQuestions = [...placementQuestions, ...finalTestQuestions]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Pagination
  const total = allQuestions.length;
  const paginatedQuestions = allQuestions.slice(skip, skip + limitNum);

  res.status(200).json({
    success: true,
    data: {
      questions: paginatedQuestions,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      stats: {
        placementQuestions: placementQuestions.length,
        finalTestQuestions: finalTestQuestions.length,
        total: allQuestions.length
      }
    }
  });
});

// Tạo câu hỏi bằng AI cho placement test
export const generateAIPlacementQuestions = catchAsyncErrors(async (req, res, next) => {
  const { 
    questionType, 
    testType, 
    difficulty, 
    count = 5,
    topic = '',
    autoAddToBank = true
  } = req.body;

  if (!questionType || !testType || !difficulty) {
    return next(new ErrorHandler("Vui lòng cung cấp đầy đủ thông tin", 400));
  }

  // Validate và migrate difficulty nếu cần
  let validatedDifficulty = difficulty;
  
  // Ensure difficulty is a number
  if (typeof difficulty === 'string') {
    const parsed = parseFloat(difficulty);
    if (!isNaN(parsed)) {
      validatedDifficulty = parsed;
    }
  }
  
  if (!isValidDifficulty(testType, validatedDifficulty)) {
    validatedDifficulty = migrateLegacyDifficulty(testType, validatedDifficulty);
    console.log(`Migrated difficulty from ${difficulty} to ${validatedDifficulty} for ${testType}`);
  }

  try {
    // Gọi AI service để generate questions
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:5000";
    const response = await axios.post(
      `${aiServiceUrl}/api/generate-questions`,
      {
        questionType,
        testType,
        difficulty: validatedDifficulty,
        count: Math.min(count, 10), // Giới hạn 10 câu
        topic,
        autoAddToBank: false // Không auto add, ta sẽ xử lý thủ công
      }
    );

    const generatedQuestions = response.data.questions || [];

    if (generatedQuestions.length === 0) {
      // Trả về response với thông báo thay vì error
      return res.status(200).json({
        success: true,
        message: 'AI không thể tạo câu hỏi lúc này, vui lòng thử lại sau',
        data: {
          questions: [],
          addedToBank: []
        }
      });
    }

    // Lưu vào database nếu được yêu cầu
    const savedQuestions = [];
    if (autoAddToBank) {
      for (const questionData of generatedQuestions) {
        const question = await QuestionBank.create({
          ...questionData,
          source: "ai_generated",
          createdBy: req.user.id,
        });
        savedQuestions.push(question);
      }
    }

    res.status(201).json({
      success: true,
      message: `Đã tạo ${generatedQuestions.length} câu hỏi Placement Test bằng AI`,
      data: {
        questions: autoAddToBank ? savedQuestions : generatedQuestions,
        addedToBank: autoAddToBank
      }
    });
  } catch (error) {
    console.error("Error generating AI Placement questions:", error);
    return next(new ErrorHandler("Không thể tạo câu hỏi Placement Test bằng AI", 500));
  }
});

// Tạo câu hỏi bằng AI cho final test
export const generateAIFinalTestQuestions = catchAsyncErrors(async (req, res, next) => {
  const { 
    testType, 
    difficulty, 
    count = 5,
    courseType,
    targetScoreRange,
    skills = ['reading', 'listening', 'grammar', 'vocabulary'],
    autoAddToBank = true
  } = req.body;

  if (!testType || !difficulty) {
    return next(new ErrorHandler("Vui lòng cung cấp loại test và mức độ", 400));
  }

  // Validate và migrate difficulty nếu cần
  let validatedDifficulty = difficulty;
  
  // Ensure difficulty is a number
  if (typeof difficulty === 'string') {
    const parsed = parseFloat(difficulty);
    if (!isNaN(parsed)) {
      validatedDifficulty = parsed;
    }
  }
  
  if (!isValidDifficulty(testType, validatedDifficulty)) {
    validatedDifficulty = migrateLegacyDifficulty(testType, validatedDifficulty);
    console.log(`Migrated difficulty from ${difficulty} to ${validatedDifficulty} for ${testType}`);
  }

  try {
    // Gọi AI service để generate questions
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:5000";
    const response = await axios.post(
      `${aiServiceUrl}/api/generate-final-test-questions`,
      {
        testType,
        difficulty: validatedDifficulty,
        count: Math.min(count, 20), // Giới hạn 20 câu cho final test
        courseType,
        targetScoreRange,
        skills
      }
    );

    const generatedQuestions = response.data.questions || [];

    if (generatedQuestions.length === 0) {
      // Trả về response với thông báo thay vì error
      return res.status(200).json({
        success: true,
        message: 'AI không thể tạo câu hỏi lúc này, vui lòng thử lại sau',
        data: {
          questions: [],
          addedToBank: []
        }
      });
    }

    // Lưu vào database nếu được yêu cầu
    const savedQuestions = [];
    if (autoAddToBank) {
      for (const questionData of generatedQuestions) {
        const question = await FinalTestQuestionBank.create({
          ...questionData,
          source: "ai_generated",
          createdBy: req.user.id,
        });
        savedQuestions.push(question);
      }
    }

    res.status(201).json({
      success: true,
      message: `Đã tạo ${generatedQuestions.length} câu hỏi Final Test bằng AI`,
      data: {
        questions: autoAddToBank ? savedQuestions : generatedQuestions,
        addedToBank: autoAddToBank
      }
    });
  } catch (error) {
    console.error("Error generating AI Final Test questions:", error);
    return next(new ErrorHandler("Không thể tạo câu hỏi Final Test bằng AI", 500));
  }
});

// Xóa câu hỏi (hỗ trợ cả placement và final test)
export const deleteQuestion = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { source } = req.query; // 'placement' hoặc 'final'

  let question;
  
  if (source === 'final' || source === 'final_test') {
    question = await FinalTestQuestionBank.findById(id);
    if (question) {
      await FinalTestQuestionBank.findByIdAndDelete(id);
    }
  } else {
    // Mặc định là placement test
    question = await QuestionBank.findById(id);
    if (question) {
      await QuestionBank.findByIdAndDelete(id);
    }
  }

  if (!question) {
    return next(new ErrorHandler("Câu hỏi không tồn tại", 404));
  }

  res.status(200).json({
    success: true,
    message: "Xóa câu hỏi thành công"
  });
});

// Cập nhật câu hỏi (hỗ trợ cả placement và final test)
export const updateQuestion = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { source } = req.query; // 'placement' hoặc 'final'
  const updateData = req.body;

  let question;
  
  if (source === 'final' || source === 'final_test') {
    question = await FinalTestQuestionBank.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
  } else {
    // Mặc định là placement test
    question = await QuestionBank.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
  }

  if (!question) {
    return next(new ErrorHandler("Câu hỏi không tồn tại", 404));
  }

  res.status(200).json({
    success: true,
    message: "Cập nhật câu hỏi thành công",
    data: question
  });
});

// Tạo câu hỏi thủ công cho placement test
export const createPlacementQuestion = catchAsyncErrors(async (req, res, next) => {
  const questionData = req.body;
  
  const question = await QuestionBank.create({
    ...questionData,
    source: 'admin',
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'Tạo câu hỏi Placement Test thành công',
    data: question
  });
});

// Tạo câu hỏi thủ công cho final test
export const createFinalTestQuestion = catchAsyncErrors(async (req, res, next) => {
  const questionData = req.body;
  
  // Validate difficulty nếu có
  if (questionData.difficulty && questionData.testType) {
    if (!isValidDifficulty(questionData.testType, questionData.difficulty)) {
      questionData.difficulty = migrateLegacyDifficulty(questionData.testType, questionData.difficulty);
    }
  }
  
  const question = await FinalTestQuestionBank.create({
    ...questionData,
    source: 'admin',
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'Tạo câu hỏi Final Test thành công',
    data: question
  });
});

// Lấy danh sách difficulty levels hợp lệ
export const getDifficultyLevels = catchAsyncErrors(async (req, res, next) => {
  const { testType } = req.query;
  
  if (!testType || !['IELTS', 'TOEIC'].includes(testType)) {
    return next(new ErrorHandler("Vui lòng cung cấp testType hợp lệ (IELTS hoặc TOEIC)", 400));
  }
  
  const validLevels = getValidDifficultyLevels(testType);
  const levelsWithDescription = validLevels.map(level => ({
    value: level,
    label: `${level} - ${getDifficultyDescription(testType, level)}`
  }));
  
  res.status(200).json({
    success: true,
    data: {
      testType,
      levels: levelsWithDescription
    }
  });
});
