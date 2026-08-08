import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { HttpStatus } from "../constants/http-status";
import { questionService } from "../services/question.service";
import { ApiError } from "../utils/ApiError";
import { Messages } from "../constants/messages";

export const questionController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const question = await questionService.create(req.user!.id, req.body);
    return ApiResponse.success(res, HttpStatus.CREATED, Messages.GENERIC.CREATED("Question"), question);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const courseId = req.query.courseId as string | undefined;
    const questions = await questionService.list(req.user!.id, courseId);
    return ApiResponse.success(res, HttpStatus.OK, Messages.GENERIC.FETCHED("Questions"), questions);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const question = await questionService.getById(req.params.id, req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, Messages.GENERIC.FETCHED("Question"), question);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const question = await questionService.update(req.params.id, req.user!.id, req.body);
    return ApiResponse.success(res, HttpStatus.OK, Messages.GENERIC.UPDATED("Question"), question);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await questionService.remove(req.params.id, req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, Messages.GENERIC.DELETED("Question"), null);
  }),

  uploadImage: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest("No image file provided");
    const question = await questionService.uploadImage(req.params.id, req.user!.id, req.file);
    return ApiResponse.success(res, HttpStatus.OK, "Image uploaded successfully", question);
  }),
};
