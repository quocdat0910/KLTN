import mongoose from "mongoose";

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Người dùng là bắt buộc"],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Khóa học là bắt buộc"],
    },
    chapterProgress: [
      {
        chapterId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Chapter",
          required: [true, "Chương là bắt buộc"],
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
        lessonProgress: [
          {
            lessonId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Lesson",
              required: [true, "Bài học là bắt buộc"],
            },
            watchTime: {
              type: Number,
              default: 0, // Thời gian đã xem (giây)
              min: [0, "Thời gian xem không được nhỏ hơn 0"],
            },
            isCompleted: {
              type: Boolean,
              default: false,
            },
            lastWatchedAt: {
              type: Date,
              default: null,
            },
            resourcesAccessed: [
              {
                resourceId: String, // ID tài liệu trong Lesson.resources
                accessedAt: { type: Date, default: Date.now },
              },
            ],
          },
        ],
        exerciseResults: [
          {
            exerciseId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Exercise",
              required: [true, "Bài tập là bắt buộc"],
            },
            bestScore: {
              type: Number,
              default: 0,
              min: [0, "Điểm không được nhỏ hơn 0"],
            },
            totalQuestions: {
              type: Number,
              required: [true, "Số câu hỏi là bắt buộc"],
            },
            correctAnswers: {
              type: Number,
              default: 0,
              min: [0, "Số câu trả lời đúng không được nhỏ hơn 0"],
            },
            isPassed: {
              type: Boolean,
              default: false,
            },
            attempts: [
              {
                attemptNumber: { type: Number, required: true },
                answers: [
                  {
                    questionIndex: Number,
                    userAnswer: String,
                    isCorrect: Boolean,
                  },
                ],
                score: { type: Number, default: 0 },
                submittedAt: { type: Date, default: Date.now },
                timeSpent: { type: Number, default: 0 },
              },
            ],
            lastAttemptAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
    completionPercentage: {
      type: Number,
      default: 0,
      min: [0, "Phần trăm hoàn thành không được nhỏ hơn 0"],
      max: [100, "Phần trăm hoàn thành không được lớn hơn 100"],
    },
    totalWatchTime: {
      type: Number,
      default: 0, // Tổng thời gian xem video (giây)
      min: [0, "Tổng thời gian xem không được nhỏ hơn 0"],
    },
    isCourseCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    aiInsights: {
      learningPattern: { 
        type: String, 
        enum: ['consistent', 'sporadic', 'intensive', 'gradual'],
        default: null 
      },
      recommendedNextSteps: { type: [String], default: [] },
      difficultyAdjustment: { 
        type: String, 
        enum: ['increase', 'decrease', 'maintain'],
        default: 'maintain'
      },
      optimalStudyTime: { 
        type: String, 
        enum: ['morning', 'afternoon', 'evening'],
        default: null 
      },
      focusAreas: { type: [String], default: [] },
      lastAnalyzedAt: { type: Date, default: null }
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

// Tính completionPercentage và isCourseCompleted trước khi lưu
userProgressSchema.pre("save", async function (next) {
  const course = await mongoose
    .model("Course")
    .findById(this.courseId)
    .populate({
      path: "chapters",
      populate: [{ path: "lessons" }, { path: "exercises" }],
    });

  let totalItems = 0;
  let completedItems = 0;

  this.chapterProgress.forEach((cp) => {
    const chapter = course.chapters.find(
      (ch) => ch._id.toString() === cp.chapterId.toString()
    );

    // Đếm bài học
    chapter.lessons.forEach((lesson) => {
      totalItems++;
      const lp = cp.lessonProgress.find(
        (lp) => lp.lessonId.toString() === lesson._id.toString()
      );
      if (lp && lp.isCompleted) completedItems++;
    });

    // Đếm bài tập
    chapter.exercises.forEach((exercise) => {
      totalItems++;
      const er = cp.exerciseResults.find(
        (er) => er.exerciseId.toString() === exercise._id.toString()
      );
      if (er && er.isPassed) completedItems++;
    });

    // Cập nhật trạng thái hoàn thành chương
    cp.isCompleted =
      chapter.lessons.every((l) =>
        cp.lessonProgress.some(
          (lp) => lp.lessonId.toString() === l._id.toString() && lp.isCompleted
        )
      ) &&
      chapter.exercises.every((e) =>
        cp.exerciseResults.some(
          (er) => er.exerciseId.toString() === e._id.toString() && er.isPassed
        )
      );
  });

  // Tính phần trăm hoàn thành
  this.completionPercentage =
    totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  // Cập nhật tổng thời gian xem
  this.totalWatchTime = this.chapterProgress.reduce(
    (sum, cp) => sum + cp.lessonProgress.reduce((s, lp) => s + lp.watchTime, 0),
    0
  );

  // Cập nhật trạng thái hoàn thành khóa học
  this.isCourseCompleted = this.chapterProgress.every((cp) => cp.isCompleted);
  if (this.isCourseCompleted && !this.completedAt) {
    this.completedAt = new Date();
  }

  next();
});

userProgressSchema.index({ userId: 1, courseId: 1 });
userProgressSchema.index({ isCourseCompleted: 1 });

export default mongoose.model("UserProgress", userProgressSchema);
