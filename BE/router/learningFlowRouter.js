import express from "express";
import {
  getCurrentLearningPosition,
  startExercise,
  updateQuestionProgress,
  getNextLearningItem,
  unlockNextItem,
  updateLearningProgress
} from "../controller/learningFlowController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get current learning position in a course
router.get("/current-position/:courseId", isAuthenticated, getCurrentLearningPosition);

// Start an exercise and initialize tracking
router.post("/start-exercise", isAuthenticated, startExercise);

// Update current question progress in exercise
router.put("/update-question-progress", isAuthenticated, updateQuestionProgress);

// Update learning progress (lesson/exercise completion)
router.post("/update-progress", isAuthenticated, updateLearningProgress);

// Get next available learning item
router.get("/next-item/:courseId", isAuthenticated, getNextLearningItem);

// Unlock next item after completing requirements
router.post("/unlock-next", isAuthenticated, unlockNextItem);

export default router;
