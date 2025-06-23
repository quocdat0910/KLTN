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

// 1. Public routes (các route chung, không yêu cầu xác thực)
// Đặt các route này lên đầu để chúng được khớp trước
router.get('/', getCourses); // GET /api/v1/courses (lấy tất cả khóa học công khai)

// Đặt route getCourseById công khai NGAY SAU getCourses tổng quát
// Điều này cho phép người dùng không cần đăng nhập vẫn xem được chi tiết khóa học.
// Logic kiểm tra 'draft' status và 'admin' role vẫn được xử lý trong controller getCourseById.
router.get('/:courseId', getCourseById); // GET /api/v1/courses/:courseId (lấy một khóa học cụ thể theo ID)


// 2. Protected routes (yêu cầu đăng nhập, cho student hoặc chung)
// Các route này yêu cầu người dùng phải xác thực (đã đăng nhập).
router.get('/purchased', protect, restrictTo('student'), getPurchasedCourses); // GET /api/v1/courses/purchased
router.get('/purchases/:purchaseId', protect, getPurchaseDetails); // GET /api/v1/courses/purchases/:purchaseId (chi tiết giao dịch)
router.get('/:courseId/ownership', protect, restrictTo('student'), checkCourseOwnership); // GET /api/v1/courses/:courseId/ownership
router.post('/:courseId/purchase', protect, restrictTo('student'), purchaseLimiter, purchaseCourse); // POST /api/v1/courses/:courseId/purchase
router.post('/:courseId/payments/paypal', protect, restrictTo('student'), paypalLimiter, createPaypalOrder); // POST /api/v1/courses/:courseId/payments/paypal
router.post('/payments/paypal/capture', protect, restrictTo('student'), capturePaypalOrder); // POST /api/v1/payments/paypal/capture


// 3. Admin routes (yêu cầu vai trò admin)
// Các route này yêu cầu cả xác thực và vai trò admin.
// Đặt chúng ở cuối cùng hoặc sử dụng các đường dẫn cụ thể hơn để tránh xung đột.
// Lưu ý: Đã loại bỏ router.get('/:courseId', protect, restrictTo('admin'), getCourseById); cũ
// vì phiên bản công khai đã được đặt ở trên. Nếu admin cần một API getCourseById khác,
// nó nên có đường dẫn riêng, ví dụ: '/admin/details/:courseId'.
router.post('/', protect, restrictTo('admin'), createCourse); // POST /api/v1/courses (tạo mới)
router.get('/admin', protect, restrictTo('admin'), getAllCoursesAdmin); // GET /api/v1/courses/admin
router.get('/purchases/admin', protect, restrictTo('admin'), getAllPurchasesAdmin); // GET /api/v1/courses/purchases/admin (admin xem tất cả giao dịch)
router.put('/:courseId', protect, restrictTo('admin'), updateCourse); // PUT /api/v1/courses/:courseId
router.delete('/:courseId', protect, restrictTo('admin'), deleteCourse); // DELETE /api/v1/courses/:courseId


export default router;
