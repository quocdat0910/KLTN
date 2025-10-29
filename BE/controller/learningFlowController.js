import UserProgress from "../models/userProgressSchema.js";
import User from "../models/userSchema.js";
import Course from "../models/courseSchema.js";
import Chapter from "../models/chapterSchema.js";
import Lesson from "../models/lessonSchema.js";
import Exercise from "../models/exerciseSchema.js";
import Enrollment from "../models/enrollmentSchema.js";
import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";

// @route GET /api/v1/learning-flow/current-position/:courseId
// @desc Get user's current learning position in a course
// @access Protected
export const getCurrentLearningPosition = catchAsyncErrors(async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  // Validate courseId
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return next(new ErrorHandler('ID khóa học không hợp lệ', 400));
  }

  // Check enrollment
  const isEnrolled = await Enrollment.exists({ userId, courseId, status: "active" });
  if (!isEnrolled && req.user.role !== "admin") {
    return next(new ErrorHandler('Bạn chưa đăng ký khóa học này', 403));
  }

  // Get course with full structure
  const course = await Course.findById(courseId)
    .populate({
      path: 'chapters',
      populate: [
        { path: 'lessons', select: 'title order videoDuration isPublished' },
        { path: 'exercises', select: 'title order type passingScore isPublished' }
      ],
      options: { sort: { order: 1 } }
    });

  if (!course) {
    return next(new ErrorHandler('Không tìm thấy khóa học', 404));
  }

  // Get user progress
  const userProgress = await UserProgress.findOne({ userId, courseId });
  
  if (!userProgress) {
    // Create initial progress if not exists
    const newProgress = new UserProgress({
      userId,
      courseId,
      chapterProgress: []
    });
    await newProgress.save();
    
    return res.status(200).json({
      success: true,
      data: {
        currentPosition: {
          type: 'course_start',
          courseId: course._id,
          courseTitle: course.title,
          nextItem: getNextAvailableItem(course.chapters, null)
        },
        progress: {
          completionPercentage: 0,
          totalChapters: course.chapters.length,
          completedChapters: 0
        }
      }
    });
  }

  // Find current learning position
  const currentPosition = findCurrentLearningPosition(course, userProgress);
  
  res.status(200).json({
    success: true,
    data: {
      currentPosition,
      progress: {
        completionPercentage: userProgress.completionPercentage,
        totalChapters: course.chapters.length,
        completedChapters: userProgress.chapterProgress.filter(cp => cp.isCompleted).length,
        isCourseCompleted: userProgress.isCourseCompleted
      }
    }
  });
});

// @route POST /api/v1/learning-flow/start-exercise
// @desc Start an exercise and track current question
// @access Protected
export const startExercise = catchAsyncErrors(async (req, res, next) => {
  const { courseId, chapterId, exerciseId } = req.body;
  const userId = req.user._id;

  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(courseId) || 
      !mongoose.Types.ObjectId.isValid(chapterId) || 
      !mongoose.Types.ObjectId.isValid(exerciseId)) {
    return next(new ErrorHandler('ID không hợp lệ', 400));
  }

  // Check enrollment
  const isEnrolled = await Enrollment.exists({ userId, courseId, status: "active" });
  if (!isEnrolled && req.user.role !== "admin") {
    return next(new ErrorHandler('Bạn chưa đăng ký khóa học này', 403));
  }

  // Get exercise details
  const exercise = await Exercise.findById(exerciseId);
  if (!exercise) {
    return next(new ErrorHandler('Không tìm thấy bài tập', 404));
  }

  // Get or create user progress
  let userProgress = await UserProgress.findOne({ userId, courseId });
  if (!userProgress) {
    userProgress = new UserProgress({
      userId,
      courseId,
      chapterProgress: []
    });
  }

  // Find or create chapter progress
  let chapterProgress = userProgress.chapterProgress.find(
    cp => cp.chapterId.toString() === chapterId
  );
  if (!chapterProgress) {
    chapterProgress = {
      chapterId,
      isCompleted: false,
      lessonProgress: [],
      exerciseResults: []
    };
    userProgress.chapterProgress.push(chapterProgress);
  }

  // Find or create exercise result
  let exerciseResult = chapterProgress.exerciseResults.find(
    er => er.exerciseId.toString() === exerciseId
  );
  if (!exerciseResult) {
    exerciseResult = {
      exerciseId,
      bestScore: 0,
      totalQuestions: exercise.questions.length,
      correctAnswers: 0,
      isPassed: false,
      currentQuestionIndex: 0,
      isStarted: false,
      isCompleted: false,
      startedAt: null,
      completedAt: null,
      attempts: [],
      lastAttemptAt: new Date()
    };
    chapterProgress.exerciseResults.push(exerciseResult);
  }

  // Start the exercise
  if (!exerciseResult.isStarted) {
    exerciseResult.isStarted = true;
    exerciseResult.startedAt = new Date();
    exerciseResult.currentQuestionIndex = 0;
  }

  await userProgress.save();

  res.status(200).json({
    success: true,
    message: 'Bắt đầu bài tập thành công',
    data: {
      exerciseId: exercise._id,
      title: exercise.title,
      type: exercise.type,
      totalQuestions: exercise.questions.length,
      currentQuestionIndex: exerciseResult.currentQuestionIndex,
      timeLimit: exercise.timeLimit,
      passingScore: exercise.passingScore
    }
  });
});

// @route PUT /api/v1/learning-flow/update-question-progress
// @desc Update current question index in exercise
// @access Protected
export const updateQuestionProgress = catchAsyncErrors(async (req, res, next) => {
  const { courseId, chapterId, exerciseId, questionIndex } = req.body;
  const userId = req.user._id;

  // Validate input
  if (!mongoose.Types.ObjectId.isValid(courseId) || 
      !mongoose.Types.ObjectId.isValid(chapterId) || 
      !mongoose.Types.ObjectId.isValid(exerciseId) ||
      typeof questionIndex !== 'number' || questionIndex < 0) {
    return next(new ErrorHandler('Dữ liệu đầu vào không hợp lệ', 400));
  }

  // Get user progress
  const userProgress = await UserProgress.findOne({ userId, courseId });
  if (!userProgress) {
    return next(new ErrorHandler('Không tìm thấy tiến độ học tập', 404));
  }

  // Find chapter and exercise progress
  const chapterProgress = userProgress.chapterProgress.find(
    cp => cp.chapterId.toString() === chapterId
  );
  if (!chapterProgress) {
    return next(new ErrorHandler('Không tìm thấy tiến độ chương', 404));
  }

  const exerciseResult = chapterProgress.exerciseResults.find(
    er => er.exerciseId.toString() === exerciseId
  );
  if (!exerciseResult) {
    return next(new ErrorHandler('Không tìm thấy tiến độ bài tập', 404));
  }

  // Update question index
  exerciseResult.currentQuestionIndex = questionIndex;
  await userProgress.save();

  res.status(200).json({
    success: true,
    message: 'Cập nhật tiến độ câu hỏi thành công',
    data: {
      currentQuestionIndex: exerciseResult.currentQuestionIndex
    }
  });
});

// @route GET /api/v1/learning-flow/next-item/:courseId
// @desc Get next available learning item (lesson or exercise)
// @access Protected
export const getNextLearningItem = catchAsyncErrors(async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  // Validate courseId
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return next(new ErrorHandler('ID khóa học không hợp lệ', 400));
  }

  // Get course with structure
  const course = await Course.findById(courseId)
    .populate({
      path: 'chapters',
      populate: [
        { path: 'lessons', select: 'title order videoDuration isPublished' },
        { path: 'exercises', select: 'title order type passingScore isPublished' }
      ],
      options: { sort: { order: 1 } }
    });

  if (!course) {
    return next(new ErrorHandler('Không tìm thấy khóa học', 404));
  }

  // Get user progress
  const userProgress = await UserProgress.findOne({ userId, courseId });
  
  const nextItem = getNextAvailableItem(course.chapters, userProgress);

  res.status(200).json({
    success: true,
    data: {
      nextItem,
      hasNext: !!nextItem
    }
  });
});

// @route POST /api/v1/learning-flow/update-progress
// @desc Update learning progress for lesson or exercise
// @access Protected
export const updateLearningProgress = catchAsyncErrors(async (req, res, next) => {
  const { courseId, type, itemId, chapterId, ...data } = req.body;
  const userId = req.user._id;

  // Validate input
  if (!mongoose.Types.ObjectId.isValid(courseId) || 
      !mongoose.Types.ObjectId.isValid(chapterId) ||
      !mongoose.Types.ObjectId.isValid(itemId) ||
      !['lesson', 'exercise'].includes(type)) {
    return next(new ErrorHandler('Dữ liệu đầu vào không hợp lệ', 400));
  }

  // Get user progress
  let userProgress = await UserProgress.findOne({ userId, courseId });
  if (!userProgress) {
    return next(new ErrorHandler('Không tìm thấy tiến độ học tập', 404));
  }

  // Find chapter progress
  let chapterProgress = userProgress.chapterProgress.find(
    cp => cp.chapterId.toString() === chapterId
  );
  if (!chapterProgress) {
    return next(new ErrorHandler('Không tìm thấy tiến độ chương', 404));
  }

  if (type === 'lesson') {
    // Update lesson progress
    let lessonProgress = chapterProgress.lessonProgress.find(
      lp => lp.lessonId.toString() === itemId
    );

    if (!lessonProgress) {
      // Create new lesson progress
      lessonProgress = {
        lessonId: itemId,
        watchTime: 0,
        isCompleted: false,
        lastWatchedAt: null,
        resourcesAccessed: []
      };
      chapterProgress.lessonProgress.push(lessonProgress);
    }

    // Update lesson data
    if (data.watchTime !== undefined) {
      lessonProgress.watchTime = Math.max(lessonProgress.watchTime, data.watchTime);
    }
    if (data.isCompleted !== undefined) {
      lessonProgress.isCompleted = data.isCompleted;
    }
    if (data.lastWatchedAt !== undefined) {
      lessonProgress.lastWatchedAt = new Date(data.lastWatchedAt);
    } else {
      lessonProgress.lastWatchedAt = new Date();
    }

  } else if (type === 'exercise') {
    // Update exercise progress
    let exerciseResult = chapterProgress.exerciseResults.find(
      er => er.exerciseId.toString() === itemId
    );

    if (!exerciseResult) {
      // Create new exercise result
      exerciseResult = {
        exerciseId: itemId,
        bestScore: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        isPassed: false,
        currentQuestionIndex: 0,
        isStarted: false,
        isCompleted: false,
        startedAt: null,
        completedAt: null,
        attempts: [],
        lastAttemptAt: null
      };
      chapterProgress.exerciseResults.push(exerciseResult);
    }

    // Update exercise data
    if (data.isStarted !== undefined) {
      exerciseResult.isStarted = data.isStarted;
      if (data.isStarted && !exerciseResult.startedAt) {
        exerciseResult.startedAt = new Date();
      }
    }
    if (data.isCompleted !== undefined) {
      exerciseResult.isCompleted = data.isCompleted;
      if (data.isCompleted && !exerciseResult.completedAt) {
        exerciseResult.completedAt = new Date();
      }
    }
    if (data.currentQuestionIndex !== undefined) {
      exerciseResult.currentQuestionIndex = data.currentQuestionIndex;
    }
  }

  await userProgress.save();

  res.status(200).json({
    success: true,
    message: 'Cập nhật tiến độ học tập thành công',
    data: {
      type,
      itemId,
      chapterId,
      updatedAt: new Date()
    }
  });
});

// @route POST /api/v1/learning-flow/unlock-next
// @desc Unlock next chapter/lesson after completing requirements
// @access Protected
export const unlockNextItem = catchAsyncErrors(async (req, res, next) => {
  const { courseId, completedItemType, completedItemId } = req.body;
  const userId = req.user._id;

  // Validate input
  if (!mongoose.Types.ObjectId.isValid(courseId) || 
      !mongoose.Types.ObjectId.isValid(completedItemId) ||
      !['lesson', 'exercise'].includes(completedItemType)) {
    return next(new ErrorHandler('Dữ liệu đầu vào không hợp lệ', 400));
  }

  // Get course structure
  const course = await Course.findById(courseId)
    .populate({
      path: 'chapters',
      populate: [
        { path: 'lessons', select: 'title order isPublished' },
        { path: 'exercises', select: 'title order isPublished' }
      ],
      options: { sort: { order: 1 } }
    });

  if (!course) {
    return next(new ErrorHandler('Không tìm thấy khóa học', 404));
  }

  // Get user progress
  const userProgress = await UserProgress.findOne({ userId, courseId });
  if (!userProgress) {
    return next(new ErrorHandler('Không tìm thấy tiến độ học tập', 404));
  }

  // Check if item is actually completed and unlock next
  const unlockedItems = checkAndUnlockNext(course, userProgress, completedItemType, completedItemId);

  await userProgress.save();

  res.status(200).json({
    success: true,
    message: 'Kiểm tra và mở khóa thành công',
    data: {
      unlockedItems,
      nextAvailable: getNextAvailableItem(course.chapters, userProgress)
    }
  });
});

// Helper Functions

function findCurrentLearningPosition(course, userProgress) {
  for (const chapter of course.chapters) {
    const chapterProgress = userProgress.chapterProgress.find(
      cp => cp.chapterId.toString() === chapter._id.toString()
    );

    if (!chapterProgress) {
      // First unstarted chapter
      return {
        type: 'chapter',
        chapterId: chapter._id,
        chapterTitle: chapter.title,
        chapterOrder: chapter.order,
        nextItem: getFirstItemInChapter(chapter)
      };
    }

    // Check lessons in chapter
    for (const lesson of chapter.lessons.filter(l => l.isPublished).sort((a, b) => a.order - b.order)) {
      const lessonProgress = chapterProgress.lessonProgress.find(
        lp => lp.lessonId.toString() === lesson._id.toString()
      );

      if (!lessonProgress || !lessonProgress.isCompleted) {
        return {
          type: 'lesson',
          chapterId: chapter._id,
          chapterTitle: chapter.title,
          lessonId: lesson._id,
          lessonTitle: lesson.title,
          lessonOrder: lesson.order,
          isStarted: !!lessonProgress,
          watchTime: lessonProgress?.watchTime || 0,
          totalDuration: lesson.videoDuration
        };
      }
    }

    // Check exercises in chapter
    for (const exercise of chapter.exercises.filter(e => e.isPublished).sort((a, b) => a.order - b.order)) {
      const exerciseResult = chapterProgress.exerciseResults.find(
        er => er.exerciseId.toString() === exercise._id.toString()
      );

      if (!exerciseResult || !exerciseResult.isPassed) {
        return {
          type: 'exercise',
          chapterId: chapter._id,
          chapterTitle: chapter.title,
          exerciseId: exercise._id,
          exerciseTitle: exercise.title,
          exerciseOrder: exercise.order,
          exerciseType: exercise.type,
          isStarted: exerciseResult?.isStarted || false,
          isCompleted: exerciseResult?.isCompleted || false,
          currentQuestionIndex: exerciseResult?.currentQuestionIndex || 0,
          totalQuestions: exercise.questions?.length || 0,
          bestScore: exerciseResult?.bestScore || 0,
          passingScore: exercise.passingScore
        };
      }
    }
  }

  // Course completed
  return {
    type: 'course_completed',
    courseId: course._id,
    courseTitle: course.title,
    completedAt: userProgress.completedAt
  };
}

function getNextAvailableItem(chapters, userProgress) {
  if (!userProgress) {
    // Return first item of first chapter
    const firstChapter = chapters.find(c => c.isPublished);
    if (firstChapter) {
      return getFirstItemInChapter(firstChapter);
    }
    return null;
  }

  for (const chapter of chapters.filter(c => c.isPublished).sort((a, b) => a.order - b.order)) {
    const chapterProgress = userProgress.chapterProgress.find(
      cp => cp.chapterId.toString() === chapter._id.toString()
    );

    if (!chapterProgress || !chapterProgress.isCompleted) {
      // Find next incomplete item in this chapter
      const nextItem = getNextIncompleteItemInChapter(chapter, chapterProgress);
      if (nextItem) return nextItem;
    }
  }

  return null; // Course completed
}

function getFirstItemInChapter(chapter) {
  const firstLesson = chapter.lessons
    .filter(l => l.isPublished)
    .sort((a, b) => a.order - b.order)[0];
  
  if (firstLesson) {
    return {
      type: 'lesson',
      chapterId: chapter._id,
      chapterTitle: chapter.title,
      itemId: firstLesson._id,
      itemTitle: firstLesson.title,
      itemOrder: firstLesson.order
    };
  }

  const firstExercise = chapter.exercises
    .filter(e => e.isPublished)
    .sort((a, b) => a.order - b.order)[0];
  
  if (firstExercise) {
    return {
      type: 'exercise',
      chapterId: chapter._id,
      chapterTitle: chapter.title,
      itemId: firstExercise._id,
      itemTitle: firstExercise.title,
      itemOrder: firstExercise.order
    };
  }

  return null;
}

function getNextIncompleteItemInChapter(chapter, chapterProgress) {
  // Check lessons first
  for (const lesson of chapter.lessons.filter(l => l.isPublished).sort((a, b) => a.order - b.order)) {
    const lessonProgress = chapterProgress?.lessonProgress.find(
      lp => lp.lessonId.toString() === lesson._id.toString()
    );

    if (!lessonProgress || !lessonProgress.isCompleted) {
      return {
        type: 'lesson',
        chapterId: chapter._id,
        chapterTitle: chapter.title,
        itemId: lesson._id,
        itemTitle: lesson.title,
        itemOrder: lesson.order
      };
    }
  }

  // Then check exercises
  for (const exercise of chapter.exercises.filter(e => e.isPublished).sort((a, b) => a.order - b.order)) {
    const exerciseResult = chapterProgress?.exerciseResults.find(
      er => er.exerciseId.toString() === exercise._id.toString()
    );

    if (!exerciseResult || !exerciseResult.isPassed) {
      return {
        type: 'exercise',
        chapterId: chapter._id,
        chapterTitle: chapter.title,
        itemId: exercise._id,
        itemTitle: exercise.title,
        itemOrder: exercise.order
      };
    }
  }

  return null;
}

function checkAndUnlockNext(course, userProgress, completedItemType, completedItemId) {
  const unlockedItems = [];
  
  // Find the chapter containing the completed item
  for (const chapter of course.chapters) {
    const chapterProgress = userProgress.chapterProgress.find(
      cp => cp.chapterId.toString() === chapter._id.toString()
    );

    if (!chapterProgress) continue;

    if (completedItemType === 'lesson') {
      // Check if lesson is completed and unlock next item in sequence
      const lessonProgress = chapterProgress.lessonProgress.find(
        lp => lp.lessonId.toString() === completedItemId.toString()
      );

      if (lessonProgress && lessonProgress.isCompleted) {
        // Find next item in chapter (lesson or exercise)
        const nextItem = findNextItemAfterLesson(chapter, completedItemId);
        if (nextItem) {
          unlockedItems.push(nextItem);
        } else {
          // Check if chapter is completed
          if (isChapterCompleted(chapter, chapterProgress)) {
            chapterProgress.isCompleted = true;
            chapterProgress.completedAt = new Date();
            
            // Unlock first item of next chapter
            const nextChapter = findNextChapter(course.chapters, chapter._id);
            if (nextChapter) {
              const firstItem = getFirstItemInChapter(nextChapter);
              if (firstItem) unlockedItems.push(firstItem);
            } else {
              // Course completed
              userProgress.isCompleted = true;
              userProgress.completedAt = new Date();
            }
          }
        }
      }
    } else if (completedItemType === 'exercise') {
      // Check if exercise is passed and unlock next item
      const exerciseResult = chapterProgress.exerciseResults.find(
        er => er.exerciseId.toString() === completedItemId.toString()
      );

      if (exerciseResult && exerciseResult.isPassed) {
        // Find next item in chapter
        const nextItem = findNextItemAfterExercise(chapter, completedItemId);
        if (nextItem) {
          unlockedItems.push(nextItem);
        } else {
          // Check if chapter is completed
          if (isChapterCompleted(chapter, chapterProgress)) {
            chapterProgress.isCompleted = true;
            chapterProgress.completedAt = new Date();
            
            // Unlock first item of next chapter
            const nextChapter = findNextChapter(course.chapters, chapter._id);
            if (nextChapter) {
              const firstItem = getFirstItemInChapter(nextChapter);
              if (firstItem) unlockedItems.push(firstItem);
            } else {
              // Course completed
              userProgress.isCompleted = true;
              userProgress.completedAt = new Date();
            }
          }
        }
      }
    }
  }
  
  return unlockedItems;
}

function findNextItemAfterLesson(chapter, lessonId) {
  const lessons = chapter.lessons.filter(l => l.isPublished).sort((a, b) => a.order - b.order);
  const exercises = chapter.exercises.filter(e => e.isPublished).sort((a, b) => a.order - b.order);
  
  const currentLessonIndex = lessons.findIndex(l => l._id.toString() === lessonId.toString());
  
  // Check if there's a next lesson
  if (currentLessonIndex >= 0 && currentLessonIndex < lessons.length - 1) {
    const nextLesson = lessons[currentLessonIndex + 1];
    return {
      type: 'lesson',
      chapterId: chapter._id,
      itemId: nextLesson._id,
      itemTitle: nextLesson.title
    };
  }
  
  // Check if there are exercises after all lessons
  if (exercises.length > 0) {
    const firstExercise = exercises[0];
    return {
      type: 'exercise',
      chapterId: chapter._id,
      itemId: firstExercise._id,
      itemTitle: firstExercise.title
    };
  }
  
  return null;
}

function findNextItemAfterExercise(chapter, exerciseId) {
  const exercises = chapter.exercises.filter(e => e.isPublished).sort((a, b) => a.order - b.order);
  
  const currentExerciseIndex = exercises.findIndex(e => e._id.toString() === exerciseId.toString());
  
  // Check if there's a next exercise
  if (currentExerciseIndex >= 0 && currentExerciseIndex < exercises.length - 1) {
    const nextExercise = exercises[currentExerciseIndex + 1];
    return {
      type: 'exercise',
      chapterId: chapter._id,
      itemId: nextExercise._id,
      itemTitle: nextExercise.title
    };
  }
  
  return null;
}

function isChapterCompleted(chapter, chapterProgress) {
  // Check all lessons are completed
  const publishedLessons = chapter.lessons.filter(l => l.isPublished);
  for (const lesson of publishedLessons) {
    const lessonProgress = chapterProgress.lessonProgress.find(
      lp => lp.lessonId.toString() === lesson._id.toString()
    );
    if (!lessonProgress || !lessonProgress.isCompleted) {
      return false;
    }
  }
  
  // Check all exercises are passed
  const publishedExercises = chapter.exercises.filter(e => e.isPublished);
  for (const exercise of publishedExercises) {
    const exerciseResult = chapterProgress.exerciseResults.find(
      er => er.exerciseId.toString() === exercise._id.toString()
    );
    if (!exerciseResult || !exerciseResult.isPassed) {
      return false;
    }
  }
  
  return true;
}

function findNextChapter(chapters, currentChapterId) {
  const sortedChapters = chapters.filter(c => c.isPublished).sort((a, b) => a.order - b.order);
  const currentIndex = sortedChapters.findIndex(c => c._id.toString() === currentChapterId.toString());
  
  if (currentIndex >= 0 && currentIndex < sortedChapters.length - 1) {
    return sortedChapters[currentIndex + 1];
  }
  
  return null;
}
