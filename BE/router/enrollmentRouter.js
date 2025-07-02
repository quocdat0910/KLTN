import express from "express";
import rateLimit from "express-rate-limit";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rate limiter cho đăng ký khóa học (đã có trong courseRouter, nhưng giữ lại nếu cần)
const enrollLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 5, // Tối đa 5 lần thử đăng ký
  message: "Quá nhiều yêu cầu đăng ký khóa học, vui lòng thử lại sau 1 giờ"
});

// Protected routes
/* 
router.get("/", protect, getUserEnrollments); // Xem danh sách khóa học đã đăng ký của người dùng
router.get("/:enrollmentId", protect, getEnrollmentById); // Xem chi tiết đăng ký (bao gồm paymentDetails)
 */

// Admin routes
/* 
router.get("/all", protect, restrictTo("admin"), getAllEnrollments); // Xem tất cả đăng ký trên hệ thống
router.get("/user/:userId", protect, restrictTo("admin"), getEnrollmentsByUser); // Xem đăng ký của một người dùng
router.get("/course/:courseId", protect, restrictTo("admin"), getEnrollmentsByCourse); // Xem đăng ký của một khóa học
router.put("/:enrollmentId", protect, restrictTo("admin"), updateEnrollment); // Cập nhật trạng thái hoặc thông tin đăng ký
 */

export default router;