import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Khóa học là bắt buộc"],
    },
    title: {
      type: String,
      required: [true, "Tiêu đề chương là bắt buộc"],
      trim: true,
      minlength: [3, "Tiêu đề phải có ít nhất 3 ký tự"],
      maxlength: [100, "Tiêu đề không được vượt quá 100 ký tự"],
    },
    /* description: {
      type: String,
      trim: true,
      maxlength: [500, "Mô tả không được vượt quá 500 ký tự"],
    }, */
    order: {
      type: Number,
      required: [true, "Thứ tự chương là bắt buộc"],
      min: [1, "Thứ tự phải lớn hơn hoặc bằng 1"],
    },
    isLocked: {
      type: Boolean,
      default: true, // Mặc định khóa để học tuần tự
    },
    isPublished: {
      type: Boolean,
      default: false, // Mặc định chưa xuất bản
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
    exercises: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
      },
    ],
    duration: {
      type: Number,
      default: 0, // Tổng thời lượng của các bài học (phút)
      min: [0, "Thời lượng không được nhỏ hơn 0"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Tính duration trước khi lưu
chapterSchema.pre("save", async function (next) {
  if (this.isModified("lessons")) {
    const lessons = await mongoose
      .model("Lesson")
      .find({ _id: { $in: this.lessons } });
    this.duration = lessons.reduce(
      (sum, lesson) => sum + (lesson.videoDuration || 0) / 60,
      0
    );
  }
  next();
});

chapterSchema.index({ courseId: 1, order: 1 });
chapterSchema.index({ isPublished: 1 });

export default mongoose.model("Chapter", chapterSchema);
