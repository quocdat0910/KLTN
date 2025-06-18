import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: [true, 'Chương là bắt buộc'],
  },
  title: {
    type: String,
    required: [true, 'Tiêu đề video là bắt buộc'],
    trim: true,
    minlength: 3,
    maxlength: 100,
  },
  youtubeUrl: {
    type: String,
    required: [true, 'Link YouTube là bắt buộc'],
    match: [
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
      'Link YouTube không hợp lệ',
    ],
  },
  duration: {
    type: Number, // Thời lượng video (phút)
    required: [true, 'Thời lượng video là bắt buộc'],
    min: 1,
  },
  order: {
    type: Number,
    required: [true, 'Thứ tự video là bắt buộc'],
    min: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Video', videoSchema);