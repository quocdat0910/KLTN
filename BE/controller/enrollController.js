import Enrollment from "../models/enrollmentSchema.js";
import Course from "../models/courseSchema.js";
import User from "../models/userSchema.js";
import UserProgress from "../models/userProgressSchema.js";
import Chapter from "../models/chapterSchema.js";
import mongoose from "mongoose";
import axios from "axios";

const PAYPAL_API = process.env.PAYPAL_API || "https://api-m.sandbox.paypal.com";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const getPaypalAccessToken = async () => {
  try {
    const response = await axios.post(
      `${PAYPAL_API}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        auth: {
          username: PAYPAL_CLIENT_ID,
          password: PAYPAL_CLIENT_SECRET
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    throw new Error("Lỗi lấy PayPal access token: " + error.message);
  }
};

// @route POST /api/v1/courses/enroll/:id
// @desc Enroll in a course
// @access Protected
export const enrollCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { paymentData } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID khóa học không hợp lệ" });
    }

    const course = await Course.findById(id);
    if (!course || course.status !== "published") {
      return res.status(404).json({ message: "Không tìm thấy khóa học hoặc khóa học chưa được xuất bản" });
    }

    const existingEnrollment = await Enrollment.findOne({ userId, courseId: id });
    if (existingEnrollment) {
      return res.status(400).json({ message: "Bạn đã đăng ký khóa học này" });
    }

    let finalPaymentDetails = {
      paymentId: null,
      amount: course.price,
      currency: "VND",
      paymentMethod: paymentData?.method || "paypal",
      paidAt: null
    };

    if (paymentData?.method === "free") {
      if (course.price !== 0) {
        return res.status(400).json({ message: "Khóa học này không miễn phí" });
      }
    } else if (paymentData?.id) {
      const accessToken = await getPaypalAccessToken();
      const paymentResponse = await axios.post(
        `${PAYPAL_API}/v2/checkout/orders/${paymentData.id}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      const paymentDetails = paymentResponse.data;
      if (paymentDetails.status !== "COMPLETED") {
        return res.status(400).json({ message: "Thanh toán PayPal chưa hoàn tất" });
      }
      finalPaymentDetails = {
        paymentId: paymentDetails.id,
        amount: paymentData.amount || course.price,
        currency: "VND",
        paymentMethod: "paypal",
        paidAt: new Date()
      };
    } else {
      return res.status(400).json({ message: "Yêu cầu paymentData.id cho thanh toán PayPal" });
    }

    const enrollment = new Enrollment({
      userId,
      courseId: id,
      paymentDetails: finalPaymentDetails,
      expiresAt: null
    });
    await enrollment.save();

    const user = await User.findById(userId);
    user.enrolledCourses.push({ course: id, enrolledAt: new Date() });
    await user.save();

    // Cập nhật enrollmentCount bằng cập nhật atomic để tránh xung đột phiên bản
    const activeCount = await Enrollment.countDocuments({ courseId: id, status: "active" });
    await Course.updateOne(
      { _id: id },
      { $set: { enrollmentCount: activeCount } }
    );

    const newProgress = new UserProgress({
      userId,
      courseId: id,
      chapterProgress: []
    });
    const chapters = await Chapter.find({ courseId: id });
    chapters.forEach((chapter) => {
      newProgress.chapterProgress.push({ chapterId: chapter._id });
    });
    await newProgress.save();

    res.status(201).json({
      message: "Đăng ký khóa học thành công",
      enrollment: {
        _id: enrollment._id,
        courseId: enrollment.courseId,
        enrolledAt: enrollment.enrolledAt
      }
    });
  } catch (error) {
    console.error("Lỗi đăng ký khóa học:", error.message);
    next(error);
  }
};

// @route GET /api/v1/enrollments
// @desc Get all enrollments of the current user
// @access Protected
export const getUserEnrollments = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const enrollments = await Enrollment.find({ userId })
      .populate("courseId", "title shortDescription thumbnail")
      .select("courseId status enrolledAt paymentDetails");

    res.status(200).json({
      message: "Lấy danh sách đăng ký thành công",
      enrollments
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách đăng ký:", error.message);
    next(error);
  }
};

// @route GET /api/v1/enrollments/:enrollmentId
// @desc Get enrollment details by ID
// @access Protected
export const getEnrollmentById = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return res.status(400).json({ message: "ID đăng ký không hợp lệ" });
    }

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate("courseId", "title shortDescription")
      .select("courseId status enrolledAt paymentDetails");

    if (!enrollment || enrollment.userId.toString() !== userId.toString()) {
      return res.status(404).json({ message: "Không tìm thấy đăng ký hoặc bạn không có quyền truy cập" });
    }

    res.status(200).json({
      message: "Lấy chi tiết đăng ký thành công",
      enrollment
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết đăng ký:", error.message);
    next(error);
  }
};

// @route GET /api/v1/enrollments/all
// @desc Get all enrollments (admin only)
// @access Admin
export const getAllEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find()
      .populate("userId", "name email")
      .populate("courseId", "title shortDescription")
      .select("userId courseId status enrolledAt paymentDetails");

    res.status(200).json({
      message: "Lấy tất cả đăng ký thành công",
      enrollments
    });
  } catch (error) {
    console.error("Lỗi lấy tất cả đăng ký:", error.message);
    next(error);
  }
};

// @route GET /api/v1/enrollments/user/:userId
// @desc Get all enrollments of a specific user (admin only)
// @access Admin
export const getEnrollmentsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }

    const enrollments = await Enrollment.find({ userId })
      .populate("courseId", "title shortDescription")
      .select("courseId status thumbnail enrolledAt paymentDetails");

    res.status(200).json({
      message: "Lấy danh sách đăng ký của người dùng thành công",
      enrollments
    });
  } catch (error) {
    console.error("Lỗi lấy đăng ký của người dùng:", error.message);
    next(error);
  }
};

// @route GET /api/v1/enrollments/course/:courseId
// @desc Get all enrollments for a specific course (admin only)
// @access Admin
export const getEnrollmentsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "ID khóa học không hợp lệ" });
    }

    const course = await Course.findById(courseId);
    if (!course || course.status !== "published") {
      return res.status(404).json({ message: "Không tìm thấy khóa học hoặc khóa học chưa được xuất bản" });
    }

    const enrollments = await Enrollment.find({ courseId })
      .populate("userId", "name email")
      .select("userId status enrolledAt paymentDetails");

    res.status(200).json({
      message: "Lấy danh sách đăng ký của khóa học thành công",
      enrollments
    });
  } catch (error) {
    console.error("Lỗi lấy đăng ký của khóa học:", error.message);
    next(error);
  }
};

// @route PUT /api/v1/enrollments/:enrollmentId
// @desc Update enrollment status or details (admin only)
// @access Admin
export const updateEnrollment = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const { status, paymentDetails } = req.body;

    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return res.status(400).json({ message: "ID đăng ký không hợp lệ" });
    }

    if (status && !["active", "expired", "completed"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái đăng ký không hợp lệ" });
    }

    if (paymentDetails) {
      if (paymentDetails.paymentId && typeof paymentDetails.paymentId !== "string") {
        return res.status(400).json({ message: "ID thanh toán không hợp lệ" });
      }
      if (paymentDetails.amount && (!Number.isFinite(paymentDetails.amount) || paymentDetails.amount < 0)) {
        return res.status(400).json({ message: "Số tiền phải là số không âm" });
      }
      if (paymentDetails.currency && typeof paymentDetails.currency !== "string") {
        return res.status(400).json({ message: "Đơn vị tiền tệ không hợp lệ" });
      }
      if (paymentDetails.paymentMethod && !["paypal", "free", "other"].includes(paymentDetails.paymentMethod)) {
        return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ" });
      }
    }

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: "Không tìm thấy đăng ký" });
    }

    // Cập nhật các trường
    if (status) enrollment.status = status;
    if (paymentDetails) {
      enrollment.paymentDetails = {
        ...enrollment.paymentDetails,
        ...paymentDetails,
        paidAt: paymentDetails.paymentId ? new Date() : enrollment.paymentDetails.paidAt
      };
    }
    enrollment.updatedAt = Date.now();
    await enrollment.save();

    res.status(200).json({
      message: "Cập nhật đăng ký thành công",
      enrollment: {
        courseId: enrollment.courseId,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        paymentDetails: enrollment.paymentDetails
      }
    });
  } catch (error) {
    console.error("Lỗi cập nhật đăng ký:", error.message);
    next(error);
  }
};