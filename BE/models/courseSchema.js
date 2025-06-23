import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề khóa học là bắt buộc'],
    trim: true,
    minlength: 5,
    maxlength: 100,
  },
  description: {
    type: String,
    required: [true, 'Mô tả khóa học là bắt buộc'],
    trim: true,
    minlength: 20,
  },
  price: {
    type: Number,
    required: [true, 'Giá khóa học là bắt buộc'],
    min: 0, // 0 cho khóa học miễn phí
  },
  discountPrice: {
    type: Number,
    min: 0,
    validate: {
      validator: function (value) {
        return value <= this.price;
      },
      message: 'Giá giảm không được lớn hơn giá gốc',
    },
  },
  discountEndDate: {
    type: Date,
  },
  thumbnail: {
    type: String, // URL từ Cloudinary
    required: [true, 'Hình ảnh chủ đề là bắt buộc'],
  },
  type: {
    type: String,
    enum: ['TOEIC', 'IELTS'],
    required: [true, 'Loại khóa học là bắt buộc'],
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
  language: {
    type: String,
    enum: ['English', 'Vietnamese'],
    default: 'English',
  },
  duration: {
    type: Number, // Tổng thời lượng (phút)
    min: 0,
    default: 0,
  },
  status: {
    type: String,
    enum: ['public', 'draft'],
    default: 'public',
  },
  enrolledCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

export default mongoose.model('Course', courseSchema);