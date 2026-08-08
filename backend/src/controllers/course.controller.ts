import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { HttpStatus } from "../constants/http-status";
import { courseService } from "../services/course.service";
import { Messages } from "../constants/messages";
import { Role } from "../constants/roles";

export const courseController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { name, code } = req.body;
    const course = await courseService.create(req.user!.id, name, code);
    return ApiResponse.success(res, HttpStatus.CREATED, Messages.GENERIC.CREATED("Course"), course);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const courses =
      req.user!.role === Role.FACULTY
        ? await courseService.listForFaculty(req.user!.id)
        : await courseService.listForStudent(req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, Messages.GENERIC.FETCHED("Courses"), courses);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.getById(req.params.id);
    return ApiResponse.success(res, HttpStatus.OK, Messages.GENERIC.FETCHED("Course"), course);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.update(req.params.id, req.user!.id, req.body);
    return ApiResponse.success(res, HttpStatus.OK, Messages.GENERIC.UPDATED("Course"), course);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await courseService.remove(req.params.id, req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, Messages.GENERIC.DELETED("Course"), null);
  }),

  enrollStudent: asyncHandler(async (req: Request, res: Response) => {
    const student = await courseService.enrollStudent(req.params.id, req.user!.id, req.body.regNo);
    return ApiResponse.success(res, HttpStatus.OK, "Student enrolled successfully", student);
  }),

  unenrollStudent: asyncHandler(async (req: Request, res: Response) => {
    await courseService.unenrollStudent(req.params.id, req.user!.id, req.params.studentId);
    return ApiResponse.success(res, HttpStatus.OK, "Student unenrolled successfully", null);
  }),

  listStudents: asyncHandler(async (req: Request, res: Response) => {
    const students = await courseService.listStudents(req.params.id, req.user!.id);
    return ApiResponse.success(res, HttpStatus.OK, Messages.GENERIC.FETCHED("Students"), students);
  }),
};
