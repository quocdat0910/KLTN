import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  requestVerification,
  verifyAccount,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controller/userController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rate limiter cho requestVerification
const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3, // Tối đa 3 yêu cầu mỗi giờ
  message: 'Quá nhiều yêu cầu gửi email xác minh, vui lòng thử lại sau 1 giờ',
});

// Public routes
router.post('/register', register); // POST /api/v1/users/register
router.post('/login', login); // POST /api/v1/users/login
router.get('/verify', verifyAccount); // GET /api/v1/users/verify
router.post('/refresh-token', refreshToken); // POST /api/v1/users/refresh-token
router.post('/request-verification', verificationLimiter, requestVerification); // POST /api/v1/users/request-verification

// Protected routes (yêu cầu đăng nhập)
router.post('/logout', protect, logout); // POST /api/v1/users/logout
//router.get('/profile', protect, getProfile); // GET /api/v1/users/profile
//router.put('/profile', protect, updateProfile); // PUT /api/v1/users/profile

// Admin routes (yêu cầu vai trò admin)
router.post('/', protect, admin, createUser); // POST /api/v1/users
router.get('/', protect, admin, getAllUsers); // GET /api/v1/users
router.get('/:id', protect, admin, getUserById); // GET /api/v1/users/:id
router.put('/:id', protect, admin, updateUser); // PUT /api/v1/users/:id
router.delete('/:id', protect, admin, deleteUser); // DELETE /api/v1/users/:id

export default router;