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
  try {
    const CourseModel = mongoose.model('Course');
    const EnrollmentModel = mongoose.model('Enrollment');

    const course = await CourseModel.findById(this.courseId).select('_id');
    if (course) {
      const activeCount = await EnrollmentModel.countDocuments({
        courseId: this.courseId,
        status: 'active'
      });
      await CourseModel.updateOne(
        { _id: this.courseId },
        { $set: { enrollmentCount: activeCount } }
      );
    }

    // Khởi tạo UserProgress nếu chưa tồn tại
    const UserProgressModel = mongoose.model('UserProgress');
    const ChapterModel = mongoose.model('Chapter');

    const progress = await UserProgressModel.findOne({
      userId: this.userId,
      courseId: this.courseId
    });
    if (!progress && this.status === 'active') {
      const newProgress = new UserProgressModel({
        userId: this.userId,
        courseId: this.courseId,
        chapterProgress: []
      });
      const chapters = await ChapterModel.find({ courseId: this.courseId });
      chapters.forEach((chapter) => {
        newProgress.chapterProgress.push({ chapterId: chapter._id });
      });
      await newProgress.save();
    }
  } catch (err) {
    console.error('[enrollmentSchema.post(save)] error:', err.message);
  }
});

enrollmentSchema.index({ userId: 1, courseId: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ expiresAt: 1 });

export default mongoose.model('Enrollment', enrollmentSchema);