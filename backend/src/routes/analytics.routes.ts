import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { Role } from "../constants/roles";
import { quizAnalyticsParamSchema } from "../validators/analytics.validator";

const router = Router();

router.use(authenticate, authorize(Role.FACULTY));

router.get("/quiz/:quizId", validate(quizAnalyticsParamSchema), analyticsController.quizAnalytics);

export default router;
