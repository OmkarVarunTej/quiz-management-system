import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { HttpStatus } from "../constants/http-status";
import { authService } from "../services/auth.service";

export const authController = {
  registerFaculty: asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const result = await authService.registerFaculty(name, email, password);
    return ApiResponse.success(res, HttpStatus.CREATED, "Faculty registered successfully", result);
  }),

  loginFaculty: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.loginFaculty(email, password);
    return ApiResponse.success(res, HttpStatus.OK, "Login successful", result);
  }),

  registerStudent: asyncHandler(async (req: Request, res: Response) => {
    const { name, regNo, email, password } = req.body;
    const result = await authService.registerStudent(name, regNo, email, password);
    return ApiResponse.success(res, HttpStatus.CREATED, "Student registered successfully", result);
  }),

  loginStudent: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.loginStudent(email, password);
    return ApiResponse.success(res, HttpStatus.OK, "Login successful", result);
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!.id, req.user!.role);
    return ApiResponse.success(res, HttpStatus.OK, "Current user fetched", user);
  }),
};
