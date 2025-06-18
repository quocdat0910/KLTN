import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Câu hỏi là bắt buộc'],
    trim: true,
    minlength: 5,
  },
  options: [
    {
      text: {
        type: String,
        required: [true, 'Đáp án là bắt buộc'],
        trim: true,
      },
      isCorrect: {
        type: Boolean,
        required: [true, 'Đáp án đúng là bắt buộc'],
      },
    },
  ],
});

const quizSchema = new mongoose.Schema({
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: [true, 'Chương là bắt buộc'],
  },
  title: {
    type: String,
    required: [true, 'Tiêu đề bài tập là bắt buộc'],
    trim: true,
    minlength: 3,
    maxlength: 100,
  },
  questions: [questionSchema],
  order: {
    type: Number,
    required: [true, 'Thứ tự bài tập là bắt buộc'],
    min: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Quiz', quizSchema);