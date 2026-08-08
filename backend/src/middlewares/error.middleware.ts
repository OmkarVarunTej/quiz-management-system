import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/apiResponse";
import { env } from "../config/env";

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Known, operational errors
  if (err instanceof ApiError) {
    return ApiResponse.error(res, err.statusCode, err.message, err.details);
  }

  // Prisma known request errors (unique constraint, FK violation, not found, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return ApiResponse.error(res, 409, `Duplicate value for field(s): ${err.meta?.target}`);
    }
    if (err.code === "P2025") {
      return ApiResponse.error(res, 404, "Record not found");
    }
    if (err.code === "P2003") {
      return ApiResponse.error(res, 400, "Invalid reference to a related record");
    }
  }

  // Multer / other errors with a statusCode
  const anyErr = err as { statusCode?: number; message?: string };

  console.error(`[ERROR] ${req.method} ${req.originalUrl} ->`, err);

  return ApiResponse.error(
    res,
    anyErr.statusCode || 500,
    anyErr.message || "Internal server error",
    env.NODE_ENV === "development" ? err : undefined
  );
};
