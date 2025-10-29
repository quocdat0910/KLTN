import Course from '../models/courseSchema.js';
import User from '../models/userSchema.js';
import { FinalTestResult } from '../models/finalTestSchema.js';
import axios from 'axios';

/**
 * Service để quản lý course progression và learning path
 */
class CourseProgressionService {
  
  /**
   * Xử lý progression sau khi hoàn thành final test
   * @param {Object} finalTestResult - Kết quả final test
   * @returns {Object} Next steps và recommendations
   */
  static async processPostFinalTest(finalTestResult) {
    try {
      const user = await User.findById(finalTestResult.userId);
      const course = await Course.findById(finalTestResult.courseId);
      
      if (!user || !course) {
        throw new Error('User hoặc Course không tồn tại');
      }

      const progressionResult = {
        courseCompleted: finalTestResult.targetAchieved,
        personalGoalAchieved: finalTestResult.personalTargetAchieved,
        nextSteps: [],
        recommendations: [],
        learningPath: null
      };

      // Nếu đạt mục tiêu khóa học
      if (finalTestResult.targetAchieved) {
        progressionResult.nextSteps.push({
          type: 'course_completed',
          message: 'Chúc mừng! Bạn đã hoàn thành khóa học thành công.',
          action: 'celebrate'
        });

        // Kiểm tra đạt mục tiêu cá nhân
        if (finalTestResult.personalTargetAchieved) {
          progressionResult.nextSteps.push({
            type: 'personal_goal_achieved',
            message: 'Tuyệt vời! Bạn đã đạt được mục tiêu cá nhân.',
            action: 'set_new_goal'
          });
        } else {
          // Đề xuất khóa học tiếp theo để đạt mục tiêu cá nhân
          const nextCourses = await this.findNextCoursesForPersonalGoal(user, finalTestResult);
          if (nextCourses.length > 0) {
            progressionResult.nextSteps.push({
              type: 'continue_to_personal_goal',
              message: 'Tiếp tục học để đạt mục tiêu cá nhân của bạn.',
              action: 'enroll_next_course',
              courses: nextCourses
            });
          }
        }
      } else {
        // Không đạt mục tiêu khóa học - cần học lại hoặc ôn tập
        progressionResult.nextSteps.push({
          type: 'course_not_completed',
          message: 'Bạn chưa đạt mục tiêu khóa học. Hãy ôn tập và thử lại.',
          action: 'retake_or_review',
          weakAreas: finalTestResult.aiAnalysis?.weaknesses || [],
          recommendations: finalTestResult.aiAnalysis?.recommendations || []
        });
      }

      // Tạo learning path recommendation
      progressionResult.learningPath = await this.generateLearningPath(user, finalTestResult);

      return progressionResult;
    } catch (error) {
      console.error('❌ Course progression processing failed:', error);
      throw error;
    }
  }

  /**
   * Tìm khóa học tiếp theo để đạt mục tiêu cá nhân
   */
  static async findNextCoursesForPersonalGoal(user, finalTestResult) {
    try {
      const userGoal = finalTestResult.testType === 'IELTS' 
        ? user.targetGoals?.ielts?.overall 
        : user.targetGoals?.toeic?.overall;

      if (!userGoal) return [];

             const currentScore = finalTestResult.testType === 'IELTS'
         ? finalTestResult.estimatedLevel?.ielts?.overall
         : finalTestResult.estimatedLevel?.toeic?.overall;

      // Tìm khóa học có target score range phù hợp
      const targetScoreRanges = this.getTargetScoreRangesForGoal(finalTestResult.testType, currentScore, userGoal);
      
      const nextCourses = await Course.find({
        courseType: finalTestResult.testType,
        status: 'published',
        targetScoreRange: { $in: targetScoreRanges },
        _id: { $nin: user.enrolledCourses.map(e => e.course) }
      })
      .select('title description targetScoreRange price thumbnail skills')
      .limit(3);

      return nextCourses;
    } catch (error) {
      console.error('❌ Finding next courses failed:', error);
      return [];
    }
  }

  /**
   * Tạo learning path recommendation (Đã tối ưu - bỏ qua AI call để tăng tốc)
   */
  static async generateLearningPath(user, finalTestResult) {
    try {
      // Tạo learning path đơn giản thay vì gọi AI để tăng tốc
      const testType = finalTestResult.testType;
      const currentLevel = finalTestResult.estimatedLevel;
      const targetGoal = testType === 'IELTS' 
        ? user.targetGoals?.ielts?.overall 
        : user.targetGoals?.toeic?.overall;
      
      // Tạo learning path cơ bản dựa trên trình độ hiện tại
      const learningPath = {
        userId: user._id,
        testType: testType,
        currentLevel: currentLevel,
        targetGoal: targetGoal,
        phases: [
          {
            phase: "Foundation",
            duration: "2-3 months",
            focus: ["Grammar basics", "Vocabulary building"],
            courses: ["Basic Grammar Course", "Vocabulary Foundation"],
            milestones: ["Complete basic grammar", "Learn 500 new words"]
          },
          {
            phase: "Intermediate", 
            duration: "3-4 months",
            focus: ["Reading comprehension", "Listening skills"],
            courses: ["Reading Course", "Listening Practice"],
            milestones: ["Read 20 articles", "Listen to 50 podcasts"]
          },
          {
            phase: "Advanced",
            duration: "2-3 months", 
            focus: ["Writing skills", "Speaking practice"],
            courses: ["Writing Course", "Speaking Practice"],
            milestones: ["Write 10 essays", "Practice speaking daily"]
          }
        ],
        estimatedDuration: "7-10 months",
        studyHoursPerWeek: 15,
        recommendedSchedule: {
          monday: ["Grammar", "Vocabulary"],
          tuesday: ["Reading", "Listening"],
          wednesday: ["Writing", "Speaking"],
          thursday: ["Practice tests"],
          friday: ["Review", "Weak areas"],
          weekend: ["Rest", "Light practice"]
        },
        progressTracking: {
          weeklyCheckpoints: ["Complete assigned lessons", "Take mini tests"],
          monthlyAssessments: ["Full practice tests", "Progress review"],
          quarterlyEvaluations: ["Official mock tests", "Goal adjustment"]
        }
      };

      console.log('✅ Learning path generated (optimized - no AI call)');
      return learningPath;
    } catch (error) {
      console.error('❌ Learning path generation failed:', error);
      return null;
    }
  }

  /**
   * Lấy danh sách target score ranges phù hợp
   */
  static getTargetScoreRangesForGoal(testType, currentScore, targetGoal) {
    if (testType === 'IELTS') {
      const ranges = ['4.0-5.0', '5.0-6.0', '5.5-6.5', '6.0-7.0', '7.0-8.0', '8.0+'];
      return ranges.filter(range => {
        if (range.includes('+')) {
          const minScore = parseFloat(range.replace('+', ''));
          return minScore <= targetGoal && minScore > currentScore;
        } else {
          const [minScore, maxScore] = range.split('-').map(Number);
          return minScore <= targetGoal && maxScore >= currentScore;
        }
      });
    } else if (testType === 'TOEIC') {
      const ranges = ['250-350', '350-450', '450-550', '550-650', '650-850', '850+'];
      return ranges.filter(range => {
        if (range.includes('+')) {
          const minScore = parseInt(range.replace('+', ''));
          return minScore <= targetGoal && minScore > currentScore;
        } else {
          const [minScore, maxScore] = range.split('-').map(Number);
          return minScore <= targetGoal && maxScore >= currentScore;
        }
      });
    }
    return [];
  }

  /**
   * Kiểm tra điều kiện để tiến tới khóa học tiếp theo
   */
  static async canProgressToNextCourse(userId, courseId) {
    try {
      const user = await User.findById(userId);
      if (!user) return false;

      const enrollment = user.enrolledCourses.find(
        e => e.course.toString() === courseId.toString()
      );

      return enrollment && enrollment.status === 'completed';
    } catch (error) {
      console.error('❌ Check progression eligibility failed:', error);
      return false;
    }
  }

  /**
   * Cập nhật learning journey của user
   */
  static async updateLearningJourney(userId, finalTestResult) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Khởi tạo learning journey nếu chưa có
      if (!user.learningJourney) {
        user.learningJourney = {
          milestones: [],
          currentPath: null,
          totalCoursesCompleted: 0,
          averageProgress: 0
        };
      }

      // Thêm milestone mới
      const milestone = {
        courseId: finalTestResult.courseId,
        completedAt: finalTestResult.completedAt,
        achievedScore: finalTestResult.testType === 'IELTS'
          ? finalTestResult.estimatedLevel?.ielts?.overall
          : finalTestResult.estimatedLevel?.toeic?.overall,
        targetAchieved: finalTestResult.targetAchieved,
        personalTargetAchieved: finalTestResult.personalTargetAchieved
      };

      user.learningJourney.milestones.push(milestone);

      // Cập nhật statistics
      if (finalTestResult.targetAchieved) {
        user.learningJourney.totalCoursesCompleted += 1;
      }

      await user.save();
    } catch (error) {
      console.error('❌ Update learning journey failed:', error);
    }
  }

  /**
   * Lấy progress overview của user
   */
  static async getUserProgressOverview(userId) {
    try {
      const user = await User.findById(userId)
        .populate('enrolledCourses.course', 'title targetScoreRange courseType');

      const finalTestResults = await FinalTestResult.find({ userId })
        .populate('courseId', 'title targetScoreRange')
        .sort({ completedAt: -1 });

      return {
        user: {
          id: user._id,
          currentScore: user.currentScore,
          targetGoals: user.targetGoals,
          enrolledCourses: user.enrolledCourses
        },
        recentResults: finalTestResults.slice(0, 5),
        overallProgress: this.calculateOverallProgress(user, finalTestResults),
        nextRecommendations: await this.getNextRecommendations(user, finalTestResults[0])
      };
    } catch (error) {
      console.error('❌ Get user progress overview failed:', error);
      throw error;
    }
  }

  /**
   * Tính toán overall progress
   */
  static calculateOverallProgress(user, finalTestResults) {
    const completedCourses = user.enrolledCourses.filter(e => e.status === 'completed').length;
    const totalCourses = user.enrolledCourses.length;
    
    const progressPercentage = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;
    
    const targetProgress = {};
    if (user.targetGoals?.ielts?.overall && user.currentScore?.ielts) {
      targetProgress.ielts = (user.currentScore.ielts / user.targetGoals.ielts.overall) * 100;
    }
    if (user.targetGoals?.toeic?.overall && user.currentScore?.toeic) {
      targetProgress.toeic = (user.currentScore.toeic / user.targetGoals.toeic.overall) * 100;
    }

    return {
      courseProgress: Math.min(progressPercentage, 100),
      targetProgress,
      totalCoursesCompleted: completedCourses,
      totalCoursesEnrolled: totalCourses,
      averageScore: this.calculateAverageScore(finalTestResults)
    };
  }

  /**
   * Tính điểm trung bình
   */
  static calculateAverageScore(finalTestResults) {
    if (finalTestResults.length === 0) return 0;

    const totalScore = finalTestResults.reduce((sum, result) => {
      const score = result.testType === 'IELTS'
        ? result.estimatedLevel?.ielts?.overall || 0
        : result.estimatedLevel?.toeic?.overall || 0;
      return sum + score;
    }, 0);

    return totalScore / finalTestResults.length;
  }

  /**
   * Lấy next recommendations
   */
  static async getNextRecommendations(user, latestResult) {
    if (!latestResult) return [];

    try {
      const progressionResult = await this.processPostFinalTest(latestResult);
      return progressionResult.nextSteps;
    } catch (error) {
      console.error('❌ Get next recommendations failed:', error);
      return [];
    }
  }
}

export default CourseProgressionService;
