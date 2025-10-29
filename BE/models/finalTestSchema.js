import mongoose from 'mongoose';

// Schema cho ngân hàng câu hỏi Final Test
const finalTestQuestionBankSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Nội dung câu hỏi là bắt buộc'],
    trim: true
  },
  questionType: {
    type: String,
    enum: ['reading', 'listening', 'writing', 'speaking'],
    required: [true, 'Loại câu hỏi là bắt buộc']
  },
  questionSubType: {
    type: String,
    enum: [
      'multiple-choice',
      'true-false-notgiven',
      'yes-no-notgiven',
      'fill-in-blank',
      'short-answer',
      'writing',
      'essay',
      'summary',
      'speaking-task'
    ],
    required: true,
  },
  testType: {
    type: String,
    enum: ['IELTS', 'TOEIC'],
    required: [true, 'Loại bài test là bắt buộc']
  },
  difficulty: {
    type: mongoose.Schema.Types.Mixed, // Hỗ trợ cả string (legacy) và number (new)
    required: [true, 'Độ khó là bắt buộc'],
    validate: {
      validator: function(value) {
        // Legacy support
        if (typeof value === 'string') {
          return ['beginner', 'intermediate', 'advanced'].includes(value);
        }
        // New score-based system
        if (typeof value === 'number') {
          const testType = this.testType;
          if (testType === 'IELTS') {
            return [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].includes(value);
          } else if (testType === 'TOEIC') {
            return [250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 990].includes(value);
          }
        }
        return false;
      },
      message: 'Difficulty must be a valid score for the test type'
    }
  },
  passageText: { 
    type: String, 
    trim: true 
  },
  questionAudio: { 
    type: String, 
    default: null 
  },
  questionImage: { 
    type: String, 
    default: null 
  },
  options: { 
    type: [String], 
    default: [] 
  },
  correctAnswer: {
    type: String,
    required: function () {
      const writingSubTypes = ["writing", "essay", "short-answer", "summary"];
      return !writingSubTypes.includes(this.questionSubType);
    },
  },
  explanation: { 
    type: String, 
    trim: true,
    default: ''
  },
  writingTaskType: {
    type: String,
    enum: ["task1", "task2"],
    required: function () {
      return this.questionSubType === "writing";
    },
  },
  sampleAnswer: { 
    type: String, 
    trim: true 
  },
  // Cho speaking
  speakingPrompt: {
    type: String,
    default: ''
  },
  expectedResponse: {
    type: String,
    default: ''
  },
  // Metadata
  source: {
    type: String,
    enum: ['manual', 'ai_generated'],
    default: 'manual',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Schema cho bài Final Test
const finalTestSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Khóa học là bắt buộc']
  },
  title: {
    type: String,
    required: [true, 'Tiêu đề bài test là bắt buộc'],
    trim: true
  },
  testLabel: {
    type: String,
    required: true, 
  },
  description: {
    type: String,
    default: ''
  },
  testType: {
    type: String,
    enum: ['IELTS', 'TOEIC'],
    required: [true, 'Loại bài test là bắt buộc']
  },
  skillsCovered: {
    type: [String],
    enum: ["reading", "listening", "writing", "speaking"],
    required: true,
  },
  difficultyRange: {
    type: Object,
    default: {
      easy: ["4.0", "4.5", "5.0"],
      medium: ["5.5", "6.0", "6.5"],
      hard: ["7.0", "7.5", "8.0"],
    },
  },
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinalTestQuestionBank',
      required: true
    },
    questionType: {
      type: String,
      enum: ['reading', 'listening', 'writing', 'speaking'],
      required: true
    },
    questionSubType: {
      type: String,
      enum: [
        'multiple-choice',
        'true-false-notgiven',
        'yes-no-notgiven',
        'fill-in-blank',
        'short-answer',
        'writing',
        'speaking-task', 
        'essay', 
        'summary'
      ],
    },
    weight: {
      type: Number,
      default: 1,
      min: 0.1,
      max: 5
    }
  }],
  totalQuestions: {
    type: Number,
    required: true,
    min: 5,
    max: 100
  },
  timeLimit: {
    type: Number, // phút
    required: true,
    default: 120
  },
  passingScore: {
    type: Number,
    default: 70, // 70% để pass
    min: 0,
    max: 100
  },
  targetScoreRange: {
    type: String,
    required: [true, 'Dải điểm mục tiêu là bắt buộc'],
    validate: {
      validator: function(value) {
        const ieltsRanges = ['4.0-5.0', '5.0-6.0', '5.5-6.5', '6.0-7.0', '7.0-8.0', '8.0+'];
        const toeicRanges = ['250-350', '350-450', '450-550', '550-650', '650-850', '850+'];
        if (this.testType === 'IELTS') {
          return ieltsRanges.includes(value);
        } else if (this.testType === 'TOEIC') {
          return toeicRanges.includes(value);
        }
        return false;
      },
      message: 'Dải điểm mục tiêu không hợp lệ cho loại khóa học'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Schema cho kết quả Final Test
const finalTestResultSchema = new mongoose.Schema({
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
  finalTestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinalTest',
    required: [true, 'Bài final test là bắt buộc']
  },
  testType: {
    type: String,
    enum: ['IELTS', 'TOEIC'],
    required: [true, 'Loại bài test là bắt buộc']
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinalTestQuestionBank',
      required: true
    },
    userAnswer: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: function () {
        return this.questionType !== "writing";
      },
    },
    questionType: {
      type: String,
      enum: ['reading', 'listening', 'writing', 'speaking'],
      required: true
    },
    questionSubType: {
      type: String,
      enum: [
        'multiple-choice',
        'true-false-notgiven',
        'yes-no-notgiven',
        'fill-in-blank',
        'short-answer',
        'writing',
      ],
      required: true
    },        
    timeSpent: {
      type: Number, // giây
      default: 0
    }
  }],
  scores: {
    reading: {
      raw: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    listening: {
      raw: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    writing: {
      raw: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      aiEvaluation: {
        grammar: { type: Number, default: 0 },
        vocabulary: { type: Number, default: 0 },
        coherence: { type: Number, default: 0 },
        taskAchievement: { type: Number, default: 0 },
        feedback: { type: String, default: '' }
      }
    },
    speaking: {
      raw: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      aiEvaluation: {
        pronunciation: { type: Number, default: 0 },
        fluency: { type: Number, default: 0 },
        vocabulary: { type: Number, default: 0 },
        grammar: { type: Number, default: 0 },
        feedback: { type: String, default: '' }
      }
    }
  },
  totalScore: {
    raw: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  estimatedLevel: {
    ielts: {
      overall: { type: Number, min: 4.0, max: 9.0, default: null },
      reading: { type: Number, min: 4.0, max: 9.0, default: null },
      listening: { type: Number, min: 4.0, max: 9.0, default: null },
      writing: { type: Number, min: 4.0, max: 9.0, default: null },
      speaking: { type: Number, min: 4.0, max: 9.0, default: null }
    },
    toeic: {
      overall: { type: Number, min: 250, max: 990, default: null },
      listening: { type: Number, min: 125, max: 495, default: null },
      reading: { type: Number, min: 125, max: 495, default: null }
    }
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  targetAchieved: {
    type: Boolean,
    default: false
  },
  personalTargetAchieved: {
    type: Boolean,
    default: false
  },
  aiAnalysis: {
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    recommendations: [{ type: String }],
    suggestedCourses: [{
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      reason: { type: String },
      priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
      expectedOutcome: { type: String },
      timeToComplete: { type: String }
    }],
    studyPlan: {
      duration: { type: Number }, // tuần
      hoursPerWeek: { type: Number },
      focusAreas: [{ type: String }]
    },
    learningStyle: {
      type: String,
      enum: ["visual", "auditory", "kinesthetic", "mixed"],
      default: null,
    },
    confidenceLevel: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    motivationLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    // Thêm các trường mới cho Final Test
    overallAssessment: {
      summary: { type: String },
      achievementLevel: { type: String },
      improvementAreas: [{ type: String }],
      nextSteps: [{ type: String }]
    },
    learningPath: {
      shortTerm: [{ type: String }],
      longTerm: [{ type: String }],
      focusAreas: [{ type: String }]
    },
    studyAdvice: {
      dailyPractice: { type: String },
      weeklyGoals: { type: String },
      monthlyMilestones: { type: String }
    },
    targetAchievement: {
      targetAchieved: { type: Boolean, default: false },
      personalTargetAchieved: { type: Boolean, default: false },
      targetScore: { type: String },
      achievedScore: { type: String },
      gapAnalysis: { type: String }
    }
  },
  detailedAnalysis: {
    readingComprehension: {
      score: { type: Number, min: 0, max: 100 },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      recommendations: [{ type: String }],
    },
    listeningComprehension: {
      score: { type: Number, min: 0, max: 100 },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      recommendations: [{ type: String }],
    },
    writingSkills: {
      score: { type: Number, min: 0, max: 100 },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      recommendations: [{ type: String }],
      aiFeedback: { type: String },
    },
  },
  performanceMetrics: {
    averageTimePerQuestion: { type: Number, default: 0 }, // giây
    timeDistribution: {
      reading: { type: Number, default: 0 },
      listening: { type: Number, default: 0 },
      writing: { type: Number, default: 0 },
      speaking: { type: Number, default: 0 }
    },
    accuracyRate: { type: Number, min: 0, max: 100, default: 0 },
    consistencyScore: { type: Number, min: 0, max: 100, default: 0 },
    difficultyPreference: {
      type: String,
      enum: ["easy", "moderate", "challenging"],
      default: "moderate",
    }
  },
  timeSpent: {
    type: Number, // tổng thời gian làm bài (giây)
    required: true
  },
  startedAt: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: true
  },
  attempts: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
finalTestQuestionBankSchema.index({ questionType: 1, testType: 1, difficulty: 1, isActive: 1 });
finalTestQuestionBankSchema.index({ source: 1, createdBy: 1 });

finalTestSchema.index({ courseId: 1, isActive: 1 });
finalTestSchema.index({ testType: 1, isActive: 1 });
finalTestSchema.index({ createdBy: 1 });

finalTestResultSchema.index({ userId: 1, courseId: 1 });
finalTestResultSchema.index({ completedAt: -1 });
finalTestResultSchema.index({ isPassed: 1, targetAchieved: 1 });
finalTestResultSchema.index({ "estimatedLevel.ielts.overall": 1 });
finalTestResultSchema.index({ "estimatedLevel.toeic.overall": 1 });

// Pre-save middleware để tính toán điểm số
finalTestResultSchema.pre('save', function(next) {
  // Đảm bảo scores được khởi tạo
  if (!this.scores) {
    this.scores = {
      reading: { raw: 0, percentage: 0 },
      listening: { raw: 0, percentage: 0 },
      writing: { 
        raw: 0, 
        percentage: 0,
        aiEvaluation: {
          grammar: 0,
          vocabulary: 0,
          coherence: 0,
          taskAchievement: 0,
          feedback: ''
        }
      },
      speaking: { 
        raw: 0, 
        percentage: 0,
        aiEvaluation: {
          pronunciation: 0,
          fluency: 0,
          vocabulary: 0,
          grammar: 0,
          feedback: ''
        }
      }
    };
  }

  // Đảm bảo totalScore được khởi tạo
  if (!this.totalScore) {
    this.totalScore = { raw: 0, percentage: 0 };
  }

  // Đảm bảo estimatedLevel được khởi tạo
  if (!this.estimatedLevel) {
    this.estimatedLevel = {
      ielts: {
        overall: null,
        reading: null,
        listening: null,
        writing: null,
        speaking: null
      },
      toeic: {
        overall: null,
        listening: null,
        reading: null
      }
    };
  }

  if (this.isModified('answers')) {
    this.calculateScores();
  }
  next();
});

// Method để tính toán điểm số
finalTestResultSchema.methods.calculateScores = function() {
  const scoresByType = {
    reading: { correct: 0, total: 0 },
    listening: { correct: 0, total: 0 },
    writing: { correct: 0, total: 0 },
    speaking: { correct: 0, total: 0 }
  };

  // Tính điểm từng loại
  this.answers.forEach(answer => {
    if (scoresByType[answer.questionType]) {
      scoresByType[answer.questionType].total++;
      if (answer.isCorrect) {
        scoresByType[answer.questionType].correct++;
      }
    }
  });

  // Cập nhật scores
  Object.keys(scoresByType).forEach(type => {
    if (scoresByType[type].total > 0) {
      this.scores[type].raw = scoresByType[type].correct;
      this.scores[type].percentage = (scoresByType[type].correct / scoresByType[type].total) * 100;
    } else {
      this.scores[type].raw = 0;
      this.scores[type].percentage = 0;
    }
  });

  // Tính tổng điểm
  const totalCorrect = Object.values(scoresByType).reduce((sum, score) => sum + score.correct, 0);
  const totalQuestions = Object.values(scoresByType).reduce((sum, score) => sum + score.total, 0);
  
  this.totalScore.raw = totalCorrect;
  this.totalScore.percentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  // Kiểm tra pass/fail
  this.isPassed = this.totalScore.percentage >= 70;

  // Ước tính level đạt được
  this.estimateAchievedLevel();
};

// Method để ước tính level đạt được
finalTestResultSchema.methods.estimateAchievedLevel = function() {
  const percentage = this.totalScore.percentage;
  
  if (this.testType === 'IELTS') {
    // Chuyển đổi phần trăm sang IELTS band (4.0-9.0)
    const ieltsScore = Math.max(4.0, Math.min(9.0, 4.0 + (percentage / 100) * 5.0));
    this.estimatedLevel.ielts.overall = Math.round(ieltsScore * 2) / 2; // Làm tròn đến 0.5
    
    // Ước tính từng skill
    this.estimatedLevel.ielts.reading = Math.round((4.0 + (this.scores.reading.percentage / 100) * 5.0) * 2) / 2;
    this.estimatedLevel.ielts.listening = Math.round((4.0 + (this.scores.listening.percentage / 100) * 5.0) * 2) / 2;
    this.estimatedLevel.ielts.writing = Math.round((4.0 + (this.scores.writing.percentage / 100) * 5.0) * 2) / 2;
    this.estimatedLevel.ielts.speaking = Math.round((4.0 + (this.scores.speaking.percentage / 100) * 5.0) * 2) / 2;
  } else if (this.testType === 'TOEIC') {
    // Chuyển đổi phần trăm sang TOEIC score (250-990)
    const toeicScore = Math.max(250, Math.min(990, 250 + (percentage / 100) * 740));
    this.estimatedLevel.toeic.overall = Math.round(toeicScore / 5) * 5; // Làm tròn đến bội số của 5
    
    // Ước tính từng skill
    this.estimatedLevel.toeic.reading = Math.round((125 + (this.scores.reading.percentage / 100) * 370) / 5) * 5;
    this.estimatedLevel.toeic.listening = Math.round((125 + (this.scores.listening.percentage / 100) * 370) / 5) * 5;
  }
};

export const FinalTestQuestionBank = mongoose.model('FinalTestQuestionBank', finalTestQuestionBankSchema);
export const FinalTest = mongoose.model('FinalTest', finalTestSchema);
export const FinalTestResult = mongoose.model('FinalTestResult', finalTestResultSchema);
