import express from "express";
import rateLimit from "express-rate-limit";
import {
  getAllLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  publishLesson,
  addLessonResource,
  deleteLessonResource,
  updateLessonProgress
} from "../controller//lessonController.js"
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = express.Router({ mergeParams: true }); // Cho phép truy cập :courseId, :chapterId

// Rate limiter cho thêm ghi chú
const noteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 50, // Tối đa 50 ghi chú mỗi giờ
  message: "Quá nhiều yêu cầu thêm ghi chú, vui lòng thử lại sau 1 giờ"
});

// Protected routes
router.get("/", protect, getAllLessons); // Xem danh sách bài học của chương
router.get("/:lessonId", protect, getLessonById); // Xem chi tiết bài học (video, resources, notes)
router.post("/:lessonId/progress", protect, updateLessonProgress); // Cập nhật tiến độ xem bài học

// Admin routes
router.post("/", protect, restrictTo("admin"), createLesson); // Tạo bài học mới
router.put("/:lessonId", protect, restrictTo("admin"), updateLesson); // Cập nhật bài học
router.delete("/:lessonId", protect, restrictTo("admin"), deleteLesson); // Xóa bài học
router.put("/:lessonId/publish", protect, restrictTo("admin"), publishLesson); // Xuất bản hoặc hủy xuất bản bài học
router.post("/:lessonId/resources", protect, restrictTo("admin"), addLessonResource); // Thêm tài liệu
router.delete("/:lessonId/resources/:resourceId", protect, restrictTo("admin"), deleteLessonResource); // Xóa tài liệu


export default router;