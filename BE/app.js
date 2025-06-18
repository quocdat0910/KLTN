import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { dbConnection } from "./database/dbConnection.js";
import userRoutes from "./router/userRoutes.js";
import courseRoutes from './router/courseRoutes.js';
import chapterRoutes from './router/chapterRoutes.js';
import videoRoutes from './router/videoRoutes.js';
import quizRoutes from './router/quizRoutes.js';

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

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/courses/:courseId/chapters', chapterRoutes);
app.use('/api/v1/chapters/:chapterId/videos', videoRoutes);
app.use('/api/v1/chapters/:chapterId/quizzes', quizRoutes);

dbConnection();

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Có lỗi xảy ra, vui lòng thử lại',
  });
});

export default app;
