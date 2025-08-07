import express from "express";
import {
  getAllQuestions,
  generateQuestionsWithAI,
  addQuestionToBank,
  updateQuestion,
  deleteQuestion,
  getQuestionStats,
  addQuestionsFromAI
} from "../controller/questionBankController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes (có thể cần cho admin)
router.get("/", getAllQuestions); // Lấy tất cả câu hỏi
router.get("/stats", getQuestionStats); // Lấy thống kê

// AI Service routes (không cần authentication)
router.post("/ai-add", addQuestionsFromAI); // Thêm câu hỏi từ AI service

// Admin routes
router.post("/generate-ai", protect, restrictTo("admin"), generateQuestionsWithAI); // Tạo câu hỏi bằng AI
router.post("/", protect, restrictTo("admin"), addQuestionToBank); // Thêm câu hỏi thủ công
router.put("/:id", protect, restrictTo("admin"), updateQuestion); // Cập nhật câu hỏi
router.delete("/:id", protect, restrictTo("admin"), deleteQuestion); // Xóa câu hỏi

export default router; 