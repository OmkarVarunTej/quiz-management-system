import { Router } from "express";
import { courseController } from "../controllers/course.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { Role } from "../constants/roles";
import {
  createCourseSchema,
  updateCourseSchema,
  idParamSchema,
  enrollStudentSchema,
} from "../validators/course.validator";
import { z } from "zod";
import { validate as v } from "../middlewares/validate.middleware";

const router = Router();

router.use(authenticate);

router.post("/", authorize(Role.FACULTY), validate(createCourseSchema), courseController.create);
router.get("/", courseController.list);
router.get("/:id", validate(idParamSchema), courseController.getById);
router.patch("/:id", authorize(Role.FACULTY), validate(updateCourseSchema), courseController.update);
router.delete("/:id", authorize(Role.FACULTY), validate(idParamSchema), courseController.remove);

router.get("/:id/students", authorize(Role.FACULTY), validate(idParamSchema), courseController.listStudents);
router.post(
  "/:id/students",
  authorize(Role.FACULTY),
  validate(enrollStudentSchema),
  courseController.enrollStudent
);
router.delete(
  "/:id/students/:studentId",
  authorize(Role.FACULTY),
  v({ params: z.object({ id: z.string().uuid(), studentId: z.string().uuid() }) }),
  courseController.unenrollStudent
);

export default router;
