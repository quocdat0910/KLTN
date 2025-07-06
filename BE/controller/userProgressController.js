import UserProgress from "../models/userProgressSchema.js";
import Course from "../models/courseSchema.js";
import Chapter from "../models/chapterSchema.js";
import Lesson from "../models/lessonSchema.js";
import Exercise from "../models/exerciseSchema.js";
import mongoose from "mongoose";

// @route GET /api/v1/user-progress/course/:courseId
// @desc Get user progress for a specific course
// @access Protected
export const getUserCourseProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "ID khóa học không hợp lệ" });
    }

    let userProgress = await UserProgress.findOne({ userId, courseId });

    // If no progress exists, create initial progress
    if (!userProgress) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Không tìm thấy khóa học" });
      }

      const chapters = await Chapter.find({ courseId }).sort({ order: 1 });
      
      userProgress = new UserProgress({
        userId,
        courseId,
        chapterProgress: chapters.map(chapter => ({
          chapterId: chapter._id,
          lessonProgress: [],
          exerciseResults: []
        }))
      });

      await userProgress.save();
    }

    res.status(200).json({
      message: "Lấy tiến độ học tập thành công",
      userProgress
    });
  } catch (error) {
    console.error("Lỗi lấy tiến độ học tập:", error.message);
    next(error);
  }
};

// @route PUT /api/v1/user-progress/lesson/:lessonId
// @desc Update lesson progress (video watch time, completion, etc.)
// @access Protected
export const updateLessonProgress = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user._id;
    const { isCompleted, watchTime, lastWatchedAt, score } = req.body;

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: "ID bài học không hợp lệ" });
    }

    // Find the lesson to determine if it's a video or exercise
    const lesson = await Lesson.findById(lessonId);
    const exercise = await Exercise.findById(lessonId);

    if (!lesson && !exercise) {
      return res.status(404).json({ message: "Không tìm thấy bài học" });
    }

    // Determine chapter and course
    let chapterId, courseId;
    if (lesson) {
      chapterId = lesson.chapterId;
      const chapter = await Chapter.findById(chapterId);
      courseId = chapter.courseId;
    } else {
      // For exercises, we need to find which chapter contains this exercise
      const chapter = await Chapter.findOne({ exercises: exercise._id });
      if (!chapter) {
        return res.status(404).json({ message: "Không tìm thấy chương chứa bài tập" });
      }
      chapterId = chapter._id;
      courseId = chapter.courseId;
    }

    // Find or create user progress
    let userProgress = await UserProgress.findOne({ userId, courseId });
    if (!userProgress) {
      userProgress = new UserProgress({
        userId,
        courseId,
        chapterProgress: []
      });
    }

    // Find or create chapter progress
    let chapterProgress = userProgress.chapterProgress.find(
      cp => cp.chapterId.toString() === chapterId.toString()
    );

    if (!chapterProgress) {
      chapterProgress = {
        chapterId,
        lessonProgress: [],
        exerciseResults: []
      };
      userProgress.chapterProgress.push(chapterProgress);
    }

    if (lesson) {
      // Update lesson progress for video
      let lessonProgress = chapterProgress.lessonProgress.find(
        lp => lp.lessonId.toString() === lessonId.toString()
      );

      if (!lessonProgress) {
        lessonProgress = {
          lessonId,
          watchTime: 0,
          isCompleted: false,
          lastWatchedAt: null,
          resourcesAccessed: []
        };
        chapterProgress.lessonProgress.push(lessonProgress);
      }

      // Update lesson progress
      if (watchTime !== undefined) lessonProgress.watchTime = watchTime;
      if (isCompleted !== undefined) lessonProgress.isCompleted = isCompleted;
      if (lastWatchedAt !== undefined) lessonProgress.lastWatchedAt = lastWatchedAt;
    } else {
      // Update exercise results
      let exerciseResult = chapterProgress.exerciseResults.find(
        er => er.exerciseId.toString() === lessonId.toString()
      );

      if (!exerciseResult) {
        exerciseResult = {
          exerciseId: lessonId,
          score: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          isPassed: false,
          timeSpent: 0,
          attempts: 1,
          lastAttemptAt: new Date(),
          answers: []
        };
        chapterProgress.exerciseResults.push(exerciseResult);
      }

      // Update exercise result
      if (score !== undefined) {
        exerciseResult.score = score;
        exerciseResult.isPassed = score >= 70; // Pass threshold
        exerciseResult.lastAttemptAt = new Date();
      }
    }

    await userProgress.save();

    res.status(200).json({
      message: "Cập nhật tiến độ thành công",
      userProgress
    });
  } catch (error) {
    console.error("Lỗi cập nhật tiến độ:", error.message);
    next(error);
  }
};

// @route GET /api/v1/user-progress/course/:courseId/chapter/:chapterId
// @desc Get user progress for a specific chapter
// @access Protected
export const getUserChapterProgress = async (req, res, next) => {
  try {
    const { courseId, chapterId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(chapterId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const userProgress = await UserProgress.findOne({ userId, courseId });
    if (!userProgress) {
      return res.status(404).json({ message: "Không tìm thấy tiến độ học tập" });
    }

    const chapterProgress = userProgress.chapterProgress.find(
      cp => cp.chapterId.toString() === chapterId.toString()
    );

    if (!chapterProgress) {
      return res.status(404).json({ message: "Không tìm thấy tiến độ chương" });
    }

    res.status(200).json({
      message: "Lấy tiến độ chương thành công",
      chapterProgress
    });
  } catch (error) {
    console.error("Lỗi lấy tiến độ chương:", error.message);
    next(error);
  }
};

// @route GET /api/v1/user-progress/user/:userId/course/:courseId
// @desc Get user progress by user ID and course ID (admin only)
// @access Admin
export const getUserProgressById = async (req, res, next) => {
  try {
    const { userId, courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const userProgress = await UserProgress.findOne({ userId, courseId });
    if (!userProgress) {
      return res.status(404).json({ message: "Không tìm thấy tiến độ học tập" });
    }

    res.status(200).json({
      message: "Lấy tiến độ học tập thành công",
      userProgress
    });
  } catch (error) {
    console.error("Lỗi lấy tiến độ học tập:", error.message);
    next(error);
  }
};

// @route GET /api/v1/user-progress/course/:courseId/statistics
// @desc Get course progress statistics (admin only)
// @access Admin
export const getCourseProgressStatistics = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "ID khóa học không hợp lệ" });
    }

    const allProgress = await UserProgress.find({ courseId });
    
    const statistics = {
      totalEnrollments: allProgress.length,
      completedCourses: allProgress.filter(p => p.isCourseCompleted).length,
      averageCompletionPercentage: 0,
      averageWatchTime: 0,
      chapterStats: []
    };

    if (allProgress.length > 0) {
      const totalCompletion = allProgress.reduce((sum, p) => sum + p.completionPercentage, 0);
      const totalWatchTime = allProgress.reduce((sum, p) => sum + p.totalWatchTime, 0);
      
      statistics.averageCompletionPercentage = Math.round(totalCompletion / allProgress.length);
      statistics.averageWatchTime = Math.round(totalWatchTime / allProgress.length);
    }

    res.status(200).json({
      message: "Lấy thống kê tiến độ thành công",
      statistics
    });
  } catch (error) {
    console.error("Lỗi lấy thống kê tiến độ:", error.message);
    next(error);
  }
}; 