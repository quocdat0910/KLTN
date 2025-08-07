import mongoose from 'mongoose';

// Schema cho ngân hàng câu hỏi placement test
const questionBankSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Nội dung câu hỏi là bắt buộc'],
    trim: true
  },
  questionType: {
    type: String,
    enum: ['reading', 'listening', 'grammar', 'vocabulary', 'writing'],
    required: [true, 'Loại câu hỏi là bắt buộc']
  },
  testType: {
    type: String,
    enum: ['IELTS', 'TOEIC'],
    required: [true, 'Loại bài test là bắt buộc']
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Độ khó là bắt buộc']
  },
  options: [{
    type: String,
    required: function() {
      return this.questionType !== 'writing';
    }
  }],
  correctAnswer: {
    type: String,
    required: function() {
      return this.questionType !== 'writing';
    }
  },
  explanation: {
    type: String,
    default: ''
  },
  // Cho reading và listening
  passage: {
    type: String,
    default: ''
  },
  audioUrl: {
    type: String,
    default: ''
  },
  // Metadata
  source: {
    type: String,
    enum: ['admin', 'ai_generated'],
    required: [true, 'Nguồn câu hỏi là bắt buộc']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.source === 'admin';
    }
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
});

// Schema cho bài placement test
const placementTestSchema = new mongoose.Schema({
  testType: {
    type: String,
    enum: ['IELTS', 'TOEIC'],
    required: [true, 'Loại bài test là bắt buộc']
  },
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionBank',
      required: true
    },
    questionType: {
      type: String,
      enum: ['reading', 'listening', 'grammar', 'vocabulary', 'writing'],
      required: true
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
    min: 4,
    max: 100
  },
  timeLimit: {
    type: Number, // phút
    required: true,
    default: 60
  },
  passingScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
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

// Schema cho kết quả placement test
const placementTestResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Người dùng là bắt buộc']
  },
  placementTestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlacementTest',
    required: [true, 'Bài placement test là bắt buộc']
  },
  testType: {
    type: String,
    enum: ['IELTS', 'TOEIC'],
    required: [true, 'Loại bài test là bắt buộc']
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionBank',
      required: true
    },
    userAnswer: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: function() {
        return this.questionType !== 'writing';
      }
    },
    questionType: {
      type: String,
      enum: ['reading', 'listening', 'grammar', 'vocabulary', 'writing'],
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
    grammar: {
      raw: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    vocabulary: {
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
  aiAnalysis: {
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    recommendations: [{ type: String }],
    suggestedCourses: [{
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      reason: { type: String },
      priority: { type: Number, min: 1, max: 5, default: 3 }
    }],
    studyPlan: {
      duration: { type: Number }, // tuần
      hoursPerWeek: { type: Number },
      focusAreas: [{ type: String }]
    },
    learningStyle: { 
      type: String, 
      enum: ['visual', 'auditory', 'kinesthetic', 'mixed'],
      default: null 
    },
    confidenceLevel: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    motivationLevel: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  detailedAnalysis: {
    readingComprehension: {
      score: { type: Number, min: 0, max: 100 },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      recommendations: [{ type: String }]
    },
    listeningComprehension: {
      score: { type: Number, min: 0, max: 100 },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      recommendations: [{ type: String }]
    },
    grammarKnowledge: {
      score: { type: Number, min: 0, max: 100 },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      recommendations: [{ type: String }]
    },
    vocabularyRange: {
      score: { type: Number, min: 0, max: 100 },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      recommendations: [{ type: String }]
    },
    writingSkills: {
      score: { type: Number, min: 0, max: 100 },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      recommendations: [{ type: String }],
      aiFeedback: { type: String }
    }
  },
  performanceMetrics: {
    averageTimePerQuestion: { type: Number, default: 0 }, // giây
    timeDistribution: {
      reading: { type: Number, default: 0 },
      listening: { type: Number, default: 0 },
      grammar: { type: Number, default: 0 },
      vocabulary: { type: Number, default: 0 },
      writing: { type: Number, default: 0 }
    },
    accuracyRate: { type: Number, min: 0, max: 100, default: 0 },
    consistencyScore: { type: Number, min: 0, max: 100, default: 0 },
    difficultyPreference: { 
      type: String, 
      enum: ['easy', 'moderate', 'challenging'],
      default: 'moderate'
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
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
questionBankSchema.index({ questionType: 1, testType: 1, difficulty: 1, isActive: 1 });
questionBankSchema.index({ source: 1, createdBy: 1 });

placementTestSchema.index({ testType: 1, isActive: 1 });
placementTestSchema.index({ createdBy: 1 });

placementTestResultSchema.index({ userId: 1, testType: 1 });
placementTestResultSchema.index({ completedAt: -1 });
placementTestResultSchema.index({ 'estimatedLevel.ielts.overall': 1 });
placementTestResultSchema.index({ 'estimatedLevel.toeic.overall': 1 });

// Pre-save middleware để tính toán điểm số
placementTestResultSchema.pre('save', function(next) {
  if (this.isModified('answers')) {
    this.calculateScores();
  }
  next();
});

// Method để tính toán điểm số
placementTestResultSchema.methods.calculateScores = function() {
  const scoresByType = {
    reading: { correct: 0, total: 0 },
    listening: { correct: 0, total: 0 },
    grammar: { correct: 0, total: 0 },
    vocabulary: { correct: 0, total: 0 },
    writing: { correct: 0, total: 0 }
  };

  // Tính điểm từng loại
  this.answers.forEach(answer => {
    if (scoresByType[answer.questionType]) {
      scoresByType[answer.questionType].total++;
      if (answer.isCorrect || answer.questionType === 'writing') {
        scoresByType[answer.questionType].correct++;
      }
    }
  });

  // Cập nhật scores
  Object.keys(scoresByType).forEach(type => {
    if (scoresByType[type].total > 0) {
      this.scores[type].raw = scoresByType[type].correct;
      this.scores[type].percentage = (scoresByType[type].correct / scoresByType[type].total) * 100;
    }
  });

  // Tính tổng điểm
  const totalCorrect = Object.values(scoresByType).reduce((sum, score) => sum + score.correct, 0);
  const totalQuestions = Object.values(scoresByType).reduce((sum, score) => sum + score.total, 0);
  
  this.totalScore.raw = totalCorrect;
  this.totalScore.percentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  // Ước tính level (sẽ được cải thiện bởi AI)
  this.estimateLevel();
};

// Method để ước tính level
placementTestResultSchema.methods.estimateLevel = function() {
  const percentage = this.totalScore.percentage;
  
  if (this.testType === 'IELTS') {
    // Chuyển đổi phần trăm sang IELTS band (4.0-9.0)
    const ieltsScore = Math.max(4.0, Math.min(9.0, 4.0 + (percentage / 100) * 5.0));
    this.estimatedLevel.ielts.overall = Math.round(ieltsScore * 2) / 2; // Làm tròn đến 0.5
    
    // Ước tính từng skill
    this.estimatedLevel.ielts.reading = Math.round((4.0 + (this.scores.reading.percentage / 100) * 5.0) * 2) / 2;
    this.estimatedLevel.ielts.listening = Math.round((4.0 + (this.scores.listening.percentage / 100) * 5.0) * 2) / 2;
    this.estimatedLevel.ielts.writing = Math.round((4.0 + (this.scores.writing.percentage / 100) * 5.0) * 2) / 2;
  } else if (this.testType === 'TOEIC') {
    // Chuyển đổi phần trăm sang TOEIC score (250-990)
    const toeicScore = Math.max(250, Math.min(990, 250 + (percentage / 100) * 740));
    this.estimatedLevel.toeic.overall = Math.round(toeicScore / 5) * 5; // Làm tròn đến bội số của 5
    
    // Ước tính từng skill
    this.estimatedLevel.toeic.reading = Math.round((125 + (this.scores.reading.percentage / 100) * 370) / 5) * 5;
    this.estimatedLevel.toeic.listening = Math.round((125 + (this.scores.listening.percentage / 100) * 370) / 5) * 5;
  }
};

export const QuestionBank = mongoose.model('QuestionBank', questionBankSchema);
export const PlacementTest = mongoose.model('PlacementTest', placementTestSchema);
export const PlacementTestResult = mongoose.model('PlacementTestResult', placementTestResultSchema);
