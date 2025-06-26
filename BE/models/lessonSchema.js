import mongoose from 'mongoose';
import validator from 'validator';

const lessonSchema = new mongoose.Schema(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: [true, 'Chương là bắt buộc']
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề bài học là bắt buộc'],
      trim: true,
      minlength: [3, 'Tiêu đề phải có ít nhất 3 ký tự'],
      maxlength: [100, 'Tiêu đề không được vượt quá 100 ký tự']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
    },
    videoUrl: {
      type: String,
      required: [true, 'URL video là bắt buộc'],
      validate: {
        validator: (value) => validator.isURL(value),
        message: 'URL video không hợp lệ'
      }
    },
    videoDuration: {
      type: Number,
      required: [true, 'Thời lượng video là bắt buộc'],
      min: [0, 'Thời lượng video không được nhỏ hơn 0']
    },
    order: {
      type: Number,
      required: [true, 'Thứ tự bài học là bắt buộc'],
      min: [1, 'Thứ tự phải lớn hơn hoặc bằng 1']
    },
    transcript: {
      type: String,
      trim: true,
      default: null
    },
    resources: [
      {
        name: {
          type: String,
          required: [true, 'Tên tài liệu là bắt buộc'],
          trim: true,
          maxlength: [100, 'Tên tài liệu không được vượt quá 100 ký tự']
        },
        url: {
          type: String,
          required: [true, 'URL tài liệu là bắt buộc'],
          validate: {
            validator: (value) => validator.isURL(value),
            message: 'URL tài liệu không hợp lệ'
          }
        },
        type: {
          type: String,
          enum: ['pdf', 'doc', 'link', 'image'],
          required: [true, 'Loại tài liệu là bắt buộc']
        }
      }
    ],
    isPublished: {
      type: Boolean,
      default: false // Mặc định chưa xuất bản
    },
    notes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note'
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

// Cập nhật duration của Chapter khi Lesson được thêm/cập nhật
lessonSchema.post('save', async function () {
  const chapter = await mongoose.model('Chapter').findById(this.chapterId);
  const lessons = await mongoose.model('Lesson').find({ _id: { $in: chapter.lessons } });
  chapter.duration = lessons.reduce((sum, lesson) => sum + (lesson.videoDuration || 0) / 60, 0);
  await chapter.save();
});

lessonSchema.index({ chapterId: 1, order: 1 });
lessonSchema.index({ isPublished: 1 });

export default mongoose.model('Lesson', lessonSchema);