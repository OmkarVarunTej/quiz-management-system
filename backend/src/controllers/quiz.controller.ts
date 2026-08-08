import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { HttpStatus } from "../constants/http-status";
import { quizService } from "../services/quiz.service";
import { Messages } from "../constants/messages";
import { Role } from "../constants/roles";

export const quizController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const quiz = await quizService.create(req.user!.id, req.body);
    return ApiResponse.success(res, HttpStatus.CREATED, Messages.GENERIC.CREATED("Quiz"), quiz);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const courseId = req.query.courseId as string | undefined;
    const quizzes =
      req.user!.role === Role.FACULTY
        ? await quizService.list(req.user!.id, courseId)
        : await quizService.listAvailableForStudent(req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, Messages.GENERIC.FETCHED("Quizzes"), quizzes);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const quiz = await quizService.getById(req.params.id, req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, Messages.GENERIC.FETCHED("Quiz"), quiz);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const quiz = await quizService.update(req.params.id, req.user!.id, req.body);
    return ApiResponse.success(res, HttpStatus.OK, Messages.GENERIC.UPDATED("Quiz"), quiz);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await quizService.remove(req.params.id, req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, Messages.GENERIC.DELETED("Quiz"), null);
  }),

  assignQuestions: asyncHandler(async (req: Request, res: Response) => {
    const quiz = await quizService.assignQuestions(req.params.id, req.user!.id, req.body.questionIds);
    return ApiResponse.success(res, HttpStatus.OK, "Questions assigned successfully", quiz);
  }),

  removeQuestion: asyncHandler(async (req: Request, res: Response) => {
    const quiz = await quizService.removeQuestion(req.params.id, req.user!.id, req.params.questionId);
    return ApiResponse.success(res, HttpStatus.OK, "Question removed from quiz", quiz);
  }),

  publish: asyncHandler(async (req: Request, res: Response) => {
    const quiz = await quizService.publish(req.params.id, req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, "Quiz published successfully", quiz);
  }),

  close: asyncHandler(async (req: Request, res: Response) => {
    const quiz = await quizService.close(req.params.id, req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, "Quiz closed successfully", quiz);
  }),
};
