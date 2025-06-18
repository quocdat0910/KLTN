import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Người dùng là bắt buộc'],
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Khóa học là bắt buộc'],
  },
  pricePaid: {
    type: Number,
    required: [true, 'Giá thanh toán là bắt buộc'],
    min: 0,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Purchase', purchaseSchema);