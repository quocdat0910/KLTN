import express from "express";
import rateLimit from "express-rate-limit";
import {
  enrollCourse,
  getUserEnrollments,
  getEnrollmentById,
  getAllEnrollments,
  getEnrollmentsByUser,
  getEnrollmentsByCourse,
  updateEnrollment
} from "../controller/enrollController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rate limiter cho đăng ký khóa học (đã có trong courseRouter, nhưng giữ lại nếu cần)
const enrollLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 5, // Tối đa 5 lần thử đăng ký
  message: "Quá nhiều yêu cầu đăng ký khóa học, vui lòng thử lại sau 1 giờ"
});

router.post("/courses/:courseId/enroll", protect, enrollLimiter, enrollCourse);

// Protected routes
router.get("/", protect, getUserEnrollments);
router.get("/:enrollmentId", protect, getEnrollmentById);

// Admin routes
router.get("/all", protect, restrictTo("admin"), getAllEnrollments);
router.get("/user/:userId", protect, restrictTo("admin"), getEnrollmentsByUser);
router.get("/course/:courseId", protect, restrictTo("admin"), getEnrollmentsByCourse);
router.put("/:enrollmentId", protect, restrictTo("admin"), updateEnrollment);

export default router;