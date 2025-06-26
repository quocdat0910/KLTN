import mongoose from 'mongoose';
import validator from 'validator';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề khóa học là bắt buộc'],
      trim: true,
      minlength: [5, 'Tiêu đề phải có ít nhất 5 ký tự'],
      maxlength: [100, 'Tiêu đề không được vượt quá 100 ký tự']
    },
    description: {
      type: String,
      required: [true, 'Mô tả khóa học là bắt buộc'],
      trim: true,
      minlength: [20, 'Mô tả phải có ít nhất 20 ký tự']
    },
    shortDescription: {
      type: String,
      required: [true, 'Mô tả ngắn là bắt buộc'],
      trim: true,
      maxlength: [200, 'Mô tả ngắn không được vượt quá 200 ký tự']
    },
    price: {
      type: Number,
      required: [true, 'Giá khóa học là bắt buộc'],
      min: [0, 'Giá không được nhỏ hơn 0']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Giá gốc không được nhỏ hơn 0'],
      default: null
    },
    discountPercentage: {
      type: Number,
      min: [0, 'Phần trăm giảm giá không được nhỏ hơn 0'],
      max: [100, 'Phần trăm giảm giá không được lớn hơn 100'],
      default: 0
    },
    discountExpiresAt: {
      type: Date,
      default: null
    },
    thumbnail: {
      type: String,
      validate: {
        validator: (value) => !value || validator.isURL(value),
        message: 'Thumbnail phải là URL hợp lệ'
      }
    },
    courseType: {
      type: String,
      enum: ['TOEIC', 'IELTS'],
      required: [true, 'Loại khóa học là bắt buộc']
    },
    targetScoreRange: {
      type: String,
      required: [true, 'Dải điểm mục tiêu là bắt buộc'],
      validate: {
        validator: function(value) {
          const ieltsRanges = ['4.0-5.0', '5.0-6.0', '5.5-6.5', '6.0-7.0', '7.0-8.0', '8.0+'];
          const toeicRanges = ['250-350', '350-450', '450-550', '550-650', '650-850', '850+'];
          if (this.courseType === 'IELTS') {
            return ieltsRanges.includes(value);
          } else if (this.courseType === 'TOEIC') {
            return toeicRanges.includes(value);
          }
          return false;
        },
        message: 'Dải điểm mục tiêu không hợp lệ cho loại khóa học'
      }
    },
    skills: {
      type: [String],
      enum: ['Listening', 'Speaking', 'Reading', 'Writing', 'General'],
      default: ['General'],
      required: [true, 'Kỹ năng khóa học là bắt buộc']
    },
    language: {
      type: String,
      default: 'English',
      enum: ['English', 'Vietnamese']
    },
    requirements: {
      type: [String],
      default: []
    },
    objectives: {
      type: [String],
      default: [],
      required: [true, 'Mục tiêu khóa học là bắt buộc']
    },
    tags: {
      type: [String],
      default: []
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    chapters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter'
    }],
    duration: {
      type: Number,
      default: 0,
      min: [0, 'Thời lượng không được nhỏ hơn 0']
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    enrollmentCount: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng học viên không được nhỏ hơn 0']
    },
    ratings: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      score: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true },
      createdAt: { type: Date, default: Date.now }
    }],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Tính averageRating trước khi lưu
courseSchema.pre('save', function(next) {
  if (this.ratings.length > 0) {
    const totalScore = this.ratings.reduce((sum, r) => sum + r.score, 0);
    this.averageRating = totalScore / this.ratings.length;
  } else {
    this.averageRating = 0;
  }
  next();
});

courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ courseType: 1, targetScoreRange: 1, status: 1 });

export default mongoose.model('Course', courseSchema);