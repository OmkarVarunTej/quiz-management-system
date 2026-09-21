import multer from "multer";
import { ApiError } from "../utils/ApiError";

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.mimetype)) {
    return cb(ApiError.badRequest("Only image files (jpeg, png, webp, gif) are allowed") as unknown as Error);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

const pdfFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const isPdfMime = file.mimetype === "application/pdf" || file.mimetype === "application/x-pdf";
  const isPdfExt = file.originalname.toLowerCase().endsWith(".pdf");

  if (!isPdfMime && !isPdfExt) {
    return cb(ApiError.badRequest("Only PDF files (.pdf) are allowed") as unknown as Error);
  }
  cb(null, true);
};

export const uploadPdf = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: pdfFilter,
});

