import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Vui lòng cung cấp địa chỉ email hợp lệ"],
    },
    password: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
      minlength: [8, "Mật khẩu phải có ít nhất 8 ký tự"],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, "Tên là bắt buộc"],
      trim: true,
      minlength: [2, "Tên phải có ít nhất 2 ký tự"],
    },
    lastName: {
      type: String,
      required: [true, "Họ là bắt buộc"],
      trim: true,
      minlength: [2, "Họ phải có ít nhất 2 ký tự"],
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
      required: [true, "Vai trò là bắt buộc"],
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: (value) => validator.isMobilePhone(value, "vi-VN"),
        message: "Số điện thoại không hợp lệ!",
      },
    },
    avatar: {
      type: String,
      default: null,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Ngày sinh là bắt buộc"],
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Giới tính là bắt buộc"],
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // Thông tin học tập
    currentScore: {
      ielts: {
        type: Number,
        min: 0,
        max: 9,
        default: null,
      },
      toeic: {
        type: Number,
        min: 0,
        max: 990,
        default: null,
      },
    },  
    /* targetScore: {
      ielts: {
        type: Number,
        min: 0,
        max: 9,
        default: null,
      },
      toeic: {
        type: Number,
        min: 0,
        max: 990,
        default: null,
      },
    }, */
    studyGoals: {
      type: [String],
      enum: ["Listening", "Speaking", "Reading", "Writing", "General"],
      default: [],
    },
    enrolledCourses: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        enrolledAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ["active", "completed", "expired"],
          default: "active",
        },
      },
    ],
    /* totalStudyTime: {
      type: Number,
      default: 0, // Tổng thời gian học (phút)
    }, */
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastStudyDate: { type: Date, default: null },
    },
    notifications: {
      email: { type: Boolean, default: true },
      dailyReminder: { type: Boolean, default: true },
      weeklyProgress: { type: Boolean, default: true },
      courseUpdates: { type: Boolean, default: true },
    },
    aiAnalytics: {
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      learningStyle: { 
        type: String, 
        enum: ['visual', 'auditory', 'kinesthetic', 'mixed'],
        default: null 
      },
      optimalPace: { 
        type: String, 
        enum: ['slow', 'moderate', 'fast'],
        default: 'moderate'
      },
      lastAnalyzedAt: { type: Date, default: null },
    },
    learningPreferences: {
      preferredTimeOfDay: { 
        type: String, 
        enum: ['morning', 'afternoon', 'evening', 'night'],
        default: 'afternoon'
      },
      preferredDuration: { 
        type: Number, 
        default: 30, // phút
        min: 15,
        max: 120
      },
      preferredContentType: { 
        type: String, 
        enum: ['video', 'text', 'audio', 'interactive'],
        default: 'video'
      },
      preferredDifficulty: { 
        type: String, 
        enum: ['easy', 'moderate', 'challenging'],
        default: 'moderate'
      }
    },
    /* aiAnalytics: {
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      recommendedCourses: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
      ],
      lastAnalyzedAt: { type: Date, default: null },
    }, */
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update streak logic
userSchema.pre("save", async function (next) {
  if (this.isModified("lastLogin")) {
    const today = new Date();
    const lastStudy = this.streak.lastStudyDate;

    if (lastStudy) {
      const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        this.streak.current += 1;
        if (this.streak.current > this.streak.longest) {
          this.streak.longest = this.streak.current;
        }
      } else if (daysDiff > 1) {
        this.streak.current = 1;
      }
    } else {
      this.streak.current = 1;
      this.streak.longest = 1;
    }
    this.streak.lastStudyDate = today;
  }
  next();
});

// Instance methods
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateJsonWebToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, isVerified: this.isVerified },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
};

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ "enrolledCourses.course": 1 });

export default mongoose.model("User", userSchema);
