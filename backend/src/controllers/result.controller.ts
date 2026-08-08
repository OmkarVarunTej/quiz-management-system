import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { HttpStatus } from "../constants/http-status";
import { resultService } from "../services/result.service";

export const resultController = {
  publishForQuiz: asyncHandler(async (req: Request, res: Response) => {
    const outcome = await resultService.publishForQuiz(req.params.quizId, req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, "Results published successfully", outcome);
  }),

  listForQuiz: asyncHandler(async (req: Request, res: Response) => {
    const { regNo, sort } = req.query as { regNo?: string; sort?: "asc" | "desc" };
    const results = await resultService.listForQuizAsFaculty(req.params.quizId, req.user!.id, regNo, sort);
    return ApiResponse.success(res, HttpStatus.OK, "Results fetched", results);
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const results = await resultService.listForStudent(req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, "Your results fetched", results);
  }),

  getDetail: asyncHandler(async (req: Request, res: Response) => {
    const detail = await resultService.getDetailForStudent(req.params.studentQuizId, req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, "Result detail fetched", detail);
  }),
};
