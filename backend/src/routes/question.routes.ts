import { Router } from "express";
import { questionController } from "../controllers/question.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { upload, uploadPdf } from "../middlewares/upload.middleware";
import { Role } from "../constants/roles";
import {
  createQuestionSchema,
  updateQuestionSchema,
  idParamSchema,
  listQuestionsQuerySchema,
  confirmPdfImportSchema,
} from "../validators/question.validator";

const router = Router();

router.use(authenticate, authorize(Role.FACULTY));

router.post("/import-pdf/preview", uploadPdf.single("file"), questionController.previewPdfImport);
router.post("/import-pdf/confirm", validate(confirmPdfImportSchema), questionController.confirmPdfImport);

router.post("/", validate(createQuestionSchema), questionController.create);
router.get("/", validate(listQuestionsQuerySchema), questionController.list);
router.get("/:id", validate(idParamSchema), questionController.getById);
router.patch("/:id", validate(updateQuestionSchema), questionController.update);
router.delete("/:id", validate(idParamSchema), questionController.remove);
router.post("/:id/image", validate(idParamSchema), upload.single("image"), questionController.uploadImage);


export default router;
