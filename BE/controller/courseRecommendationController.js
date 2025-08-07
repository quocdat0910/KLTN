import Course from '../models/courseSchema.js';
import { PlacementTestResult } from '../models/placementTestSchema.js';
import User from '../models/userSchema.js';
import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../utils/errorHandler.js';
import axios from 'axios';

// Lấy khóa học được đề xuất cho user
export const getRecommendedCourses = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const { testType, limit = 5 } = req.query;

  // Lấy kết quả placement test gần nhất
  const placementResult = await PlacementTestResult.findOne({
    userId,
    testType: testType || { $in: ['IELTS', 'TOEIC'] },
    isCompleted: true
  }).sort({ createdAt: -1 });

  if (!placementResult) {
    return next(new ErrorHandler('Vui lòng hoàn thành placement test trước', 400));
  }

  // Lấy danh sách khóa học phù hợp
  const availableCourses = await Course.find({
    courseType: placementResult.testType,
    status: 'published'
  }).select('title description skills targetScoreRange price thumbnail');

  try {
    // Gọi AI service để đề xuất khóa học
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    const response = await axios.post(`${aiServiceUrl}/api/recommend-courses`, {
      testType: placementResult.testType,
      estimatedLevel: placementResult.estimatedLevel,
      strengths: placementResult.aiAnalysis?.strengths || [],
      weaknesses: placementResult.aiAnalysis?.weaknesses || [],
      availableCourses: availableCourses.map(course => ({
        _id: course._id,
        title: course.title,
        description: course.description,
        skills: course.skills,
        targetScoreRange: course.targetScoreRange
      }))
    });

    const aiRecommendations = response.data.recommendations || [];

    // Kết hợp với thông tin chi tiết khóa học
    const detailedRecommendations = aiRecommendations.map(rec => {
      const course = availableCourses.find(c => c._id.toString() === rec.courseId);
      return {
        ...rec,
        course: course || null
      };
    }).filter(rec => rec.course !== null);

    // Cập nhật suggested courses trong placement result
    if (detailedRecommendations.length > 0) {
      placementResult.aiAnalysis.suggestedCourses = detailedRecommendations.map(rec => ({
        courseId: rec.courseId,
        reason: rec.reason,
        priority: rec.priority
      }));
      await placementResult.save();
    }

    res.status(200).json({
      success: true,
      data: {
        placementResult: {
          testType: placementResult.testType,
          estimatedLevel: placementResult.estimatedLevel,
          strengths: placementResult.aiAnalysis?.strengths || [],
          weaknesses: placementResult.aiAnalysis?.weaknesses || [],
          recommendations: placementResult.aiAnalysis?.recommendations || []
        },
        recommendedCourses: detailedRecommendations.slice(0, limit)
      }
    });

  } catch (error) {
    console.error('AI recommendation error:', error);
    
    // Fallback: đề xuất dựa trên logic đơn giản
    const fallbackRecommendations = await getFallbackRecommendations(
      placementResult, 
      availableCourses, 
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        placementResult: {
          testType: placementResult.testType,
          estimatedLevel: placementResult.estimatedLevel,
          strengths: placementResult.aiAnalysis?.strengths || [],
          weaknesses: placementResult.aiAnalysis?.weaknesses || []
        },
        recommendedCourses: fallbackRecommendations,
        note: 'Sử dụng đề xuất dự phòng do AI service không khả dụng'
      }
    });
  }
});

// Lấy khóa học được đề xuất cho user cụ thể (Admin)
export const getRecommendationsForUser = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const { testType, limit = 5 } = req.query;

  // Kiểm tra user tồn tại
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler('Người dùng không tồn tại', 404));
  }

  // Lấy kết quả placement test
  const placementResult = await PlacementTestResult.findOne({
    userId,
    testType: testType || { $in: ['IELTS', 'TOEIC'] },
    isCompleted: true
  }).sort({ createdAt: -1 });

  if (!placementResult) {
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.fullName,
          email: user.email
        },
        hasPlacementTest: false,
        message: 'Người dùng chưa hoàn thành placement test'
      }
    });
  }

  // Lấy recommended courses (tương tự logic trên)
  const availableCourses = await Course.find({
    courseType: placementResult.testType,
    status: 'published'
  }).select('title description skills targetScoreRange price thumbnail');

  const fallbackRecommendations = await getFallbackRecommendations(
    placementResult, 
    availableCourses, 
    limit
  );

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email
      },
      hasPlacementTest: true,
      placementResult: {
        testType: placementResult.testType,
        estimatedLevel: placementResult.estimatedLevel,
        completedAt: placementResult.completedAt,
        totalScore: placementResult.totalScore
      },
      recommendedCourses: fallbackRecommendations
    }
  });
});

// Cập nhật trạng thái đề xuất (user chấp nhận/từ chối)
export const updateRecommendationStatus = catchAsyncErrors(async (req, res, next) => {
  const { courseId, status } = req.body; // status: 'accepted', 'rejected', 'enrolled'
  const userId = req.user.id;

  if (!courseId || !status) {
    return next(new ErrorHandler('Vui lòng cung cấp đầy đủ thông tin', 400));
  }

  if (!['accepted', 'rejected', 'enrolled'].includes(status)) {
    return next(new ErrorHandler('Trạng thái không hợp lệ', 400));
  }

  // Tìm placement result gần nhất có chứa course này
  const placementResult = await PlacementTestResult.findOne({
    userId,
    isCompleted: true,
    'aiAnalysis.suggestedCourses.courseId': courseId
  }).sort({ createdAt: -1 });

  if (!placementResult) {
    return next(new ErrorHandler('Không tìm thấy đề xuất khóa học', 404));
  }

  // Cập nhật status
  const suggestedCourse = placementResult.aiAnalysis.suggestedCourses.find(
    sc => sc.courseId.toString() === courseId
  );

  if (suggestedCourse) {
    suggestedCourse.status = status;
    suggestedCourse.updatedAt = new Date();
    await placementResult.save();
  }

  res.status(200).json({
    success: true,
    message: 'Cập nhật trạng thái đề xuất thành công',
    data: {
      courseId,
      status
    }
  });
});

// Lấy thống kê đề xuất khóa học (Admin)
export const getRecommendationStats = catchAsyncErrors(async (req, res, next) => {
  const { startDate, endDate, testType } = req.query;

  const matchFilter = { isCompleted: true };
  if (testType) matchFilter.testType = testType;
  if (startDate || endDate) {
    matchFilter.createdAt = {};
    if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
    if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
  }

  const stats = await PlacementTestResult.aggregate([
    { $match: matchFilter },
    { $unwind: '$aiAnalysis.suggestedCourses' },
    {
      $group: {
        _id: {
          courseId: '$aiAnalysis.suggestedCourses.courseId',
          status: '$aiAnalysis.suggestedCourses.status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.courseId',
        totalRecommendations: { $sum: '$count' },
        statusBreakdown: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        }
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: '$course' },
    {
      $project: {
        courseTitle: '$course.title',
        totalRecommendations: 1,
        statusBreakdown: 1,
        acceptanceRate: {
          $divide: [
            {
              $size: {
                $filter: {
                  input: '$statusBreakdown',
                  cond: { $eq: ['$$this.status', 'accepted'] }
                }
              }
            },
            '$totalRecommendations'
          ]
        }
      }
    },
    { $sort: { totalRecommendations: -1 } }
  ]);

  // Thống kê tổng quan
  const overallStats = await PlacementTestResult.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        averageRecommendations: {
          $avg: { $size: '$aiAnalysis.suggestedCourses' }
        },
        testTypeDistribution: {
          $push: '$testType'
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      courseStats: stats,
      overallStats: overallStats[0] || {
        totalUsers: 0,
        averageRecommendations: 0,
        testTypeDistribution: []
      }
    }
  });
});

// Helper function: Fallback recommendations
async function getFallbackRecommendations(placementResult, availableCourses, limit) {
  const estimatedLevel = placementResult.estimatedLevel;
  const testType = placementResult.testType;
  
  // Logic đơn giản dựa trên level
  let targetLevel;
  if (testType === 'IELTS') {
    const currentBand = estimatedLevel.ielts?.overall || 5.0;
    if (currentBand < 5.5) targetLevel = '4.0-5.0';
    else if (currentBand < 6.5) targetLevel = '5.5-6.5';
    else if (currentBand < 7.5) targetLevel = '6.0-7.0';
    else targetLevel = '7.0-8.0';
  } else if (testType === 'TOEIC') {
    const currentScore = estimatedLevel.toeic?.overall || 400;
    if (currentScore < 450) targetLevel = '250-350';
    else if (currentScore < 650) targetLevel = '450-550';
    else if (currentScore < 850) targetLevel = '650-850';
    else targetLevel = '850+';
  }

  // Lọc courses phù hợp với target level
  const suitableCourses = availableCourses.filter(course => 
    course.targetScoreRange === targetLevel
  );

  // Nếu không có course phù hợp, lấy tất cả
  const coursesToRecommend = suitableCourses.length > 0 ? suitableCourses : availableCourses;

  return coursesToRecommend.slice(0, limit).map((course, index) => ({
    courseId: course._id,
    course: course,
    reason: `Phù hợp với trình độ ${testType} hiện tại`,
    priority: 3,
    matchScore: 60 - (index * 5) // Giảm dần theo thứ tự
  }));
}
