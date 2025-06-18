import Course from "../models/courseSchema.js";
import Purchase from "../models/purchaseSchema.js";
import Chapter from "../models/chapterSchema.js";
import Video from "../models/videoSchema.js";
import Quiz from "../models/quizSchema.js";
import cloudinary from "cloudinary";
import validator from "validator";
import mongoose from "mongoose";
import paypalClient from "../config/paypal.js";
import paypal from "@paypal/checkout-server-sdk";

export const createCourse = async (req, res, next) => {
  try {
    const { title, description, price, type, level, language } = req.body;

    if (!title || !description || price === undefined || !type) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp đầy đủ thông tin" });
    }
    if (!validator.isLength(title, { min: 5, max: 100 })) {
      return res.status(400).json({ message: "Tiêu đề phải từ 5-100 ký tự" });
    }
    if (!["TOEIC", "IELTS"].includes(type)) {
      return res.status(400).json({ message: "Loại khóa học không hợp lệ" });
    }

    if (!req.files || !req.files.thumbnail) {
      return res.status(400).json({ message: "Hình ảnh chủ đề là bắt buộc" });
    }
    const thumbnail = req.files.thumbnail;
    if (!thumbnail.mimetype.startsWith("image")) {
      return res.status(400).json({ message: "Thumbnail phải là file ảnh" });
    }
    if (thumbnail.size > 2 * 1024 * 1024) {
      return res
        .status(400)
        .json({ message: "Thumbnail không được lớn hơn 2MB" });
    }
    const result = await cloudinary.v2.uploader.upload(thumbnail.tempFilePath, {
      folder: "ielts-toeic-platform/thumbnails",
      width: 400,
      height: 200,
      crop: "fill",
    });

    const course = await Course.create({
      title,
      description,
      price,
      thumbnail: result.secure_url,
      type,
      level: level || "Beginner",
      language: language || "English",
      status: "draft",
    });

    res.status(201).json({ message: "Tạo khóa học thành công", course });
  } catch (error) {
    console.error("Lỗi tạo khóa học:", error.message);
    next(error);
  }
};

export const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ status: "public" }).select(
      "title description price thumbnail type level enrolledCount"
    );
    res.status(200).json({ courses });
  } catch (error) {
    console.error("Lỗi lấy danh sách khóa học:", error.message);
    next(error);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId).select("-__v");
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }
    if (course.status === "draft" && (!req.user || req.user.role !== "admin")) {
      return res
        .status(403)
        .json({ message: "Không có quyền truy cập khóa học này" });
    }
    res.status(200).json({ course });
  } catch (error) {
    console.error("Lỗi lấy chi tiết khóa học:", error.message);
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const {
      title,
      description,
      price,
      discountPrice,
      discountEndDate,
      type,
      level,
      language,
      status,
    } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    if (title && !validator.isLength(title, { min: 5, max: 100 })) {
      return res.status(400).json({ message: "Tiêu đề phải từ 5-100 ký tự" });
    }
    if (type && !["TOEIC", "IELTS"].includes(type)) {
      return res.status(400).json({ message: "Loại khóa học không hợp lệ" });
    }
    if (status && !["public", "draft"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }
    if (discountPrice && discountPrice > (price || course.price)) {
      return res
        .status(400)
        .json({ message: "Giá giảm không được lớn hơn giá gốc" });
    }

    let thumbnailUrl = course.thumbnail;
    if (req.files && req.files.thumbnail) {
      const thumbnail = req.files.thumbnail;
      if (!thumbnail.mimetype.startsWith("image")) {
        return res.status(400).json({ message: "Thumbnail phải là file ảnh" });
      }
      if (thumbnail.size > 2 * 1024 * 1024) {
        return res
          .status(400)
          .json({ message: "Thumbnail không được lớn hơn 2MB" });
      }
      const result = await cloudinary.v2.uploader.upload(
        thumbnail.tempFilePath,
        {
          folder: "ielts-toeic-platform/thumbnails",
          width: 400,
          height: 200,
          crop: "fill",
        }
      );
      thumbnailUrl = result.secure_url;
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        title: title || course.title,
        description: description || course.description,
        price: price !== undefined ? price : course.price,
        discountPrice:
          discountPrice !== undefined ? discountPrice : course.discountPrice,
        discountEndDate: discountEndDate || course.discountEndDate,
        thumbnail: thumbnailUrl,
        type: type || course.type,
        level: level || course.level,
        language: language || course.language,
        status: status || course.status,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    res
      .status(200)
      .json({ message: "Cập nhật khóa học thành công", course: updatedCourse });
  } catch (error) {
    console.error("Lỗi cập nhật khóa học:", error.message);
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    const chapters = await Chapter.find({ course: courseId });
    const chapterIds = chapters.map((chapter) => chapter._id);
    await Video.deleteMany({ chapter: { $in: chapterIds } });
    await Quiz.deleteMany({ chapter: { $in: chapterIds } });
    await Chapter.deleteMany({ course: courseId });
    await Purchase.deleteMany({ course: courseId });
    await Course.findByIdAndDelete(courseId);

    res.status(200).json({ message: "Xóa khóa học thành công" });
  } catch (error) {
    console.error("Lỗi xóa khóa học:", error.message);
    next(error);
  }
};

export const getAllCoursesAdmin = async (req, res, next) => {
  try {
    const courses = await Course.find().select("-__v");
    res.status(200).json({ courses });
  } catch (error) {
    console.error("Lỗi lấy danh sách khóa học cho admin:", error.message);
    next(error);
  }
};

export const createPaypalOrder = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }
    if (course.status !== "public") {
      return res.status(400).json({ message: "Khóa học chưa được công khai" });
    }

    const existingPurchase = await Purchase.findOne({
      user: userId,
      course: courseId,
    });
    if (existingPurchase) {
      return res.status(400).json({ message: "Bạn đã sở hữu khóa học này" });
    }

    if (course.price === 0) {
      return res
        .status(400)
        .json({
          message: "Khóa học miễn phí, không cần thanh toán qua PayPal",
        });
    }

    const price =
      course.discountPrice &&
      course.discountPrice < course.price &&
      (!course.discountEndDate || course.discountEndDate > new Date())
        ? course.discountPrice
        : course.price;

    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD", // Chuyển đổi VND sang USD nếu cần
            value: (price / 23000).toFixed(2), // Giả định tỷ giá 1 USD = 23,000 VND
          },
          description: `Mua khóa học: ${course.title}`,
        },
      ],
      application_context: {
        return_url: "http://localhost:4000/api/v1/courses/success", // URL sau khi thanh toán thành công
        cancel_url: "http://localhost:4000/api/v1/courses/cancel", // URL nếu hủy thanh toán
      },
    });

    const order = await paypalClient.execute(request);
    res.status(200).json({ orderId: order.result.id });
  } catch (error) {
    console.error("Lỗi tạo PayPal order:", error.message);
    next(error);
  }
};

export const capturePaypalOrder = async (req, res, next) => {
  try {
    const { orderId, courseId } = req.body;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    const capture = await paypalClient.execute(request);

    if (capture.result.status !== "COMPLETED") {
      return res.status(400).json({ message: "Thanh toán không thành công" });
    }

    const pricePaid =
      course.discountPrice &&
      course.discountPrice < course.price &&
      (!course.discountPrice || course.discountEndDate > new Date())
        ? course.discountPrice
        : course.price;

    await Purchase.create({
      user: userId,
      course: courseId,
      pricePaid,
    });

    await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });

    res
      .status(200)
      .json({ message: "Thanh toán thành công, bạn đã sở hữu khóa học" });
  } catch (error) {
    console.error("Lỗi capture PayPal order:", error.message);
    next(error);
  }
};

export const purchaseCourse = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }
    if (course.status !== "public") {
      return res.status(400).json({ message: "Khóa học chưa được công khai" });
    }

    const existingPurchase = await Purchase.findOne({
      user: userId,
      course: courseId,
    });
    if (existingPurchase) {
      return res.status(400).json({ message: "Bạn đã sở hữu khóa học này" });
    }

    if (course.price === 0) {
      await Purchase.create({
        user: userId,
        course: courseId,
        pricePaid: 0,
      });
      await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });
      return res
        .status(200)
        .json({ message: "Mua khóa học miễn phí thành công" });
    }

    return res
      .status(200)
      .json({ message: "Vui lòng sử dụng PayPal để thanh toán" });
  } catch (error) {
    console.error("Lỗi mua khóa học:", error.message);
    next(error);
  }
};

export const getPurchasedCourses = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const purchases = await Purchase.find({ user: userId }).populate({
      path: 'course',
      select: 'title description price thumbnail type level enrolledCount',
    });
    const courses = purchases.map(purchase => purchase.course);
    res.status(200).json({ courses });
  } catch (error) {
    console.error('Lỗi lấy danh sách khóa học đã mua:', error.message);
    next(error);
  }
};

export const checkCourseOwnership = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user._id;
    const purchase = await Purchase.findOne({ user: userId, course: courseId });
    res.status(200).json({ owned: !!purchase });
  } catch (error) {
    console.error('Lỗi kiểm tra quyền sở hữu:', error.message);
    next(error);
  }
};

export const getPurchaseDetails = async (req, res, next) => {
  try {
    const purchaseId = req.params.purchaseId;
    const userId = req.user._id;

    const purchase = await Purchase.findById(purchaseId).populate({
      path: 'course',
      select: 'title description type',
    });
    if (!purchase) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }
    if (purchase.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền xem giao dịch này' });
    }

    res.status(200).json({ purchase });
  } catch (error) {
    console.error('Lỗi lấy chi tiết giao dịch:', error.message);
    next(error);
  }
};

export const getAllPurchasesAdmin = async (req, res, next) => {
  try {
    const purchases = await Purchase.find().populate({
      path: 'user',
      select: 'name email',
    }).populate({
      path: 'course',
      select: 'title type',
    });
    res.status(200).json({ purchases });
  } catch (error) {
    console.error('Lỗi lấy danh sách giao dịch:', error.message);
    next(error);
  }
};
