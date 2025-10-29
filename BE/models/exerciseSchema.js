import mongoose from 'mongoose';
import validator from 'validator';

const exerciseSchema = new mongoose.Schema(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: [true, 'Chương là bắt buộc']
    },

    googleSheetUrl: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề bài tập là bắt buộc'],
      trim: true,
      minlength: [3, 'Tiêu đề phải ít nhất 3 ký tự'],
      maxlength: [100, 'Tiêu đề không được vượt quá 100 ký tự']
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false'],
      required: [true, 'Loại bài tập là bắt buộc']
    },
    order: {
      type: Number,
      required: [true, 'Thứ tự bài tập là bắt buộc'],
      min: [1, 'Thứ tự phải lớn hơn hoặc bằng 1']
    },
    passingScore: {
      type: Number,
      required: [true, 'Điểm tối thiểu là bắt buộc'],
      min: [0, 'Điểm tối thiểu không được nhỏ hơn 0'],
      max: [100, 'Điểm tối thiểu không được lớn hơn 100']
    },
    timeLimit: {
      type: Number,
      default: null, // Thời gian giới hạn (giây), null = không giới hạn
      min: [0, 'Thời gian giới hạn không được nhỏ hơn 0']
    },
    isPublished: {
      type: Boolean,
      default: false // Mặc định chưa xuất bản
    },
    questions: [
      {
        questionText: {
          type: String,
          required: [true, 'Câu hỏi là bắt buộc'],
          trim: true
        },
        questionAudio: {
          type: String,
          validate: {
            validator: (value) => !value || validator.isURL(value),
            message: 'URL âm thanh không hợp lệ'
          }
        },
        questionImage: {
          type: String,
          validate: {
            validator: (value) => !value || validator.isURL(value),
            message: 'URL hình ảnh không hợp lệ'
          }
        },
        options: {
          type: [String],
          default: [],
          validate: {
            validator: function (value) {
              return this.type !== 'multiple-choice' || value.length >= 2;
            },
            message: 'Câu hỏi trắc nghiệm phải có ít nhất 2 đáp án'
          }
        },
        correctAnswer: {
          type: mongoose.Schema.Types.Mixed, // Số (trắc nghiệm), chuỗi (fill-in-the-blank), hoặc boolean (true-false)
          required: [true, 'Đáp án đúng là bắt buộc']
        },
        points: {
          type: Number,
          required: [true, 'Điểm câu hỏi là bắt buộc'],
          min: [0, 'Điểm không được nhỏ hơn 0']
        },
        explanation: {
          type: String,
          trim: true,
          default: null // Lời giải chi tiết
        }
      }
    ],
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

// Validate questions dựa trên type
exerciseSchema.pre('save', function (next) {
  this.questions.forEach((q) => {
    if (this.type === 'multiple-choice') {
      if (!Number.isInteger(Number(q.correctAnswer)) || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        throw new Error('Đáp án đúng không hợp lệ cho câu hỏi trắc nghiệm');
      }
    } else if (this.type === 'true-false') {
      if (q.correctAnswer !== 'true' && q.correctAnswer !== 'false') {
        throw new Error('Đáp án đúng phải là true hoặc false');
      }
    } else if (this.type === 'fill-in-the-blank') {
      if (typeof q.correctAnswer !== 'string') {
        throw new Error('Đáp án đúng phải là chuỗi cho câu hỏi điền từ');
      }
    }
  });
  next();
});

exerciseSchema.index({ chapterId: 1, order: 1 });
exerciseSchema.index({ isPublished: 1 });

export default mongoose.model('Exercise', exerciseSchema);