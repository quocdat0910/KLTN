import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Khóa học là bắt buộc'],
  },
  title: {
    type: String,
    required: [true, 'Tiêu đề chương là bắt buộc'],
    trim: true,
    minlength: 3,
    maxlength: 50,
  },
  order: {
    type: Number,
    required: [true, 'Thứ tự chương là bắt buộc'],
    min: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Chapter', chapterSchema);