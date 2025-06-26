import express from "express";
import rateLimit from "express-rate-limit";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = express.Router({ mergeParams: true }); // Truy cập :courseId, :chapterId, :lessonId

// Rate limiter cho thêm ghi chú
const noteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 50, // Tối đa 10 ghi chú mỗi giờ
  message: "Quá nhiều yêu cầu thêm ghi chú, vui lòng thử lại sau 1 giờ"
});

// Protected routes
/* 
router.get("/", protect, getLessonNotes); // Xem danh sách ghi chú của bài học (chỉ ghi chú của người dùng hoặc công khai)
router.post("/", protect, noteLimiter, addLessonNote); // Thêm ghi chú mới
router.put("/:noteId", protect, updateLessonNote); // Cập nhật ghi chú
router.delete("/:noteId", protect, deleteLessonNote); // Xóa ghi chú
 */

// Admin routes
/* 
router.get("/all", protect, restrictTo("admin"), getAllLessonNotes); // Xem tất cả ghi chú của bài học
router.get("/user/:userId", protect, restrictTo("admin"), getNotesByUser); // Xem ghi chú của một người dùng
 */

export default router;