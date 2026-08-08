import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { HttpStatus } from "../constants/http-status";
import { studentQuizService } from "../services/studentQuiz.service";
import { quizService } from "../services/quiz.service";

export const studentQuizController = {
  listAvailable: asyncHandler(async (req: Request, res: Response) => {
    const quizzes = await quizService.listAvailableForStudent(req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, "Available quizzes fetched", quizzes);
  }),

  start: asyncHandler(async (req: Request, res: Response) => {
    const attempt = await studentQuizService.start(req.params.quizId, req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, "Quiz started", attempt);
  }),

  getSession: asyncHandler(async (req: Request, res: Response) => {
    const session = await studentQuizService.getSession(req.params.quizId, req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, "Session fetched", session);
  }),

  saveAnswer: asyncHandler(async (req: Request, res: Response) => {
    const { questionId, selectedOptionId } = req.body;
    const answer = await studentQuizService.saveAnswer(
      req.params.quizId,
      req.user!.id,
      questionId,
      selectedOptionId
    );
    return ApiResponse.success(res, HttpStatus.OK, "Answer saved", answer);
  }),

  submit: asyncHandler(async (req: Request, res: Response) => {
    const { autoSubmitted } = req.body;
    const outcome = await studentQuizService.submit(req.params.quizId, req.user!.id, !!autoSubmitted);
    return ApiResponse.success(res, HttpStatus.OK, "Quiz submitted successfully", outcome);
  }),
};
