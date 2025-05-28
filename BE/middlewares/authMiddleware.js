import jwt from 'jsonwebtoken';
import User from '../models/userSchema.js';

const getTokenCookieName = (role) => {
  if (!role) return 'token';
  return `${role.charAt(0).toUpperCase() + role.slice(1)}Token`;
};

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies) {
      const tempToken = Object.values(req.cookies).find((value) =>
        value.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
      );
      if (tempToken) {
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET_KEY);
        const role = decoded.role;
        const tokenCookieName = getTokenCookieName(role);
        token = req.cookies[tokenCookieName];
      }
    }

    if (!token) {
      return res.status(401).json({ message: 'Không được phép, vui lòng đăng nhập' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Người dùng không tồn tại' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Lỗi xác thực:', error.message);
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập tài nguyên này' });
    }
    next();
  };
};

export const admin = (req, res, next) => {
  return restrictTo('admin')(req, res, next);
};