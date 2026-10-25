import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { HttpStatus } from "../constants/http-status";
import { analyticsService } from "../services/analytics.service";

export const analyticsController = {
  quizAnalytics: asyncHandler(async (req: Request, res: Response) => {
    const analytics = await analyticsService.getQuizAnalytics(req.params.quizId, req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, "Quiz analytics fetched", analytics);
  }),
};
