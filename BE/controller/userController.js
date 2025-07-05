import User from "../models/userSchema.js";
import validator from "validator";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/emailService.js";
import RefreshToken from "../models/RefreshToken.js";
import crypto from "crypto";
import cloudinary from "cloudinary";
import mongoose from "mongoose";

// Hàm hỗ trợ để tạo tên cookie dựa trên vai trò
const getTokenCookieName = (role) => {
  if (!role) return "token";
  return `${role.charAt(0).toUpperCase() + role.slice(1)}Token`;
};

// @route POST /api/v1/users/register
// @desc Register a new user
// @access Public
export const register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      address,
    } = req.body;

    // Kiểm tra đầu vào
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp địa chỉ email hợp lệ" });
    }
    if (!validator.isLength(password, { min: 8 })) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải có ít nhất 8 ký tự" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });
    }
    if (!validator.isLength(firstName, { min: 2 })) {
      return res.status(400).json({ message: "Tên phải có ít nhất 2 ký tự" });
    }
    if (!validator.isLength(lastName, { min: 2 })) {
      return res.status(400).json({ message: "Họ phải có ít nhất 2 ký tự" });
    }
    if (!validator.isISO8601(dateOfBirth)) {
      return res.status(400).json({ message: "Ngày sinh không hợp lệ" });
    }
    if (!["male", "female"].includes(gender)) {
      return res.status(400).json({ message: "Giới tính không hợp lệ" });
    }
    if (!validator.isMobilePhone(phone, "vi-VN")) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
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
      role: req.body.role || "student",
      isVerified: false,
    });
    await user.save();

    // Gửi email xác minh
    const verificationToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.VERIFICATION_TOKEN_EXPIRES || "15m" }
    );
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      message: "Đăng ký thành công, vui lòng kiểm tra email để xác minh",
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/v1/users/login
// @desc Log in a user
// @access Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message:
          "Tài khoản chưa được xác thực. Vui lòng kiểm tra email hoặc yêu cầu gửi lại email xác minh.",
        action: "request-verification",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = user.generateJsonWebToken();
    const refreshToken = crypto.randomBytes(32).toString("hex");
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.deleteMany({ user: user._id });

    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt: refreshTokenExpires,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    const cookieExpires = parseInt(process.env.COOKIE_EXPIRES, 10);
    const maxAge = isNaN(cookieExpires)
      ? 7 * 24 * 60 * 60 * 1000
      : cookieExpires * 24 * 60 * 60 * 1000;

    const tokenCookieName = getTokenCookieName(user.role);

    res.cookie(tokenCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: maxAge,
    });

    res.json({
      message: "Đăng nhập thành công",
      token,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error.message);
    next(error);
  }
};

// @route POST /api/v1/users/request-verification
// @desc Request a verification email
// @access Public
export const requestVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp địa chỉ email hợp lệ" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy người dùng với email này" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Tài khoản đã được xác thực" });
    }

    const verificationToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.VERIFICATION_TOKEN_EXPIRES || "15m" }
    );

    await sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({ message: "Email xác minh đã được gửi" });
  } catch (error) {
    console.error("Lỗi yêu cầu xác minh:", error.message);
    next(error);
  }
};

// @route GET /api/v1/users/verify
// @desc Verify a user account
// @access Public
export const verifyAccount = async (req, res, next) => {
  try {
    const { token, redirect } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
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
    const maxAge = isNaN(cookieExpires)
      ? 7 * 24 * 60 * 60 * 1000
      : cookieExpires * 24 * 60 * 60 * 1000;

    const tokenCookieName = getTokenCookieName(user.role);

    res.cookie(tokenCookieName, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: maxAge,
    });

    const redirectUrl = redirect
      ? `${decodeURIComponent(redirect)}?success=verified`
      : `${process.env.FRONTEND_URL}/login?success=verified`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Lỗi xác minh:", error.message);
    res.redirect(
      `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(
        "Xác minh thất bại, vui lòng thử lại"
      )}`
    );
  }
};

// @route POST /api/v1/users/refresh-token
// @desc Refresh access token
// @access Public
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokenDoc = await RefreshToken.findOne({
      token: refreshToken,
    }).populate("user");
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      return res
        .status(401)
        .json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }

    const user = tokenDoc.user;
    const newAccessToken = user.generateJsonWebToken();
    const newRefreshToken = crypto.randomBytes(32).toString("hex");
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      token: newRefreshToken,
      user: user._id,
      expiresAt: refreshTokenExpires,
    });
    await RefreshToken.deleteOne({ _id: tokenDoc._id });

    const tokenCookieName = getTokenCookieName(user.role);
    res.cookie(tokenCookieName, newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Làm mới token thành công",
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Lỗi làm mới token:", error.message);
    next(error);
  }
};

// @route POST /api/v1/users/logout
// @desc Log out a user
// @access Protected
export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      const userId = req.user.id;
      const userRole = req.user.role;
      await RefreshToken.deleteMany({ user: userId });
      const tokenCookieName = getTokenCookieName(userRole);
      res.cookie(tokenCookieName, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
      });
    }
    // Dù có user hay không, vẫn trả về thành công
    res.json({ message: "Đăng xuất thành công" });
  } catch (error) {
    console.error("Lỗi đăng xuất:", error.message);
    next(error);
  }
};

// @route GET /api/v1/users/profile
// @desc Get user profile
// @access Protected
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password -__v");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng." });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    next(error);
  }
};

// @route PUT /api/v1/users/profile
// @desc Update user profile
// @access Protected
export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (firstName && !validator.isLength(firstName, { min: 2 })) {
      return res.status(400).json({ message: "Tên phải có ít nhất 2 ký tự" });
    }
    if (lastName && !validator.isLength(lastName, { min: 2 })) {
      return res.status(400).json({ message: "Họ phải có ít nhất 2 ký tự" });
    }
    if (phone && !validator.isMobilePhone(phone, "vi-VN")) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    if (req.files && req.files.avatar) {
      const avatar = req.files.avatar;
      if (!avatar.mimetype.startsWith("image")) {
        return res.status(400).json({ message: "Avatar phải là file ảnh" });
      }
      if (avatar.size > 2 * 1024 * 1024) {
        return res
          .status(400)
          .json({ message: "Avatar không được lớn hơn 2MB" });
      }

      const result = await cloudinary.v2.uploader.upload(avatar.tempFilePath, {
        folder: "ielts-toeic-platform/avatars",
        width: 150,
        height: 150,
        crop: "fill",
      });
      user.avatar = result.secure_url;
    }

    user.updatedAt = new Date();
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password -__v");
    res
      .status(200)
      .json({ message: "Cập nhật hồ sơ thành công", user: updatedUser });
  } catch (error) {
    console.error("Lỗi cập nhật hồ sơ:", error.message);
    next(error);
  }
};

// @route POST /api/v1/users/forgot-password
// @desc Request a password reset link
// @access Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp địa chỉ email hợp lệ" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy người dùng với email này" });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.VERIFICATION_TOKEN_EXPIRES || "15m",
    });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendVerificationEmail(
      user.email,
      resetToken,
      "Đặt lại mật khẩu",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Đặt lại mật khẩu</h2>
        <p style="color: #555;">Vui lòng nhấp vào nút dưới đây để đặt lại mật khẩu của bạn:</p>
        <a 
          href="${resetUrl}"
          style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            text-align: center;
          "
        >
        Đặt lại mật khẩu
        </a>
        <p style="color: #555;">Liên kết này sẽ hết hạn sau 15 phút.</p>
        <p style="color: #555;">Nếu nút không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:</p>
        <p style="word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
      </div>
      `
    );
    await sendVerificationEmail(
      user.email,
      resetToken,
      "Đặt lại mật khẩu",
      `Vui lòng nhấp vào liên kết sau để đặt lại mật khẩu: ${resetUrl}`
    );

    res.status(200).json({ message: "Email đặt lại mật khẩu đã được gửi" });
  } catch (error) {
    console.error("Lỗi yêu cầu đặt lại mật khẩu:", error.message);
    next(error);
  }
};

// @route POST /api/v1/users/reset-password
// @desc Reset user password
// @access Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        message:
          "Vui lòng cung cấp đầy đủ token, mật khẩu và xác nhận mật khẩu",
      });
    }

    if (!validator.isLength(password, { min: 8 })) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải có ít nhất 8 ký tự" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    user.password = password;
    user.updatedAt = new Date();
    await user.save();

    // Vô hiệu hóa tất cả refresh token cũ
    await RefreshToken.deleteMany({ user: user._id });

    res
      .status(200)
      .json({ message: "Đặt lại mật khẩu thành công, vui lòng đăng nhập lại" });
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error.message);
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token đã hết hạn, vui lòng yêu cầu lại" });
    }
    next(error);
  }
};

// @route PUT /api/v1/users/change-password
// @desc Change user password
// @access Protected
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        message:
          "Vui lòng cung cấp đầy đủ mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu mới",
      });
    }

    if (!validator.isLength(newPassword, { min: 8 })) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới phải có ít nhất 8 ký tự" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (!(await user.matchPassword(oldPassword))) {
      return res.status(401).json({ message: "Mật khẩu cũ không đúng" });
    }

    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();

    // Vô hiệu hóa tất cả refresh token cũ
    await RefreshToken.deleteMany({ user: user._id });

    // Xóa cookie token
    const tokenCookieName = getTokenCookieName(user.role);
    res.cookie(tokenCookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    });

    res
      .status(200)
      .json({ message: "Đổi mật khẩu thành công, vui lòng đăng nhập lại" });
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error.message);
    next(error);
  }
};

// @route POST /api/v1/users
// @desc Create a new user
// @access Admin
export const createUser = async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      address,
      role,
    } = req.body;

    // Kiểm tra đầu vào
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp địa chỉ email hợp lệ" });
    }
    if (!validator.isLength(password, { min: 8 })) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải có ít nhất 8 ký tự" });
    }
    if (!validator.isLength(firstName, { min: 2 })) {
      return res.status(400).json({ message: "Tên phải có ít nhất 2 ký tự" });
    }
    if (!validator.isLength(lastName, { min: 2 })) {
      return res.status(400).json({ message: "Họ phải có ít nhất 2 ký tự" });
    }
    if (!validator.isISO8601(dateOfBirth)) {
      return res.status(400).json({ message: "Ngày sinh không hợp lệ" });
    }
    if (!["male", "female"].includes(gender)) {
      return res.status(400).json({ message: "Giới tính không hợp lệ" });
    }
    if (!validator.isMobilePhone(phone, "vi-VN")) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    }
    if (!["student", "admin"].includes(role)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ" });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
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
      isVerified: true,
    });
    await user.save();

    res.status(201).json({
      message: "Tạo tài khoản thành công",
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi tạo tài khoản:", error.message);
    next(error);
  }
};

// @route GET /api/v1/users
// @desc Get all users
// @access Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password -__v");
    res.status(200).json({ users });
  } catch (error) {
    console.error("Lỗi lấy danh sách người dùng:", error.message);
    next(error);
  }
};

// @route GET /api/v1/users/:id
// @desc Get a user by ID
// @access Admin
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password -__v");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi lấy chi tiết người dùng:", error.message);
    next(error);
  }
};

// @route PUT /api/v1/users/:id
// @desc Update a user
// @access Admin
export const updateUser = async (req, res, next) => {
  try {
    const { email, firstName, lastName, phone, address, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(400).json({ message: "Não tìm thấy người dùng" });
    }

    // Kiểm tra đầu vào
    if (email && !validator.isEmail(email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }
      user.email = email;
    }
    if (firstName && !validator.isLength(firstName, { min: 2 })) {
      return res.status(400).json({ message: "Tên phải có ít nhất 2 ký tự" });
    }
    if (lastName && !validator.isLength(lastName, { min: 2 })) {
      return res.status(400).json({ message: "Họ phải có ít nhất 2 ký tự" });
    }
    if (phone && !validator.isMobilePhone(phone, "vi-VN")) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    }
    if (role && !["student", "admin"].includes(role)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ" });
    }

    // Cập nhật các trường
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (role) user.role = role;

    user.updatedAt = new Date();
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password -__v");
    res
      .status(200)
      .json({ message: "Cập nhật tài khoản thành công", user: updatedUser });
  } catch (error) {
    console.error("Lỗi cập nhật tài khoản:", error.message);
    next(error);
  }
};

// @route DELETE /api/v1/users/:id
// @desc Delete a user
// @access Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Không cho phép xóa tài khoản admin hiện tại
    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Não thể xóa tài khoản của chính bạn" });
    }

    await User.deleteOne({ _id: req.params.id });
    await RefreshToken.deleteMany({ user: req.params.id });

    res.status(200).json({ message: "Xóa tài khoản thành công" });
  } catch (error) {
    console.error("Lỗi xóa tài khoản:", error.message);
    next(error);
  }
};

// @route PUT /api/v1/users/:id/change-password
// @desc Change user password by admin
// @access Admin
export const changeUserPasswordByAdmin = async (req, res, next) => {
  try {
    const { newPassword, confirmNewPassword } = req.body;
    const userId = req.params.id;

    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({
        message: "Vui lòng cung cấp mật khẩu mới và xác nhận mật khẩu mới",
      });
    }

    if (!validator.isLength(newPassword, { min: 8 })) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới phải có ít nhất 8 ký tự" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Không cho phép Admin đổi mật khẩu của chính mình qua endpoint này
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        message:
          "Vui lòng sử dụng endpoint đổi mật khẩu cá nhân để đổi mật khẩu của bạn",
      });
    }

    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();

    // Vô hiệu hóa tất cả refresh token của người dùng
    await RefreshToken.deleteMany({ user: user._id });

    res.status(200).json({ message: "Đổi mật khẩu cho người dùng thành công" });
  } catch (error) {
    console.error("Lỗi đổi mật khẩu bởi admin:", error.message);
    next(error);
  }
};
