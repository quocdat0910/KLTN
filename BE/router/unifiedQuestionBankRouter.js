import express from 'express';
import {
  getAllQuestions,
  generateAIPlacementQuestions,
  generateAIFinalTestQuestions,
  deleteQuestion,
  updateQuestion,
  createPlacementQuestion,
  createFinalTestQuestion,
  getDifficultyLevels
} from '../controller/unifiedQuestionBankController.js';
import { isAuthenticated, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==================== UNIFIED QUESTION BANK ROUTES ====================

// Lấy tất cả câu hỏi (cả placement và final test)
router.get('/', isAuthenticated, restrictTo('admin'), getAllQuestions);

// Lấy danh sách difficulty levels cho testType
router.get('/difficulty-levels', isAuthenticated, restrictTo('admin'), getDifficultyLevels);

// Tạo câu hỏi thủ công cho placement test
router.post('/placement', isAuthenticated, restrictTo('admin'), createPlacementQuestion);

// Tạo câu hỏi thủ công cho final test
router.post('/final-test', isAuthenticated, restrictTo('admin'), createFinalTestQuestion);

// Tạo câu hỏi bằng AI cho placement test
router.post('/placement/generate-ai', isAuthenticated, restrictTo('admin'), generateAIPlacementQuestions);

// Tạo câu hỏi bằng AI cho final test
router.post('/final-test/generate-ai', isAuthenticated, restrictTo('admin'), generateAIFinalTestQuestions);

// Cập nhật câu hỏi (hỗ trợ cả placement và final test)
router.put('/:id', isAuthenticated, restrictTo('admin'), updateQuestion);

// Xóa câu hỏi (hỗ trợ cả placement và final test)
router.delete('/:id', isAuthenticated, restrictTo('admin'), deleteQuestion);

export default router;
