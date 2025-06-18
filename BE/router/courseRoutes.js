import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getAllCoursesAdmin,
  purchaseCourse,
  createPaypalOrder,
  capturePaypalOrder,
  getPurchasedCourses,
  checkCourseOwnership,
  getPurchaseDetails,
  getAllPurchasesAdmin,
} from '../controller/courseController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

// Rate limiter cho các endpoint giao dịch
const purchaseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 yêu cầu mỗi 15 phút
  message: 'Quá nhiều yêu cầu mua khóa học, vui lòng thử lại sau 15 phút',
});

// Rate limiter cho PayPal order
const paypalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 yêu cầu mỗi 15 phút
  message: 'Quá nhiều yêu cầu tạo PayPal order, vui lòng thử lại sau 15 phút',
});

const router = express.Router();

// Public routes
router.get('/', getCourses); // GET /api/v1/courses
router.get('/:courseId', getCourseById); // GET /api/v1/courses/:courseId

// Protected routes (yêu cầu đăng nhập, student)
router.get('/purchased', protect, restrictTo('student'), getPurchasedCourses); // GET /api/v1/courses/purchased
router.get('/purchases/:purchaseId', protect, getPurchaseDetails); // GET /api/v1/purchases/:purchaseId
router.get('/:courseId/ownership', protect, restrictTo('student'), checkCourseOwnership); // GET /api/v1/courses/:courseId/ownership
router.post('/:courseId/purchase', protect, restrictTo('student'), purchaseLimiter, purchaseCourse); // POST /api/v1/courses/:courseId/purchase
router.post('/:courseId/payments/paypal', protect, restrictTo('student'), paypalLimiter, createPaypalOrder); // POST /api/v1/courses/:courseId/payments/paypal
router.post('/payments/paypal/capture', protect, restrictTo('student'), capturePaypalOrder); // POST /api/v1/payments/paypal/capture

// Admin routes (yêu cầu vai trò admin)
router.post('/', protect, restrictTo('admin'), createCourse); // POST /api/v1/courses
router.get('/admin', protect, restrictTo('admin'), getAllCoursesAdmin); // GET /api/v1/courses/admin
router.get('/purchases', protect, restrictTo('admin'), getAllPurchasesAdmin); // GET /api/v1/purchases
router.put('/:courseId', protect, restrictTo('admin'), updateCourse); // PUT /api/v1/courses/:courseId
router.delete('/:courseId', protect, restrictTo('admin'), deleteCourse); // DELETE /api/v1/courses/:courseId

export default router;