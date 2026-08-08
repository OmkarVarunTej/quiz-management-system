import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
