import { Router } from "express";
import { z } from "zod";
import { quizController } from "../controllers/quiz.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { Role } from "../constants/roles";
import {
  createQuizSchema,
  updateQuizSchema,
  idParamSchema,
  assignQuestionsSchema,
  listQuizzesQuerySchema,
} from "../validators/quiz.validator";

const router = Router();

router.use(authenticate);

router.post("/", authorize(Role.FACULTY), validate(createQuizSchema), quizController.create);
router.get("/", validate(listQuizzesQuerySchema), quizController.list);
router.get("/:id", validate(idParamSchema), quizController.getById);
router.patch("/:id", authorize(Role.FACULTY), validate(updateQuizSchema), quizController.update);
router.delete("/:id", authorize(Role.FACULTY), validate(idParamSchema), quizController.remove);

router.post(
  "/:id/questions",
  authorize(Role.FACULTY),
  validate(assignQuestionsSchema),
  quizController.assignQuestions
);
router.delete(
  "/:id/questions/:questionId",
  authorize(Role.FACULTY),
  validate({ params: z.object({ id: z.string().uuid(), questionId: z.string().uuid() }) }),
  quizController.removeQuestion
);

router.post("/:id/publish", authorize(Role.FACULTY), validate(idParamSchema), quizController.publish);
router.post("/:id/close", authorize(Role.FACULTY), validate(idParamSchema), quizController.close);

export default router;
