import { Response } from "express";

interface SuccessPayload<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

interface ErrorPayload {
  success: false;
  message: string;
  errors?: unknown;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    statusCode: number,
    message: string,
    data: T,
    meta?: Record<string, unknown>
  ) {
    const payload: SuccessPayload<T> = { success: true, message, data };
    if (meta) payload.meta = meta;
    return res.status(statusCode).json(payload);
  }

  static error(res: Response, statusCode: number, message: string, errors?: unknown) {
    const payload: ErrorPayload = { success: false, message };
    if (errors) payload.errors = errors;
    return res.status(statusCode).json(payload);
  }
}
