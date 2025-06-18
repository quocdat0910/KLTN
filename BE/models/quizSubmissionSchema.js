import mongoose from 'mongoose';

const quizSubmissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Người dùng là bắt buộc'],
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: [true, 'Bài tập là bắt buộc'],
  },
  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Câu hỏi là bắt buộc'],
      },
      selectedOption: {
        type: Number,
        required: [true, 'Đáp án được chọn là bắt buộc'],
        min: 0,
        max: 3,
      },
    },
  ],
  score: {
    type: Number,
    min: 0,
    required: [true, 'Điểm số là bắt buộc'],
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('QuizSubmission', quizSubmissionSchema);