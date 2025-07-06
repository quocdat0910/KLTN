import express from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  getUserCourseProgress,
  updateLessonProgress,
  getUserChapterProgress,
  getUserProgressById,
  getCourseProgressStatistics
} from "../controller/userProgressController.js";

const router = express.Router();

// Protected routes
router.get("/course/:courseId", protect, getUserCourseProgress); // Xem tiến độ học tập của một khóa học
router.put("/lesson/:lessonId", protect, updateLessonProgress); // Cập nhật tiến độ bài học
router.get("/course/:courseId/chapter/:chapterId", protect, getUserChapterProgress); // Xem tiến độ của một chương

// Admin routes
router.get("/user/:userId/course/:courseId", protect, restrictTo("admin"), getUserProgressById); // Xem tiến độ của một người dùng trong khóa học
router.get("/course/:courseId/statistics", protect, restrictTo("admin"), getCourseProgressStatistics); // Xem thống kê tiến độ của khóa học

export default router;