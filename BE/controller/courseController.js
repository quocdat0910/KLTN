import Course from "../models/courseSchema.js";
import Chapter from "../models/chapterSchema.js";
import Enrollment from "../models/enrollmentSchema.js";
import UserProgress from "../models/userProgressSchema.js";
import User from "../models/userSchema.js";
import validator from "validator";
import cloudinary from "cloudinary";
import mongoose from "mongoose";

// @route GET /api/v1/courses
// @desc Get all courses (filtered by courseType, targetScoreRange, skills, search)
// @access Public
export const getAllCourses = async (req, res, next) => {
  try {
    const {
      courseType,
      targetScoreRange,
      skills,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // Xây dựng bộ lọc
    const query = { status: "published" };
    if (courseType) query.courseType = courseType;
    if (targetScoreRange) query.targetScoreRange = targetScoreRange;
    if (skills) query.skills = { $in: skills.split(",") };
    
    // Thêm search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
    }

    // Truy vấn khóa học với phân trang
    const courses = await Course.find(query)
      .select(
        "title shortDescription courseType targetScoreRange skills price thumbnail enrollmentCount averageRating"
      )
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(query);

    res.status(200).json({
      courses,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách khóa học:", error.message);
    next(error);
  }
};

export const getAllCoursesForAdmin = async (req, res, next) => {
  try {
    const {
      courseType,
      targetScoreRange,
      skills,
      page = 1,
      limit = 10,
    } = req.query;

    // Bỏ điều kiện status => Admin được thấy hết
    const query = {};
    if (courseType) query.courseType = courseType;
    if (targetScoreRange) query.targetScoreRange = targetScoreRange;
    if (skills) query.skills = { $in: skills.split(",") };

    const courses = await Course.find(query)
      .select(
        "title shortDescription courseType targetScoreRange skills price thumbnail enrollmentCount status averageRating"
      )
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Course.countDocuments(query);

    res.status(200).json({
      courses,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Lỗi admin lấy tất cả khóa học:", error.message);
    next(error);
  }
};

// @route GET /api/v1/courses/:id
// @desc Get course details, include chapters (lessons/exercises only if enrolled)
// @access Public
export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID khóa học không hợp lệ" });
    }

    const course = await Course.findById(id).populate({
      path: "chapters",
      match: { isPublished: true },
      select: "title description",
    });

    if (!course || course.status !== "published") {
      return res.status(404).json({
        message: "Không tìm thấy khóa học hoặc khóa học chưa được xuất bản",
      });
    }

    const isEnrolled = userId
      ? await Enrollment.exists({ userId, courseId: id, status: "active" })
      : false;
    const isAdmin = req.user?.role === "admin";

    if (isEnrolled || isAdmin) {
      await course.populate({
        path: "chapters",
        populate: [
          {
            path: "lessons",
            match: { isPublished: true },
            select: "title _id",
          },
          {
            path: "exercises",
            match: { isPublished: true },
            select: "title _id",
          },
        ],
      });
    }

    const response = {
      _id: course._id.toString(),
      title: course.title,
      shortDescription: course.shortDescription,
      price: course.price || 0,
      chapters: course.chapters.map((chapter) => ({
        _id: chapter._id,
        title: chapter.title,
        description: chapter.description,
        lessons: chapter.lessons
          ? chapter.lessons.map((lesson) => ({
              _id: lesson._id,
              title: lesson.title,
            }))
          : [],
        exercises: chapter.exercises
          ? chapter.exercises.map((exercise) => ({
              _id: exercise._id,
              title: exercise.title,
            }))
          : [],
      })),
    };

    res.status(200).json({ course: response });
  } catch (error) {
    console.error("Lỗi lấy chi tiết khóa học:", error.message);
    next(error);
  }
};

// @route POST /api/v1/courses
// @desc Create a new course with thumbnail upload
// @access Admin
export const createCourse = async (req, res, next) => {
  try {
    const {
      title,
      description,
      shortDescription,
      price,
      originalPrice,
      discountPercentage,
      discountExpiresAt,
      courseType,
      targetScoreRange,
      skills,
      language,
      requirements,
      objectives,
      tags,
      instructor,
      status,
    } = req.body;

    // Kiểm tra đầu vào
    if (!title || !validator.isLength(title, { min: 5, max: 100 })) {
      return res
        .status(400)
        .json({ message: "Tiêu đề phải có từ 5 đến 100 ký tự" });
    }
    if (!description || !validator.isLength(description, { min: 20 })) {
      return res
        .status(400)
        .json({ message: "Mô tả phải có ít nhất 20 ký tự" });
    }
    if (
      !shortDescription ||
      !validator.isLength(shortDescription, { max: 200 })
    ) {
      return res
        .status(400)
        .json({ message: "Mô tả ngắn không được vượt quá 200 ký tự" });
    }
    if (price === undefined || price < 0) {
      return res.status(400).json({ message: "Giá không được nhỏ hơn 0" });
    }
    if (originalPrice && originalPrice < 0) {
      return res.status(400).json({ message: "Giá gốc không được nhỏ hơn 0" });
    }
    if (
      discountPercentage &&
      (discountPercentage < 0 || discountPercentage > 100)
    ) {
      return res
        .status(400)
        .json({ message: "Phần trăm giảm giá phải từ 0 đến 100" });
    }
    if (!["TOEIC", "IELTS"].includes(courseType)) {
      return res.status(400).json({ message: "Loại khóa học không hợp lệ" });
    }
    const validScoreRanges =
      courseType === "IELTS"
        ? ["4.0-5.0", "5.0-6.0", "5.5-6.5", "6.0-7.0", "7.0-8.0", "8.0+"]
        : ["250-350", "350-450", "450-550", "550-650", "650-850", "850+"];
    if (!validScoreRanges.includes(targetScoreRange)) {
      return res
        .status(400)
        .json({ message: "Dải điểm mục tiêu không hợp lệ" });
    }
    if (
      skills &&
      !skills
        .split(",")
        .every((skill) =>
          ["Listening", "Speaking", "Reading", "Writing", "General"].includes(
            skill.trim()
          )
        )
    ) {
      return res.status(400).json({ message: "Kỹ năng không hợp lệ" });
    }
    if (language && !["English", "Vietnamese"].includes(language)) {
      return res.status(400).json({ message: "Ngôn ngữ không hợp lệ" });
    }
    if (!objectives || objectives.length === 0) {
      return res.status(400).json({ message: "Mục tiêu khóa học là bắt buộc" });
    }

    // Xử lý file thumbnail với express-fileupload
    let thumbnailUrl = null;
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
          height: 225,
          crop: "fill",
        }
      );
      thumbnailUrl = result.secure_url;
    }

    // Tạo khóa học mới
    const course = new Course({
      title,
      description,
      shortDescription,
      price,
      originalPrice: originalPrice || null,
      discountPercentage: discountPercentage || 0,
      discountExpiresAt: discountExpiresAt ? new Date(discountExpiresAt) : null,
      thumbnail: thumbnailUrl,
      courseType,
      targetScoreRange,
      skills: skills
        ? skills.split(",").map((skill) => skill.trim())
        : ["General"],
      language: language || "English",
      requirements: requirements
        ? requirements.split(",").map((req) => req.trim())
        : [],
      objectives: objectives.split(",").map((obj) => obj.trim()),
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      instructor: instructor || req.user._id,
      status: status || "draft",
      chapters: [],
      enrollmentCount: 0,
      ratings: [],
      averageRating: 0,
    });

    await course.save();

    res.status(201).json({
      message: "Tạo khóa học thành công",
      course: {
        _id: course._id,
        title: course.title,
        courseType: course.courseType,
        targetScoreRange: course.targetScoreRange,
        status: course.status,
        thumbnail: course.thumbnail,
      },
    });
  } catch (error) {
    console.error("Lỗi tạo khóa học:", error.message);
    next(error);
  }
};

// @route PUT /api/v1/courses/:id
// @desc Update a course with thumbnail upload
// @access Admin
export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      shortDescription,
      price,
      originalPrice,
      discountPercentage,
      discountExpiresAt,
      courseType,
      targetScoreRange,
      skills,
      language,
      requirements,
      objectives,
      tags,
      instructor,
      status,
    } = req.body;

    // Tìm khóa học
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Kiểm tra đầu vào
    if (title && !validator.isLength(title, { min: 5, max: 100 })) {
      return res
        .status(400)
        .json({ message: "Tiêu đề phải có từ 5 đến 100 ký tự" });
    }
    if (description && !validator.isLength(description, { min: 20 })) {
      return res
        .status(400)
        .json({ message: "Mô tả phải có ít nhất 20 ký tự" });
    }
    if (
      shortDescription &&
      !validator.isLength(shortDescription, { max: 200 })
    ) {
      return res
        .status(400)
        .json({ message: "Mô tả ngắn không được vượt quá 200 ký tự" });
    }
    if (price !== undefined && price < 0) {
      return res.status(400).json({ message: "Giá không được nhỏ hơn 0" });
    }
    if (originalPrice && originalPrice < 0) {
      return res.status(400).json({ message: "Giá gốc không được nhỏ hơn 0" });
    }
    if (
      discountPercentage &&
      (discountPercentage < 0 || discountPercentage > 100)
    ) {
      return res
        .status(400)
        .json({ message: "Phần trăm giảm giá phải từ 0 đến 100" });
    }
    if (courseType && !["TOEIC", "IELTS"].includes(courseType)) {
      return res.status(400).json({ message: "Loại khóa học không hợp lệ" });
    }
    if (targetScoreRange) {
      const validScoreRanges =
        courseType || course.courseType === "IELTS"
          ? ["4.0-5.0", "5.0-6.0", "5.5-6.5", "6.0-7.0", "7.0-8.0", "8.0+"]
          : ["250-350", "350-450", "450-550", "550-650", "650-850", "850+"];
      if (!validScoreRanges.includes(targetScoreRange)) {
        return res
          .status(400)
          .json({ message: "Dải điểm mục tiêu không hợp lệ" });
      }
    }
    if (
      skills &&
      !skills
        .split(",")
        .every((skill) =>
          ["Listening", "Speaking", "Reading", "Writing", "General"].includes(
            skill.trim()
          )
        )
    ) {
      return res.status(400).json({ message: "Kỹ năng không hợp lệ" });
    }
    if (language && !["English", "Vietnamese"].includes(language)) {
      return res.status(400).json({ message: "Ngôn ngữ không hợp lệ" });
    }

    // Xử lý file thumbnail với express-fileupload
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

      // Xóa thumbnail cũ trên Cloudinary nếu tồn tại
      if (course.thumbnail) {
        const publicId = course.thumbnail.split("/").slice(-1)[0].split(".")[0]; // Trích xuất public_id từ URL
        const folderPath = "ielts-toeic-platform/thumbnails";
        await cloudinary.v2.uploader.destroy(`${folderPath}/${publicId}`);
      }

      // Tải thumbnail mới lên Cloudinary
      const result = await cloudinary.v2.uploader.upload(
        thumbnail.tempFilePath,
        {
          folder: "ielts-toeic-platform/thumbnails",
          width: 400,
          height: 225,
          crop: "fill",
        }
      );
      course.thumbnail = result.secure_url;
    }

    // Cập nhật các trường
    if (title) course.title = title;
    if (description) course.description = description;
    if (shortDescription) course.shortDescription = shortDescription;
    if (price !== undefined) course.price = price;
    if (originalPrice !== undefined) course.originalPrice = originalPrice;
    if (discountPercentage !== undefined)
      course.discountPercentage = discountPercentage;
    if (discountExpiresAt)
      course.discountExpiresAt = new Date(discountExpiresAt);
    if (courseType) course.courseType = courseType;
    if (targetScoreRange) course.targetScoreRange = targetScoreRange;
    if (skills) course.skills = skills.split(",").map((skill) => skill.trim());
    if (language) course.language = language;
    if (requirements)
      course.requirements = requirements.split(",").map((req) => req.trim());
    if (objectives)
      course.objectives = objectives.split(",").map((obj) => obj.trim());
    if (tags) course.tags = tags.split(",").map((tag) => tag.trim());
    if (instructor) course.instructor = instructor;
    if (status) course.status = status;

    course.updatedAt = new Date();
    await course.save();

    res.status(200).json({
      message: "Cập nhật khóa học thành công",
      course: {
        _id: course._id,
        title: course.title,
        courseType: course.courseType,
        targetScoreRange: course.targetScoreRange,
        status: course.status,
        thumbnail: course.thumbnail,
      },
    });
  } catch (error) {
    console.error("Lỗi cập nhật khóa học:", error.message);
    next(error);
  }
};

// @route DELETE /api/v1/courses/:id
// @desc Delete a course
// @access Admin
export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Tìm khóa học
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Kiểm tra nếu khóa học có người đăng ký
    const enrollmentCount = await Enrollment.countDocuments({ courseId: id });
    if (enrollmentCount > 0) {
      return res
        .status(400)
        .json({ message: "Không thể xóa khóa học đã có người đăng ký" });
    }

    // Xóa các chương liên quan
    await Chapter.deleteMany({ _id: { $in: course.chapters } });

    // Xóa tiến độ liên quan
    await UserProgress.deleteMany({ courseId: id });

    // Xóa khóa học
    await Course.deleteOne({ _id: id });

    res.status(200).json({ message: "Xóa khóa học thành công" });
  } catch (error) {
    console.error("Lỗi xóa khóa học:", error.message);
    next(error);
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

    // Tìm khóa học
    const course = await Course.findById(id);
    if (!course || course.status !== "published") {
      return res
        .status(404)
        .json({
          message: "Không tìm thấy khóa học hoặc khóa học chưa được xuất bản",
        });
    }

    // Kiểm tra nếu đã đăng ký
    const existingEnrollment = await Enrollment.findOne({
      userId,
      courseId: id,
    });
    if (existingEnrollment) {
      return res.status(400).json({ message: "Bạn đã đăng ký khóa học này" });
    }

    // Tạo bản ghi đăng ký
    const enrollment = new Enrollment({
      userId,
      courseId: id,
      paymentDetails: {
        paymentId: paymentData?.id || null,
        amount: paymentData?.amount || course.price,
        currency: paymentData?.currency || "VND",
        paymentMethod: paymentData?.method || "paypal",
        paidAt: paymentData ? new Date() : null,
      },
      expiresAt: null,
    });

    await enrollment.save();

    // Cập nhật User.enrolledCourses
    const user = await User.findById(userId);
    user.enrolledCourses.push({ course: id, enrolledAt: new Date() });
    await user.save();

    // Cập nhật Course.enrollmentCount
    course.enrollmentCount = await Enrollment.countDocuments({
      courseId: id,
      status: "active",
    });
    await course.save();

    // Khởi tạo UserProgress
    const newProgress = new UserProgress({
      userId,
      courseId: id,
      chapterProgress: [],
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
        enrolledAt: enrollment.enrolledAt,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng ký khóa học:", error.message);
    next(error);
  }
};

// @route GET /api/v1/courses/progress/:id
// @desc Get course progress for the logged-in user
// @access Protected
export const getCourseProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Kiểm tra quyền truy cập
    const enrollment = await Enrollment.findOne({
      userId,
      courseId: id,
      status: "active",
    });
    if (!enrollment) {
      return res.status(403).json({ message: "Bạn chưa đăng ký khóa học này" });
    }

    // Tìm tiến độ
    const progress = await UserProgress.findOne({ userId, courseId: id })
      .populate({
        path: "chapterProgress.chapterId",
        select: "title order",
      })
      .populate({
        path: "chapterProgress.lessonProgress.lessonId",
        select: "title",
      })
      .populate({
        path: "chapterProgress.exerciseResults.exerciseId",
        select: "title",
      });

    if (!progress) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tiến độ học tập" });
    }

    res.status(200).json({
      progress: {
        courseId: progress.courseId,
        completionPercentage: progress.completionPercentage,
        totalWatchTime: progress.totalWatchTime,
        isCourseCompleted: progress.isCourseCompleted,
        chapterProgress: progress.chapterProgress,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy tiến độ khóa học:", error.message);
    next(error);
  }
};

// @route PUT /api/v1/courses/:id/publish
// @desc Publish or unpublish a course
// @access Admin
export const publishCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["published", "draft"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Kiểm tra nếu xuất bản: phải có ít nhất một chương
    if (status === "published" && course.chapters.length === 0) {
      return res
        .status(400)
        .json({ message: "Khóa học phải có ít nhất một chương để xuất bản" });
    }

    course.status = status;
    course.updatedAt = new Date();
    await course.save();

    res.status(200).json({
      message: `Khóa học đã được ${
        status === "published" ? "xuất bản" : "hủy xuất bản"
      }`,
      course: {
        _id: course._id,
        title: course.title,
        status: course.status,
      },
    });
  } catch (error) {
    console.error("Lỗi xuất bản/hủy xuất bản khóa học:", error.message);
    next(error);
  }
};

// @route GET /api/v1/courses/:id/enrollments
// @desc Get list of users enrolled in a course
// @access Admin
export const getCourseEnrollments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Kiểm tra khóa học
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Truy vấn danh sách đăng ký
    const enrollments = await Enrollment.find({
      courseId: id,
      status: "active",
    })
      .populate("userId", "firstName lastName email")
      .select("userId enrolledAt paymentDetails")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Enrollment.countDocuments({
      courseId: id,
      status: "active",
    });

    res.status(200).json({
      enrollments,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách đăng ký:", error.message);
    next(error);
  }
};

// @route GET /api/v1/courses/:id/statistics
// @desc Get course statistics (enrollment count, average progress)
// @access Admin
export const getCourseStatistics = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kiểm tra khóa học
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Đếm số lượng đăng ký
    const enrollmentCount = await Enrollment.countDocuments({
      courseId: id,
      status: "active",
    });

    // Tính tiến độ trung bình
    const progressStats = await UserProgress.aggregate([
      { $match: { courseId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          averageCompletion: { $avg: "$completionPercentage" },
          completedCount: {
            $sum: { $cond: [{ $eq: ["$isCourseCompleted", true] }, 1, 0] },
          },
        },
      },
    ]);

    const stats = {
      enrollmentCount,
      averageCompletion: progressStats[0]?.averageCompletion || 0,
      completedCount: progressStats[0]?.completedCount || 0,
    };

    res.status(200).json({
      statistics: stats,
    });
  } catch (error) {
    console.error("Lỗi lấy thống kê khóa học:", error.message);
    next(error);
  }
};
