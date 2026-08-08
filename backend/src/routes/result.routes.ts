import { Router } from "express";
import { resultController } from "../controllers/result.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { Role } from "../constants/roles";
import {
  quizIdParamSchema,
  studentQuizIdParamSchema,
  listResultsQuerySchema,
} from "../validators/result.validator";

const router = Router();

router.use(authenticate);

router.post(
  "/quiz/:quizId/publish",
  authorize(Role.FACULTY),
  validate(quizIdParamSchema),
  resultController.publishForQuiz
);
router.get(
  "/quiz/:quizId",
  authorize(Role.FACULTY),
  validate(listResultsQuerySchema),
  resultController.listForQuiz
);

router.get("/my", authorize(Role.STUDENT), resultController.listMine);
router.get(
  "/:studentQuizId",
  authorize(Role.STUDENT),
  validate(studentQuizIdParamSchema),
  resultController.getDetail
);

export default router;
