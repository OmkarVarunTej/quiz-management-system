import { Router } from "express";
import authRoutes from "./auth.routes";
import courseRoutes from "./course.routes";
import questionRoutes from "./question.routes";
import quizRoutes from "./quiz.routes";
import studentQuizRoutes from "./studentQuiz.routes";
import resultRoutes from "./result.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "API is healthy", data: { timestamp: new Date().toISOString() } });
});

router.use("/auth", authRoutes);
router.use("/courses", courseRoutes);
router.use("/questions", questionRoutes);
router.use("/quizzes", quizRoutes);
router.use("/student-quizzes", studentQuizRoutes);
router.use("/results", resultRoutes);

export default router;
