import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { authRateLimiter } from "../middlewares/rateLimiter.middleware";
import {
  facultyRegisterSchema,
  studentRegisterSchema,
  loginSchema,
} from "../validators/auth.validator";

const router = Router();

router.post("/faculty/register", authRateLimiter, validate(facultyRegisterSchema), authController.registerFaculty);
router.post("/faculty/login", authRateLimiter, validate(loginSchema), authController.loginFaculty);

router.post("/student/register", authRateLimiter, validate(studentRegisterSchema), authController.registerStudent);
router.post("/student/login", authRateLimiter, validate(loginSchema), authController.loginStudent);

router.get("/me", authenticate, authController.me);

export default router;
