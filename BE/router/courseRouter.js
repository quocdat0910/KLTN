import express from "express";
import rateLimit from "express-rate-limit";
import {
  getAllCourses,
  getCourseById,
  enrollCourse,
  getCourseProgress,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  getCourseEnrollments,
  getCourseStatistics,
} from "../controller/courseController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rate limiter cho đăng ký khóa học
const enrollLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 5, // Tối đa 5 lần thử đăng ký
  message: "Quá nhiều yêu cầu đăng ký khóa học, vui lòng thử lại sau 1 giờ"
});

// Public routes
router.get("/", getAllCourses); // Xem danh sách khóa học (lọc theo category, level, skills)
router.get("/:id", protect, getCourseById); // Xem chi tiết khóa học

// Protected routes
router.post("/enroll/:id", protect, enrollLimiter, enrollCourse); // Đăng ký khóa học
router.get("/progress/:id", protect, getCourseProgress); // Xem tiến độ học tập của khóa học 

// Admin routes
router.post("/", protect, restrictTo("admin"), createCourse); // Tạo khóa học mới
router.put("/:id", protect, restrictTo("admin"), updateCourse); // Cập nhật khóa học
router.delete("/:id", protect, restrictTo("admin"), deleteCourse); // Xóa khóa học
router.put("/:id/publish", protect, restrictTo("admin"), publishCourse); // Xuất bản hoặc hủy xuất bản khóa học
router.get("/:id/enrollments", protect, restrictTo("admin"), getCourseEnrollments); // Xem danh sách người dùng đăng ký khóa học
router.get("/:id/statistics", protect, restrictTo("admin"), getCourseStatistics); // Xem thống kê khóa học (số đăng ký, tiến độ trung bình)

export default router;