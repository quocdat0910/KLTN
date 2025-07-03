import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người dùng là bắt buộc']
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'Bài học là bắt buộc']
    },
    content: {
      type: String,
      required: [true, 'Nội dung ghi chú là bắt buộc'],
      trim: true,
      minlength: [1, 'Ghi chú phải có ít nhất 1 ký tự'],
      maxlength: [1000, 'Ghi chú không được vượt quá 1000 ký tự']
    },
    timestamp: {
      type: Number,
      required: [true, 'Thời gian ghi chú là bắt buộc'],
      min: [0, 'Thời gian không được nhỏ hơn 0']
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

// Cập nhật Lesson.notes khi tạo Note
noteSchema.post('save', async function () {
  const lesson = await mongoose.model('Lesson').findById(this.lessonId);
  if (!lesson.notes.includes(this._id)) {
    lesson.notes.push(this._id);
    await lesson.save();
  }
});

noteSchema.index({ userId: 1, lessonId: 1 });
noteSchema.index({ timestamp: 1 });

export default mongoose.model('Note', noteSchema);