import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người dùng là bắt buộc']
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Khóa học là bắt buộc']
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
      required: [true, 'Thời gian đăng ký là bắt buộc']
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'completed'],
      default: 'active',
      required: [true, 'Trạng thái đăng ký là bắt buộc']
    },
    paymentDetails: {
      paymentId: {
        type: String, // ID giao dịch PayPal
        default: null
      },
      amount: {
        type: Number,
        min: [0, 'Số tiền không được nhỏ hơn 0'],
        default: null
      },
      currency: {
        type: String,
        default: null
      },
      paymentMethod: {
        type: String,
        enum: ['paypal', 'free', 'other'],
        default: 'paypal'
      },
      paidAt: {
        type: Date,
        default: null
      }
    },
    expiresAt: {
      type: Date,
      default: null // Thời gian hết hạn truy cập (null nếu không giới hạn)
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

// Cập nhật Course.enrollmentCount và tạo UserProgress khi đăng ký
enrollmentSchema.post('save', async function () {
  const course = await mongoose.model('Course').findById(this.courseId);
  course.enrollmentCount = await mongoose.model('Enrollment').countDocuments({
    courseId: this.courseId,
    status: 'active'
  });
  await course.save();

  // Khởi tạo UserProgress nếu chưa tồn tại
  const progress = await mongoose.model('UserProgress').findOne({
    userId: this.userId,
    courseId: this.courseId
  });
  if (!progress && this.status === 'active') {
    const newProgress = new mongoose.model('UserProgress')({
      userId: this.userId,
      courseId: this.courseId,
      chapterProgress: []
    });
    const chapters = await mongoose.model('Chapter').find({ courseId: this.courseId });
    chapters.forEach((chapter) => {
      newProgress.chapterProgress.push({ chapterId: chapter._id });
    });
    await newProgress.save();
  }
});

enrollmentSchema.index({ userId: 1, courseId: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ expiresAt: 1 });

export default mongoose.model('Enrollment', enrollmentSchema);