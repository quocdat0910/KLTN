import express from "express";
import rateLimit from "express-rate-limit";
import {
  getAllExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  publishExercise
} from "../controller/exerciseController.js"
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = express.Router({ mergeParams: true }); // Cho phép truy cập :courseId, :chapterId

// Rate limiter cho nộp bài tập
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 5, // Tối đa 5 lần nộp bài tập mỗi giờ
  message: "Quá nhiều yêu cầu nộp bài tập, vui lòng thử lại sau 1 giờ"
});

// Protected routes
router.get("/", protect, getAllExercises); // Xem danh sách bài tập của chương
router.get("/:exerciseId", protect, getExerciseById); // Xem chi tiết bài tập
/*router.post("/:exerciseId/submit", protect, submitLimiter, submitExercise); // Nộp bài tập
router.get("/:exerciseId/results", protect, getExerciseResults); // Xem kết quả bài tập
 */

// Admin routes
router.post("/", protect, restrictTo("admin"), createExercise); // Tạo bài tập mới
router.put("/:exerciseId", protect, restrictTo("admin"), updateExercise); // Cập nhật bài tập
router.delete("/:exerciseId", protect, restrictTo("admin"), deleteExercise); // Xóa bài tập
router.put("/:exerciseId/publish", protect, restrictTo("admin"), publishExercise); // Xuất bản hoặc hủy xuất bản bài tập

export default router;