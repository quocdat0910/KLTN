import express from "express";
import {
  getUserCourseProgress,
  getUserChapterProgress,
  getUserProgressById,
  getCourseProgressStatistics,
  getUserProgressOverview,
  submitExerciseResult,
  getAllProgressOfUser,
  updateAIInsights,
  getAllAIInsights
} from "../controller/userProgressController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protected routes
router.get("/course/:courseId", protect, getUserCourseProgress); // Xem tiến độ học tập của một khóa học
router.get("/course/:courseId/chapter/:chapterId", protect, getUserChapterProgress); // Xem tiến độ của một chương
router.get("/user/:userId/overview", protect, getUserProgressOverview); // Xem tổng quan tiến độ của user

// Thêm endpoint mới
router.post("/submit-exercise", protect, submitExerciseResult); // Nộp bài tập
router.get("/user/:userId/all", protect, getAllProgressOfUser); // Lấy toàn bộ tiến trình học của user

// AI Insights routes
router.put("/course/:courseId/ai-insights", protect, updateAIInsights); // Cập nhật AI insights cho khóa học
router.get("/ai-insights", protect, getAllAIInsights); // Lấy AI insights cho tất cả khóa học

// Admin routes
router.get("/user/:userId/course/:courseId", protect, restrictTo("admin"), getUserProgressById); // Xem tiến độ của một người dùng trong khóa học
router.get("/course/:courseId/statistics", protect, restrictTo("admin"), getCourseProgressStatistics); // Xem thống kê tiến độ của khóa học

export default router;