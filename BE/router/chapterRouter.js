import express from "express";
import {
    createChapter,
    updateChapter,
    deleteChapter,
    publishChapter
} from "../controller/chapterController.js"
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = express.Router({ mergeParams: true }); // Cho phép truy cập :courseId từ courseRouter

// Admin routes
router.post("/", protect, restrictTo("admin"), createChapter); // Tạo chương mới
router.put("/:chapterId", protect, restrictTo("admin"), updateChapter); // Cập nhật chương
router.delete("/:chapterId", protect, restrictTo("admin"), deleteChapter); // Xóa chương
router.put("/:chapterId/publish", protect, restrictTo("admin"), publishChapter); // Xuất bản hoặc hủy xuất bản chương

export default router;
