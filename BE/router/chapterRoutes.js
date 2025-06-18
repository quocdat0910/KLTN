import express from 'express';
import {
  createChapter,
  getChapters,
  updateChapter,
  deleteChapter,
} from '../controller/chapterController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Protected routes (yêu cầu đăng nhập, admin hoặc student)
router.get('/', protect, getChapters); // GET /api/v1/courses/:courseId/chapters

// Admin routes (yêu cầu vai trò admin)
router.post('/', protect, restrictTo('admin'), createChapter); // POST /api/v1/courses/:courseId/chapters
router.put('/:chapterId', protect, restrictTo('admin'), updateChapter); // PUT /api/v1/chapters/:chapterId
router.delete('/:chapterId', protect, restrictTo('admin'), deleteChapter); // DELETE /api/v1/chapters/:chapterId

export default router;