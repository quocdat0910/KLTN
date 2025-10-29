// Utility cho việc mapping difficulty levels theo thang điểm TOEIC và IELTS

export const TOEIC_LEVELS = [
  250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 990
];

export const IELTS_LEVELS = [
  4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0
];

// Mapping từ old difficulty sang new difficulty (để migration)
export const LEGACY_TO_SCORE_MAPPING = {
  'TOEIC': {
    'beginner': 350,
    'intermediate': 550, 
    'advanced': 750
  },
  'IELTS': {
    'beginner': 4.5,
    'intermediate': 6.0,
    'advanced': 7.5
  }
};

// Mapping từ score sang descriptive level (để hiển thị)
export const SCORE_TO_DESCRIPTION = {
  'TOEIC': {
    250: 'Elementary',
    300: 'Elementary+',
    350: 'Pre-Intermediate',
    400: 'Pre-Intermediate+',
    450: 'Intermediate',
    500: 'Intermediate+',
    550: 'Upper-Intermediate',
    600: 'Upper-Intermediate+',
    650: 'Pre-Advanced',
    700: 'Advanced',
    750: 'Advanced+',
    800: 'Proficient',
    850: 'Proficient+',
    900: 'Expert',
    950: 'Expert+',
    990: 'Native-like'
  },
  'IELTS': {
    4.0: 'Limited User',
    4.5: 'Limited User+',
    5.0: 'Modest User',
    5.5: 'Modest User+',
    6.0: 'Competent User',
    6.5: 'Competent User+',
    7.0: 'Good User',
    7.5: 'Good User+',
    8.0: 'Very Good User',
    8.5: 'Very Good User+',
    9.0: 'Expert User'
  }
};

// Phân loại theo màu sắc cho UI
export const SCORE_TO_COLOR_CLASS = {
  'TOEIC': {
    250: 'score-elementary',
    300: 'score-elementary',
    350: 'score-pre-intermediate',
    400: 'score-pre-intermediate',
    450: 'score-intermediate',
    500: 'score-intermediate',
    550: 'score-upper-intermediate',
    600: 'score-upper-intermediate',
    650: 'score-pre-advanced',
    700: 'score-advanced',
    750: 'score-advanced',
    800: 'score-proficient',
    850: 'score-proficient',
    900: 'score-expert',
    950: 'score-expert',
    990: 'score-native'
  },
  'IELTS': {
    4.0: 'score-elementary',
    4.5: 'score-elementary',
    5.0: 'score-pre-intermediate',
    5.5: 'score-pre-intermediate',
    6.0: 'score-intermediate',
    6.5: 'score-intermediate',
    7.0: 'score-upper-intermediate',
    7.5: 'score-upper-intermediate',
    8.0: 'score-advanced',
    8.5: 'score-advanced',
    9.0: 'score-expert'
  }
};

export const difficultyMapping = {
  TOEIC: {
    250: 'Elementary',
    300: 'Elementary+',
    350: 'Pre-Intermediate',
    400: 'Pre-Intermediate+',
    450: 'Intermediate',
    500: 'Intermediate+',
    550: 'Upper-Intermediate',
    600: 'Upper-Intermediate+',
    650: 'Pre-Advanced',
    700: 'Advanced',
    750: 'Advanced+',
    800: 'Proficient',
    850: 'Proficient+',
    900: 'Expert',
    950: 'Expert+',
    990: 'Native-like'
  },
  IELTS: {
    4.0: 'Limited User',
    4.5: 'Limited User+',
    5.0: 'Modest User',
    5.5: 'Modest User+',
    6.0: 'Competent User',
    6.5: 'Competent User+',
    7.0: 'Good User',
    7.5: 'Good User+',
    8.0: 'Very Good User',
    8.5: 'Very Good User+',
    9.0: 'Expert User'
  }
};

// Utility functions
export const getValidDifficultyLevels = (testType) => {
  return testType === 'TOEIC' ? TOEIC_LEVELS : IELTS_LEVELS;
};

export const getDifficultyDescription = (testType, score) => {
  return SCORE_TO_DESCRIPTION[testType]?.[score] || `${testType} ${score}`;
};

export const getDifficultyColorClass = (testType, score) => {
  return SCORE_TO_COLOR_CLASS[testType]?.[score] || 'score-default';
};

export const isValidDifficulty = (testType, difficulty) => {
  const validLevels = getValidDifficultyLevels(testType);
  return validLevels.includes(Number(difficulty));
};

export const migrateLegacyDifficulty = (testType, oldDifficulty) => {
  if (isValidDifficulty(testType, oldDifficulty)) {
    return Number(oldDifficulty); // Đã là score-based
  }
  return LEGACY_TO_SCORE_MAPPING[testType]?.[oldDifficulty] || 
         (testType === 'TOEIC' ? 550 : 6.0); // Default fallback
};

// Tìm level gần nhất với score cho
export const findNearestLevel = (testType, targetScore) => {
  const validLevels = getValidDifficultyLevels(testType);
  return validLevels.reduce((prev, curr) => 
    Math.abs(curr - targetScore) < Math.abs(prev - targetScore) ? curr : prev
  );
};

// Tạo range cho AI generation
export const getScoreRange = (testType, targetScore) => {
  const validLevels = getValidDifficultyLevels(testType);
  const currentIndex = validLevels.indexOf(targetScore);
  
  if (currentIndex === -1) return { min: targetScore, max: targetScore };
  
  const min = currentIndex > 0 ? validLevels[currentIndex - 1] : targetScore;
  const max = currentIndex < validLevels.length - 1 ? validLevels[currentIndex + 1] : targetScore;
  
  return { min, max, target: targetScore };
};
