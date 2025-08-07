import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { dbConnection } from "./database/dbConnection.js";
import userRouter from "./router/userRouter.js";
import courseRouter from "./router/courseRouter.js";
import chapterRouter from "./router/chapterRouter.js";
import lessonRouter from "./router/lessonRouter.js";
import exerciseRouter from "./router/exerciseRouter.js";
import noteRouter from "./router/noteRouter.js";
import userProgressRouter from "./router/userProgressRouter.js";
import enrollmentRouter from "./router/enrollmentRouter.js";
import placementTestRouter from "./router/placementTestRouter.js";
import courseRecommendationRouter from "./router/courseRecommendationRouter.js";
import questionBankRouter from "./router/questionBankRouter.js";

const app = express();
config({ path: "./config/config.env" });

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
    method: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

app.use("/api/v1/users", userRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/progress", userProgressRouter);
app.use("/api/v1/enrollments", enrollmentRouter);
app.use("/api/v1/courses/:courseId/chapters", chapterRouter);
app.use("/api/v1/courses/:courseId/chapters/:chapterId/lessons", lessonRouter);
app.use("/api/v1/courses/:courseId/chapters/:chapterId/exercises", exerciseRouter);
app.use("/api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId/notes", noteRouter);
app.use("/api/v1/placement-tests", placementTestRouter);
app.use("/api/v1/recommendations", courseRecommendationRouter);
app.use("/api/v1/question-bank", questionBankRouter);

dbConnection();

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Có lỗi xảy ra, vui lòng thử lại",
  });
});

export default app;