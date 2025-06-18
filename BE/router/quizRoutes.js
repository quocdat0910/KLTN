import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  createQuiz,
  getQuizzes,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
} from '../controller/quizController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

// Rate limiter cho nộp bài tập
const quizSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Tối đa 10 lần nộp mỗi 15 phút
  message: 'Quá nhiều yêu cầu nộp bài tập, vui lòng thử lại sau 15 phút',
});

const router = express.Router({ mergeParams: true });

// Protected routes (yêu cầu đăng nhập, admin hoặc student)
router.get('/', protect, getQuizzes); // GET /api/v1/chapters/:chapterId/quizzes
router.post('/:quizId/submit', protect, restrictTo('student'), quizSubmissionLimiter, submitQuiz); // POST /api/v1/quizzes/:quizId/submit

// Admin routes (yêu cầu vai trò admin)
router.post('/', protect, restrictTo('admin'), createQuiz); // POST /api/v1/chapters/:chapterId/quizzes
router.put('/:quizId', protect, restrictTo('admin'), updateQuiz); // PUT /api/v1/quizzes/:quizId
router.delete('/:quizId', protect, restrictTo('admin'), deleteQuiz); // DELETE /api/v1/quizzes/:quizId

export default router;