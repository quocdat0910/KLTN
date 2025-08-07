import UserProgress from "../models/userProgressSchema.js";
import User from "../models/userSchema.js";
import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";

// @route GET /api/v1/progress/course/:courseId
// @desc Get user progress for a specific course
// @access Protected
export const getUserCourseProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "ID khóa học không hợp lệ" });
    }

    // Kiểm tra quyền truy cập
    const isEnrolled = await Enrollment.exists({ userId, courseId, status: "active" });
    if (!isEnrolled && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn chưa đăng ký khóa học này" });
    }

    // Lấy tiến độ học tập
    const progress = await UserProgress.findOne({ userId, courseId })
      .populate({
        path: "chapterProgress.chapterId",
        select: "title order"
      })
      .populate({
        path: "chapterProgress.lessonProgress.lessonId",
        select: "title videoDuration"
      })
      .populate({
        path: "chapterProgress.exerciseResults.exerciseId",
        select: "title type"
      });

    if (!progress) {
      return res.status(404).json({ message: "Không tìm thấy tiến độ học tập" });
    }

    // Tính toán thống kê chi tiết
    const stats = {
      totalChapters: progress.chapterProgress.length,
      completedChapters: progress.chapterProgress.filter(cp => cp.isCompleted).length,
      totalLessons: 0,
      completedLessons: 0,
      totalExercises: 0,
      completedExercises: 0,
      totalWatchTime: progress.totalWatchTime,
      averageScore: 0
    };

    let totalScore = 0;
    let exerciseCount = 0;

    progress.chapterProgress.forEach(chapter => {
      stats.totalLessons += chapter.lessonProgress.length;
      stats.completedLessons += chapter.lessonProgress.filter(lp => lp.isCompleted).length;
      
      stats.totalExercises += chapter.exerciseResults.length;
      stats.completedExercises += chapter.exerciseResults.filter(er => er.isPassed).length;
      
      chapter.exerciseResults.forEach(exercise => {
        if (exercise.score > 0) {
          totalScore += exercise.score;
          exerciseCount++;
        }
      });
    });

    stats.averageScore = exerciseCount > 0 ? Math.round(totalScore / exerciseCount) : 0;

    res.status(200).json({
      message: "Lấy tiến độ khóa học thành công",
      progress: {
        courseId: progress.courseId,
        completionPercentage: progress.completionPercentage,
        isCourseCompleted: progress.isCourseCompleted,
        completedAt: progress.completedAt,
        stats: stats,
        chapterProgress: progress.chapterProgress
      }
    });

  } catch (error) {
    console.error("Lỗi lấy tiến độ khóa học:", error.message);
    next(error);
  }
};

// @route GET /api/v1/progress/course/:courseId/chapter/:chapterId
// @desc Get user progress for a specific chapter
// @access Protected
export const getUserChapterProgress = async (req, res, next) => {
  try {
    const { courseId, chapterId } = req.params;
    const userId = req.user._id;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ message: "ID khóa học hoặc chương không hợp lệ" });
    }

    // Kiểm tra quyền truy cập
    const isEnrolled = await Enrollment.exists({ userId, courseId, status: "active" });
    if (!isEnrolled && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn chưa đăng ký khóa học này" });
    }

    // Lấy tiến độ học tập
    const progress = await UserProgress.findOne({ userId, courseId });
    if (!progress) {
      return res.status(404).json({ message: "Không tìm thấy tiến độ học tập" });
    }

    // Tìm chapter progress
    const chapterProgress = progress.chapterProgress.find(
      cp => cp.chapterId.toString() === chapterId
    );

    if (!chapterProgress) {
      return res.status(404).json({ message: "Không tìm thấy tiến độ chương" });
    }

    // Populate chapter details
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: "Không tìm thấy chương" });
    }

    // Tính toán thống kê chương
    const stats = {
      totalLessons: chapterProgress.lessonProgress.length,
      completedLessons: chapterProgress.lessonProgress.filter(lp => lp.isCompleted).length,
      totalExercises: chapterProgress.exerciseResults.length,
      completedExercises: chapterProgress.exerciseResults.filter(er => er.isPassed).length,
      totalWatchTime: chapterProgress.lessonProgress.reduce((sum, lp) => sum + lp.watchTime, 0),
      averageScore: 0
    };

    let totalScore = 0;
    let exerciseCount = 0;

    chapterProgress.exerciseResults.forEach(exercise => {
      if (exercise.score > 0) {
        totalScore += exercise.score;
        exerciseCount++;
      }
    });

    stats.averageScore = exerciseCount > 0 ? Math.round(totalScore / exerciseCount) : 0;

    res.status(200).json({
      message: "Lấy tiến độ chương thành công",
      chapter: {
        _id: chapter._id,
        title: chapter.title,
        order: chapter.order,
        isCompleted: chapterProgress.isCompleted,
        stats: stats,
        lessonProgress: chapterProgress.lessonProgress,
        exerciseResults: chapterProgress.exerciseResults
      }
    });

  } catch (error) {
    console.error("Lỗi lấy tiến độ chương:", error.message);
    next(error);
  }
};

// @route GET /api/v1/progress/user/:userId/course/:courseId
// @desc Get progress of a specific user for a course (admin only)
// @access Admin
export const getUserProgressById = async (req, res, next) => {
  try {
    const { userId, courseId } = req.params;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "ID người dùng hoặc khóa học không hợp lệ" });
    }

    // Kiểm tra người dùng tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Lấy tiến độ học tập
    const progress = await UserProgress.findOne({ userId, courseId })
      .populate({
        path: "chapterProgress.chapterId",
        select: "title order"
      });

    if (!progress) {
      return res.status(404).json({ message: "Không tìm thấy tiến độ học tập" });
    }

    res.status(200).json({
      message: "Lấy tiến độ người dùng thành công",
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      progress: {
        courseId: progress.courseId,
        completionPercentage: progress.completionPercentage,
        isCourseCompleted: progress.isCourseCompleted,
        totalWatchTime: progress.totalWatchTime,
        completedAt: progress.completedAt,
        chapterProgress: progress.chapterProgress
      }
    });

  } catch (error) {
    console.error("Lỗi lấy tiến độ người dùng:", error.message);
    next(error);
  }
};

// @route GET /api/v1/progress/course/:courseId/statistics
// @desc Get course progress statistics (admin only)
// @access Admin
export const getCourseProgressStatistics = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Kiểm tra đầu vào
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "ID khóa học không hợp lệ" });
    }

    // Kiểm tra khóa học tồn tại
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Lấy thống kê tổng hợp
    const stats = await UserProgress.aggregate([
      { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          averageCompletion: { $avg: "$completionPercentage" },
          completedStudents: {
            $sum: { $cond: [{ $eq: ["$isCourseCompleted", true] }, 1, 0] }
          },
          averageWatchTime: { $avg: "$totalWatchTime" },
          totalWatchTime: { $sum: "$totalWatchTime" }
        }
      }
    ]);

    // Lấy thống kê theo chương
    const chapterStats = await UserProgress.aggregate([
      { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
      { $unwind: "$chapterProgress" },
      {
        $group: {
          _id: "$chapterProgress.chapterId",
          totalStudents: { $sum: 1 },
          completedStudents: {
            $sum: { $cond: [{ $eq: ["$chapterProgress.isCompleted", true] }, 1, 0] }
          }
        }
      }
    ]);

    const result = {
      courseId: courseId,
      courseTitle: course.title,
      statistics: stats[0] || {
        totalStudents: 0,
        averageCompletion: 0,
        completedStudents: 0,
        averageWatchTime: 0,
        totalWatchTime: 0
      },
      chapterStatistics: chapterStats
    };

    res.status(200).json({
      message: "Lấy thống kê khóa học thành công",
      statistics: result
    });

  } catch (error) {
    console.error("Lỗi lấy thống kê khóa học:", error.message);
    next(error);
  }
};

// @route GET /api/v1/progress/user/:userId/overview
// @desc Get overview of all user progress
// @access Protected
export const getUserProgressOverview = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Kiểm tra quyền truy cập
    if (userId !== currentUserId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền xem tiến độ của người khác" });
    }

    // Lấy tất cả tiến độ học tập
    const allProgress = await UserProgress.find({ userId })
      .populate("courseId", "title courseType targetScoreRange")
      .sort({ updatedAt: -1 });

    // Tính toán tổng quan
    const overview = {
      totalCourses: allProgress.length,
      completedCourses: allProgress.filter(p => p.isCourseCompleted).length,
      totalWatchTime: allProgress.reduce((sum, p) => sum + p.totalWatchTime, 0),
      averageCompletion: allProgress.length > 0 
        ? Math.round(allProgress.reduce((sum, p) => sum + p.completionPercentage, 0) / allProgress.length)
        : 0,
      recentActivity: allProgress
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5)
        .map(p => ({
          courseId: p.courseId._id,
          courseTitle: p.courseId.title,
          completionPercentage: p.completionPercentage,
          lastUpdated: p.updatedAt
        }))
    };

    res.status(200).json({
      message: "Lấy tổng quan tiến độ thành công",
      overview: overview,
      progress: allProgress
    });

  } catch (error) {
    console.error("Lỗi lấy tổng quan tiến độ:", error.message);
    next(error);
  }
};

// @route POST /api/v1/progress/submit-exercise
// @desc Submit exercise result (lưu lần làm bài mới)
// @access Protected
export const submitExerciseResult = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { courseId, chapterId, lessonId, exerciseId, answers, score, timeSpent } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(courseId) ||
        !mongoose.Types.ObjectId.isValid(chapterId) ||
        !mongoose.Types.ObjectId.isValid(lessonId) ||
        !mongoose.Types.ObjectId.isValid(exerciseId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    // Lấy bài tập để kiểm tra passingScore, số câu hỏi
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: "Không tìm thấy bài tập" });
    }

    // Lấy hoặc tạo userProgress
    let userProgress = await UserProgress.findOne({ userId, courseId });
    if (!userProgress) {
      // Nếu chưa có, tạo mới
      userProgress = new UserProgress({
        userId,
        courseId,
        chapterProgress: [],
      });
    }

    // Tìm hoặc tạo chapterProgress
    let chapterProgress = userProgress.chapterProgress.find(
      (cp) => cp.chapterId.toString() === chapterId
    );
    if (!chapterProgress) {
      chapterProgress = {
        chapterId,
        isCompleted: false,
        lessonProgress: [],
        exerciseResults: [],
      };
      userProgress.chapterProgress.push(chapterProgress);
    }

    // Tìm hoặc tạo exerciseResult
    let exerciseResult = chapterProgress.exerciseResults.find(
      (er) => er.exerciseId.toString() === exerciseId
    );
    if (!exerciseResult) {
      exerciseResult = {
        exerciseId,
        bestScore: 0,
        totalQuestions: exercise.questions.length,
        correctAnswers: 0,
        isPassed: false,
        attempts: [],
        lastAttemptAt: new Date(),
      };
      chapterProgress.exerciseResults.push(exerciseResult);
    }

    // Tính số câu đúng
    let correct = 0;
    answers.forEach((ans, idx) => {
      const q = exercise.questions[idx];
      if (q) {
        if (exercise.type === 'multiple-choice') {
          if (ans.userAnswer === q.correctAnswer.toString()) correct++;
        } else if (exercise.type === 'true-false') {
          if (ans.userAnswer === q.correctAnswer) correct++;
        }
      }
    });

    // Thêm attempt mới
    const attemptNumber = exerciseResult.attempts.length + 1;
    exerciseResult.attempts.push({
      attemptNumber,
      answers,
      score,
      submittedAt: new Date(),
      timeSpent: timeSpent || 0,
    });
    exerciseResult.lastAttemptAt = new Date();
    exerciseResult.correctAnswers = correct;
    if (score > exerciseResult.bestScore) exerciseResult.bestScore = score;
    // Đánh dấu pass nếu đạt điểm tối thiểu
    if (score >= exercise.passingScore) exerciseResult.isPassed = true;

    await userProgress.save();

    res.status(200).json({
      message: "Nộp bài thành công",
      exerciseResult,
      completionPercentage: userProgress.completionPercentage,
      isCourseCompleted: userProgress.isCourseCompleted,
    });
  } catch (error) {
    console.error("Lỗi submit bài tập:", error.message);
    next(error);
  }
};

// @route GET /api/v1/progress/user/:userId/all
// @desc Get all progress of a user (bao gồm mọi khóa học)
// @access Protected (hoặc admin)
export const getAllProgressOfUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }
    const progresses = await UserProgress.find({ userId })
      .populate({ path: "courseId", select: "title" })
      .populate({ path: "chapterProgress.chapterId", select: "title order" });
    res.status(200).json({
      message: "Lấy toàn bộ tiến trình học thành công",
      progresses,
    });
  } catch (error) {
    console.error("Lỗi lấy tiến trình học:", error.message);
    next(error);
  }
};

// Cập nhật AI insights cho user progress
export const updateAIInsights = catchAsyncErrors(async (req, res, next) => {
  const { courseId } = req.params;
  const { 
    learningPattern, 
    recommendedNextSteps, 
    difficultyAdjustment, 
    optimalStudyTime, 
    focusAreas 
  } = req.body;
  const userId = req.user.id;

  const updateData = {};
  if (learningPattern) updateData['aiInsights.learningPattern'] = learningPattern;
  if (recommendedNextSteps) updateData['aiInsights.recommendedNextSteps'] = recommendedNextSteps;
  if (difficultyAdjustment) updateData['aiInsights.difficultyAdjustment'] = difficultyAdjustment;
  if (optimalStudyTime) updateData['aiInsights.optimalStudyTime'] = optimalStudyTime;
  if (focusAreas) updateData['aiInsights.focusAreas'] = focusAreas;
  
  updateData['aiInsights.lastAnalyzedAt'] = new Date();

  const progress = await UserProgress.findOneAndUpdate(
    { userId, courseId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!progress) {
    return next(new ErrorHandler('Không tìm thấy tiến độ học tập', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      aiInsights: progress.aiInsights
    }
  });
});

// Lấy AI insights cho tất cả khóa học của user
export const getAllAIInsights = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  const progressList = await UserProgress.find({ userId })
    .populate('courseId', 'title targetScoreRange skills')
    .select('courseId completionPercentage totalWatchTime aiInsights');

  const insights = progressList.map(progress => ({
    courseId: progress.courseId._id,
    courseTitle: progress.courseId.title,
    targetScoreRange: progress.courseId.targetScoreRange,
    skills: progress.courseId.skills,
    completionPercentage: progress.completionPercentage,
    totalWatchTime: progress.totalWatchTime,
    aiInsights: progress.aiInsights
  }));

  res.status(200).json({
    success: true,
    data: insights
  });
});