import express from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  requestVerification,
  verifyAccount,
  refreshToken,
  logout,
  getUserProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changeUserPasswordByAdmin,
  updateAIAnalytics,
  updateLearningPreferences,
  getAIInsights,
} from "../controller/userController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rate limiter cho đăng nhập
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 lần thử
  message: "Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút",
});

// Rate limiter cho yêu cầu xác minh
const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  maxAge: 5,
  message:
    "Quá nhiều yêu cầu gửi email xác minh, vui lòng thử lại sau 5 giờ phút",
});

// Rate limiter cho quên mật khẩu
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ",
});

// Rate limiter cho refreshToken
const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Quá nhiều yêu cầu làm mới token, bạn thử lại sau 15 phút",
});

// Public routes
router.post("/register", register);
router.post("/login", loginLimiter, login);
router.get("/verify", verifyAccount);
router.post("/refresh-token", refreshTokenLimiter, refreshToken);
router.post("/request-verification", verificationLimiter, requestVerification);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.post("/logout", protect, logout);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// AI Analytics routes
router.put("/ai-analytics", protect, updateAIAnalytics);
router.put("/learning-preferences", protect, updateLearningPreferences);
router.get("/ai-insights", protect, getAIInsights);

/*
router.get("/enrolled-courses", protect, getEnrolledCourses); Xem danh sách khóa học đã đăng ký của người dùng
router.get("/payment-history", protect, getPaymentHistory); Xem lịch sử thanh toán của người dùng
router.post("/enroll/:courseId", protect, enrollCourse); Đăng ký khóa học (Tích hợp thanh toán PayPal)
*/

// Admin routes
router.post("/", protect, restrictTo("admin"), createUser);
router.get("/", protect, restrictTo("admin"), getAllUsers);
router.get("/:id", protect, restrictTo("admin"), getUserById);
router.put("/:id", protect, restrictTo("admin"), updateUser);
router.delete("/:id", protect, restrictTo("admin"), deleteUser);
router.put("/:id/change-password", protect, restrictTo("admin"), changeUserPasswordByAdmin);
/*
router.get("/:id/enrolled-courses", protect, restrictTo("admin"), getUserEnrolledCourses); Admin xem danh sách khóa học đã đăng ký của một người dùng cụ thể
router.get("/:id/payment-history", protect, restrictTo("admin"), getUserPaymentHistory); Admin xem lịch sử thanh toán của một người dùng cụ thể
router.put("/:id/enrollments/:courseId", protect, restrictTo("admin"), updateEnrollment); Cập nhật thông tin đăng ký khóa học
*/

export default router;
