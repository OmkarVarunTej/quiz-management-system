import { prisma } from "../lib/prisma";
import { supabase, STORAGE_BUCKET } from "../lib/supabase";
import { ApiError } from "../utils/ApiError";
import { Messages } from "../constants/messages";
import { randomUUID } from "crypto";

interface OptionInput {
  id?: string;
  text: string;
  isCorrect: boolean;
}

export const questionService = {
  async assertCourseOwnership(courseId: string, facultyId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound(Messages.GENERIC.NOT_FOUND("Course"));
    if (course.facultyId !== facultyId) throw ApiError.forbidden("You do not own this course");
    return course;
  },

  async assertQuestionOwnership(questionId: string, facultyId: string) {
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw ApiError.notFound(Messages.GENERIC.NOT_FOUND("Question"));
    if (question.facultyId !== facultyId) throw ApiError.forbidden("You do not own this question");
    return question;
  },

  async create(
    facultyId: string,
    data: { courseId: string; text: string; marks: number; options: OptionInput[] }
  ) {
    await this.assertCourseOwnership(data.courseId, facultyId);

    return prisma.question.create({
      data: {
        facultyId,
        courseId: data.courseId,
        text: data.text,
        marks: data.marks,
        options: {
          create: data.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
        },
      },
      include: { options: true },
    });
  },

  async list(facultyId: string, courseId?: string) {
    return prisma.question.findMany({
      where: { facultyId, ...(courseId ? { courseId } : {}) },
      include: { options: true, course: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string, facultyId: string) {
    const question = await this.assertQuestionOwnership(id, facultyId);
    return prisma.question.findUnique({
      where: { id: question.id },
      include: { options: true },
    });
  },

  async update(
    id: string,
    facultyId: string,
    data: { text?: string; marks?: number; options?: OptionInput[] }
  ) {
    await this.assertQuestionOwnership(id, facultyId);

    return prisma.$transaction(async (tx) => {
      if (data.options) {
        await tx.option.deleteMany({ where: { questionId: id } });
        await tx.option.createMany({
          data: data.options.map((o) => ({ questionId: id, text: o.text, isCorrect: o.isCorrect })),
        });
      }
      return tx.question.update({
        where: { id },
        data: {
          ...(data.text ? { text: data.text } : {}),
          ...(data.marks ? { marks: data.marks } : {}),
        },
        include: { options: true },
      });
    });
  },

  async remove(id: string, facultyId: string) {
    await this.assertQuestionOwnership(id, facultyId);
    await prisma.question.delete({ where: { id } });
  },

  async uploadImage(id: string, facultyId: string, file: Express.Multer.File) {
    await this.assertQuestionOwnership(id, facultyId);

    const ext = file.originalname.split(".").pop();
    const path = `${facultyId}/${id}/${randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });
    if (error) throw ApiError.internal(`Failed to upload image: ${error.message}`);

    const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

    return prisma.question.update({
      where: { id },
      data: { imageUrl: publicUrlData.publicUrl },
      include: { options: true },
    });
  },
};
