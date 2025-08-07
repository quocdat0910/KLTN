import express from 'express';
import {
  createQuestionBank,
  getQuestionBank,
  deleteQuestionBank,
  generateAIQuestions,
  createPlacementTest,
  getAllPlacementTests,
  deletePlacementTest,
  togglePlacementTestStatus,
  getPlacementTest,
  submitPlacementTest,
  getPlacementTestResult,
  getPlacementTestStats
} from '../controller/placementTestController.js';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Question Bank routes (Admin only)
router.post('/questions', isAuthenticated, isAuthorized('admin', 'teacher'), createQuestionBank);
router.get('/questions', isAuthenticated, isAuthorized('admin', 'teacher'), getQuestionBank);
router.delete('/questions/:id', isAuthenticated, isAuthorized('admin', 'teacher'), deleteQuestionBank);
router.post('/generate-ai-questions', isAuthenticated, isAuthorized('admin', 'teacher'), generateAIQuestions);

// Placement Test management routes (Admin only)
router.post('/', isAuthenticated, isAuthorized('admin', 'teacher'), createPlacementTest);
router.get('/admin/all', isAuthenticated, isAuthorized('admin', 'teacher'), getAllPlacementTests);
router.delete('/:id', isAuthenticated, isAuthorized('admin', 'teacher'), deletePlacementTest);
router.patch('/:id/toggle-active', isAuthenticated, isAuthorized('admin', 'teacher'), togglePlacementTestStatus);
router.get('/stats', isAuthenticated, isAuthorized('admin'), getPlacementTestStats);

// Student routes
router.get('/:testType', isAuthenticated, getPlacementTest);
router.post('/submit', isAuthenticated, submitPlacementTest);
router.get('/result/:testType', isAuthenticated, getPlacementTestResult);

export default router;
