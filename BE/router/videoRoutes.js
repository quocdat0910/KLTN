import express from 'express';
import {
  createVideo,
  getVideos,
  updateVideo,
  deleteVideo,
} from '../controller/videoController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Protected routes (yêu cầu đăng nhập, admin hoặc student)
router.get('/', protect, getVideos); // GET /api/v1/chapters/:chapterId/videos

// Admin routes (yêu cầu vai trò admin)
router.post('/', protect, restrictTo('admin'), createVideo); // POST /api/v1/chapters/:chapterId/videos
router.put('/:videoId', protect, restrictTo('admin'), updateVideo); // PUT /api/v1/videos/:videoId
router.delete('/:videoId', protect, restrictTo('admin'), deleteVideo); // DELETE /api/v1/videos/:videoId

export default router;