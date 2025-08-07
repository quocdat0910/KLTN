import express from 'express';
import {
  getRecommendedCourses,
  getRecommendationsForUser,
  updateRecommendationStatus,
  getRecommendationStats
} from '../controller/courseRecommendationController.js';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Student routes
router.get('/', isAuthenticated, getRecommendedCourses);
router.put('/status', isAuthenticated, updateRecommendationStatus);

// Admin routes
router.get('/user/:userId', isAuthenticated, isAuthorized('admin', 'teacher'), getRecommendationsForUser);
router.get('/stats', isAuthenticated, isAuthorized('admin'), getRecommendationStats);

export default router;
