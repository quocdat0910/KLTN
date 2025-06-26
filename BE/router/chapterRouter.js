import express from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = express.Router({ mergeParams: true }); // Cho phép truy cập :courseId từ courseRouter

// Public routes
/* 
router.get("/", getAllChapters); // Xem danh sách chương của khóa học (chỉ hiển thị nếu đã đăng ký hoặc công khai)
router.get("/:chapterId", getChapterById); // Xem chi tiết chương (bao gồm lessons, exercises nếu đã đăng ký)
 */

// Admin routes
/* 
router.post("/", protect, restrictTo("admin"), createChapter); // Tạo chương mới
router.put("/:chapterId", protect, restrictTo("admin"), updateChapter); // Cập nhật chương
router.delete("/:chapterId", protect, restrictTo("admin"), deleteChapter); // Xóa chương
router.put("/:chapterId/publish", protect, restrictTo("admin"), publishChapter); // Xuất bản hoặc hủy xuất bản chương
 */

export default router;
