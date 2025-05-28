import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Vui lòng cung cấp địa chỉ email hợp lệ'],
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [8, 'Mật khẩu phải có ít nhất 8 ký tự'],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'Tên là bắt buộc'],
      trim: true,
      minlength: [2, 'Tên phải có ít nhất 2 ký tự'],
    },
    lastName: {
      type: String,
      required: [true, 'Họ là bắt buộc'],
      trim: true,
      minlength: [2, 'Họ phải có ít nhất 2 ký tự'],
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
      required: [true, 'Vai trò là bắt buộc'],
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          if (value.length !== 10) {
            return false;
          }
          const prefix = value.substring(0, 3);
          return validPrefixes.includes(prefix);
        },
        message: 'Số điện thoại không hợp lệ!',
      },
    },
    avatar: {
      type: String,
      default: null,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Ngày sinh là bắt buộc'],
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [true, 'Giới tính là bắt buộc'],
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
    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
        progress: {
          type: Number,
          default: 0,
        },
      },
    ],
    examResults: [
      {
        exam: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Exam',
        },
        score: {
          type: Number,
          required: [true, 'Điểm số là bắt buộc'],
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        feedback: {
          type: String,
          default: null,
        },
      },
    ],
    learningPath: {
      type: [
        {
          course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
          },
          recommendedAt: {
            type: Date,
            default: Date.now,
          },
          priority: {
            type: Number,
            default: 1,
          },
        },
      ],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const validPrefixes = [
  '032', '033', '034', '035', '036', '037', '038', '039',
  '096', '097', '098', '086',
  '083', '084', '085', '081', '082', '088',
  '091', '094',
  '070', '079', '077', '076', '078',
  '090', '093',
  '089',
  '056', '058',
  '092',
  '059',
  '099',
];

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateJsonWebToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, isVerified: this.isVerified },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: process.env.JWT_EXPIRES || '7d',
    }
  );
};

export default mongoose.model('User', userSchema);