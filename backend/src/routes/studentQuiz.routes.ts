import { Router } from "express";
import { studentQuizController } from "../controllers/studentQuiz.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { Role } from "../constants/roles";
import {
  quizIdParamSchema,
  saveAnswerSchema,
  submitQuizSchema,
} from "../validators/studentQuiz.validator";

const router = Router();

router.use(authenticate, authorize(Role.STUDENT));

router.get("/available", studentQuizController.listAvailable);
router.post("/:quizId/start", validate(quizIdParamSchema), studentQuizController.start);
router.get("/:quizId/session", validate(quizIdParamSchema), studentQuizController.getSession);
router.patch("/:quizId/answer", validate(saveAnswerSchema), studentQuizController.saveAnswer);
router.post("/:quizId/submit", validate(submitQuizSchema), studentQuizController.submit);

export default router;
