import express from "express";
import {
    createChapter,
    updateChapter,
    deleteChapter,
    publishChapter,
    getAllChaptersByCourse,
    getChapterDetails       
} from "../controller/chapterController.js"
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = express.Router({ mergeParams: true }); // Cho phép truy cập :courseId từ courseRouter

router.get("/", getAllChaptersByCourse);
router.get("/:chapterId", getChapterDetails); // Lấy chi tiết một chương cụ thể

// Admin routes
router.post("/", protect, restrictTo("admin"), createChapter); // Tạo chương mới
router.put("/:chapterId", protect, restrictTo("admin"), updateChapter); // Cập nhật chương
router.delete("/:chapterId", protect, restrictTo("admin"), deleteChapter); // Xóa chương
router.put("/:chapterId/publish", protect, restrictTo("admin"), publishChapter); // Xuất bản hoặc hủy xuất bản chương

// Route to get details of a single chapter
// Decide if this should be public, restricted to enrolled users, or only for admins

export default router;