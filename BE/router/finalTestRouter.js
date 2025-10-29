import express from 'express';
import {
  // Final Test Question Bank
  getFinalTestQuestions,
  createFinalTestQuestion,
  generateAIFinalTestQuestions,
  updateFinalTestQuestion,
  deleteFinalTestQuestion,
  
  // Final Test
  getFinalTests,
  getFinalTestById,
  createFinalTest,
  createFinalTestWithAI,
  updateFinalTest,
  deleteFinalTest,
  
  // Final Test Results
  getFinalTestResults,
  getFinalTestResultById,
  getUserFinalTestResults,
  submitFinalTest,
  
  // Course Progression
  getUserProgressOverview,
  checkProgressionEligibility
} from '../controller/finalTestController.js';
import { isAuthenticated, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==================== FINAL TEST QUESTION BANK ROUTES ====================

// Lấy tất cả câu hỏi Final Test (Admin only)
router.get('/questions', isAuthenticated, restrictTo("admin"), getFinalTestQuestions);

// Tạo câu hỏi Final Test thủ công (Admin only)
router.post('/questions', isAuthenticated, restrictTo("admin"), createFinalTestQuestion);

// Tạo câu hỏi Final Test bằng AI (Admin only)
router.post('/questions/generate-ai', isAuthenticated, restrictTo("admin"), generateAIFinalTestQuestions);

// Cập nhật câu hỏi Final Test (Admin only)
router.put('/questions/:id', isAuthenticated, restrictTo("admin"), updateFinalTestQuestion);

// Xóa câu hỏi Final Test (Admin only)
router.delete('/questions/:id', isAuthenticated, restrictTo("admin"), deleteFinalTestQuestion);

// ==================== FINAL TEST ROUTES ====================

// Lấy tất cả Final Test (Admin + User có thể xem để làm test)
router.get('/', isAuthenticated, getFinalTests);

// Lấy Final Test theo ID (Admin + User có thể xem test để làm)
router.get('/:id', isAuthenticated, getFinalTestById);

// Tạo Final Test (Admin only)
router.post('/', isAuthenticated, restrictTo("admin"), createFinalTest);

// Tạo Final Test với AI (Admin only)
router.post('/create-with-ai', isAuthenticated, restrictTo("admin"), createFinalTestWithAI);

// Cập nhật Final Test (Admin only)
router.put('/:id', isAuthenticated, restrictTo("admin"), updateFinalTest);

// Xóa Final Test (Admin only)
router.delete('/:id', isAuthenticated, restrictTo("admin"), deleteFinalTest);

// ==================== FINAL TEST RESULTS ROUTES ====================

// Lấy kết quả Final Test của user
router.get('/results/user', isAuthenticated, getFinalTestResults);

// Lấy kết quả Final Test theo user và course
router.get('/results/user/course', isAuthenticated, getUserFinalTestResults);

// Lấy kết quả Final Test theo ID
router.get('/results/:id', isAuthenticated, getFinalTestResultById);

// Submit Final Test
router.post('/submit', isAuthenticated, submitFinalTest);

// ==================== COURSE PROGRESSION ROUTES ====================

// Lấy progress overview của user
router.get('/progress/overview', isAuthenticated, getUserProgressOverview);

// Kiểm tra điều kiện tiến tới khóa học tiếp theo
router.get('/progress/check/:courseId', isAuthenticated, checkProgressionEligibility);

export default router;
