import User from '../models/userSchema.js';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../utils/emailService.js';
import RefreshToken from '../models/RefreshToken.js';
import crypto from 'crypto';
import cloudinary from 'cloudinary';

// Hàm hỗ trợ để tạo tên cookie dựa trên vai trò
const getTokenCookieName = (role) => {
  if (!role) return 'token';
  return `${role.charAt(0).toUpperCase() + role.slice(1)}Token`;
};

export const register = async (req, res, next) => {
  try {
    const { email, password, confirmPassword, firstName, lastName, dateOfBirth, gender, phone, address } = req.body;

    // Kiểm tra đầu vào
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ email hợp lệ' });
    }
    if (!validator.isLength(password, { min: 8 })) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' });
    }
    if (!validator.isLength(firstName, { min: 2 })) {
      return res.status(400).json({ message: 'Tên phải có ít nhất 2 ký tự' });
    }
    if (!validator.isLength(lastName, { min: 2 })) {
      return res.status(400).json({ message: 'Họ phải có ít nhất 2 ký tự' });
    }
    if (!validator.isISO8601(dateOfBirth)) {
      return res.status(400).json({ message: 'Ngày sinh không hợp lệ' });
    }
    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'Giới tính không hợp lệ' });
    }
    if (!validator.isMobilePhone(phone, 'vi-VN')) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Tạo người dùng mới
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      phone,
      address,
      role: req.body.role || 'student',
      isVerified: false,
    });
    await user.save();

    // Gửi email xác minh
    const verificationToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.VERIFICATION_TOKEN_EXPIRES || '15m' }
    );
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({ message: 'Đăng ký thành công, vui lòng kiểm tra email để xác minh' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email hoặc yêu cầu gửi lại email xác minh.',
        action: 'request-verification'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = user.generateJsonWebToken();
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt: refreshTokenExpires,
    });

    const cookieExpires = parseInt(process.env.COOKIE_EXPIRES, 10);
    const maxAge = isNaN(cookieExpires) ? 7 * 24 * 60 * 60 * 1000 : cookieExpires * 24 * 60 * 60 * 1000;

    const tokenCookieName = getTokenCookieName(user.role);

    res.cookie(tokenCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAge,
    });

    res.json({ 
      message: 'Đăng nhập thành công', 
      token, 
      refreshToken, 
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error.message);
    next(error);
  }
};

export const requestVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ email hợp lệ' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng với email này' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Tài khoản đã được xác thực' });
    }

    const verificationToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.VERIFICATION_TOKEN_EXPIRES || '15m' }
    );

    await sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({ message: 'Email xác minh đã được gửi' });
  } catch (error) {
    console.error('Lỗi yêu cầu xác minh:', error.message);
    next(error);
  }
};

export const verifyAccount = async (req, res, next) => {
  try {
    const { token, redirect } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    if (user.isVerified) {
      const redirectUrl = redirect
        ? `${decodeURIComponent(redirect)}?success=verified`
        : `${process.env.FRONTEND_URL}/login?success=verified`;
      return res.redirect(redirectUrl);
    }

    user.isVerified = true;
    await user.save();

    const newToken = user.generateJsonWebToken();
    
    const cookieExpires = parseInt(process.env.COOKIE_EXPIRES, 10);
    const maxAge = isNaN(cookieExpires) ? 7 * 24 * 60 * 60 * 1000 : cookieExpires * 24 * 60 * 60 * 1000;

    const tokenCookieName = getTokenCookieName(user.role);

    res.cookie(tokenCookieName, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAge,
    });

    const redirectUrl = redirect
      ? `${decodeURIComponent(redirect)}?success=verified`
      : `${process.env.FRONTEND_URL}/login?success=verified`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Lỗi xác minh:', error.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Xác minh thất bại, vui lòng thử lại')}`);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Không cung cấp refresh token' });
    }

    const tokenDoc = await RefreshToken.findOne({ token: refreshToken }).populate('user');
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
    }

    const user = tokenDoc.user;
    const newAccessToken = user.generateJsonWebToken();

    const cookieExpires = parseInt(process.env.COOKIE_EXPIRES, 10);
    const maxAge = isNaN(cookieExpires) ? 7 * 24 * 60 * 60 * 1000 : cookieExpires * 24 * 60 * 60 * 1000;

    const tokenCookieName = getTokenCookieName(user.role);

    res.cookie(tokenCookieName, newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAge,
    });

    res.json({ message: 'Làm mới token thành công', token: newAccessToken });
  } catch (error) {
    console.error('Lỗi làm mới token:', error.message);
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    await RefreshToken.deleteMany({ user: userId });

    const tokenCookieName = getTokenCookieName(userRole);

    res.cookie(tokenCookieName, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    console.error('Lỗi đăng xuất:', error.message);
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -__v');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Lỗi lấy hồ sơ:', error.message);
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (firstName && !validator.isLength(firstName, { min: 2 })) {
      return res.status(400).json({ message: 'Tên phải có ít nhất 2 ký tự' });
    }
    if (lastName && !validator.isLength(lastName, { min: 2 })) {
      return res.status(400).json({ message: 'Họ phải có ít nhất 2 ký tự' });
    }
    if (phone && !validator.isMobilePhone(phone, 'vi-VN')) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    if (req.files && req.files.avatar) {
      const avatar = req.files.avatar;
      if (!avatar.mimetype.startsWith('image')) {
        return res.status(400).json({ message: 'Avatar phải là file ảnh' });
      }
      if (avatar.size > 2 * 1024 * 1024) {
        return res.status(400).json({ message: 'Avatar không được lớn hơn 2MB' });
      }

      const result = await cloudinary.v2.uploader.upload(avatar.tempFilePath, {
        folder: 'ielts-toeic-platform/avatars',
        width: 150,
        height: 150,
        crop: 'fill',
      });
      user.avatar = result.secure_url;
    }

    user.updatedAt = new Date();
    await user.save();

    const updatedUser = await User.findById(user._id).select('-password -__v');
    res.status(200).json({ message: 'Cập nhật hồ sơ thành công', user: updatedUser });
  } catch (error) {
    console.error('Lỗi cập nhật hồ sơ:', error.message);
    next(error);
  }
};

// Thêm tài khoản (Admin)
export const createUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, dateOfBirth, gender, phone, address, role } = req.body;

    // Kiểm tra đầu vào
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ email hợp lệ' });
    }
    if (!validator.isLength(password, { min: 8 })) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }
    if (!validator.isLength(firstName, { min: 2 })) {
      return res.status(400).json({ message: 'Tên phải có ít nhất 2 ký tự' });
    }
    if (!validator.isLength(lastName, { min: 2 })) {
      return res.status(400).json({ message: 'Họ phải có ít nhất 2 ký tự' });
    }
    if (!validator.isISO8601(dateOfBirth)) {
      return res.status(400).json({ message: 'Ngày sinh không hợp lệ' });
    }
    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'Giới tính không hợp lệ' });
    }
    if (!validator.isMobilePhone(phone, 'vi-VN')) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Tạo người dùng mới
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      phone,
      address,
      role,
      isVerified: true, // Tài khoản do admin tạo không cần xác minh
    });
    await user.save();

    res.status(201).json({ message: 'Tạo tài khoản thành công', user: {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    } });
  } catch (error) {
    console.error('Lỗi tạo tài khoản:', error.message);
    next(error);
  }
};

// Lấy tất cả tài khoản (Admin)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password -__v');
    res.status(200).json({ users });
  } catch (error) {
    console.error('Lỗi lấy danh sách người dùng:', error.message);
    next(error);
  }
};

// Lấy chi tiết tài khoản theo ID (Admin)
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -__v');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Lỗi lấy chi tiết người dùng:', error.message);
    next(error);
  }
};

// Cập nhật tài khoản (Admin)
export const updateUser = async (req, res, next) => {
  try {
    const { email, firstName, lastName, phone, address, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Kiểm tra đầu vào
    if (email && !validator.isEmail(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
      user.email = email;
    }
    if (firstName && !validator.isLength(firstName, { min: 2 })) {
      return res.status(400).json({ message: 'Tên phải có ít nhất 2 ký tự' });
    }
    if (lastName && !validator.isLength(lastName, { min: 2 })) {
      return res.status(400).json({ message: 'Họ phải có ít nhất 2 ký tự' });
    }
    if (phone && !validator.isMobilePhone(phone, 'vi-VN')) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }
    if (role && !['student', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    }

    // Cập nhật các trường
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (role) user.role = role;

    user.updatedAt = new Date();
    await user.save();

    const updatedUser = await User.findById(user._id).select('-password -__v');
    res.status(200).json({ message: 'Cập nhật tài khoản thành công', user: updatedUser });
  } catch (error) {
    console.error('Lỗi cập nhật tài khoản:', error.message);
    next(error);
  }
};

// Xóa tài khoản (Admin)
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Không cho phép xóa tài khoản admin hiện tại
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'Không thể xóa tài khoản của chính bạn' });
    }

    await User.deleteOne({ _id: req.params.id });
    await RefreshToken.deleteMany({ user: req.params.id });

    res.status(200).json({ message: 'Xóa tài khoản thành công' });
  } catch (error) {
    console.error('Lỗi xóa tài khoản:', error.message);
    next(error);
  }
};