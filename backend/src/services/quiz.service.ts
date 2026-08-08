import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { Messages } from "../constants/messages";
import { QuizStatus } from "@prisma/client";

export const quizService = {
  async assertCourseOwnership(courseId: string, facultyId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound(Messages.GENERIC.NOT_FOUND("Course"));
    if (course.facultyId !== facultyId) throw ApiError.forbidden("You do not own this course");
    return course;
  },

  async assertQuizOwnership(quizId: string, facultyId: string) {
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { course: true } });
    if (!quiz) throw ApiError.notFound(Messages.GENERIC.NOT_FOUND("Quiz"));
    if (quiz.course.facultyId !== facultyId) throw ApiError.forbidden("You do not own this quiz");
    return quiz;
  },

  async create(
    facultyId: string,
    data: {
      courseId: string;
      title: string;
      description?: string;
      durationMinutes: number;
      startTime?: Date;
      endTime?: Date;
    }
  ) {
    await this.assertCourseOwnership(data.courseId, facultyId);
    return prisma.quiz.create({ data: { ...data, status: QuizStatus.DRAFT } });
  },

  async list(facultyId: string, courseId?: string) {
    return prisma.quiz.findMany({
      where: { course: { facultyId }, ...(courseId ? { courseId } : {}) },
      include: { _count: { select: { quizQuestions: true, studentQuizzes: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async listAvailableForStudent(studentId: string) {
    const now = new Date();
    return prisma.quiz.findMany({
      where: {
        status: QuizStatus.PUBLISHED,
        course: { students: { some: { id: studentId } } },
        OR: [{ endTime: null }, { endTime: { gte: now } }],
      },
      include: {
        course: { select: { id: true, name: true, code: true } },
        studentQuizzes: { where: { studentId }, select: { status: true, id: true } },
      },
      orderBy: { startTime: "asc" },
    });
  },

  async getById(id: string, facultyId: string) {
    await this.assertQuizOwnership(id, facultyId);
    return prisma.quiz.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true, code: true } },
        quizQuestions: {
          include: { question: { include: { options: true } } },
          orderBy: { order: "asc" },
        },
      },
    });
  },

  async update(
    id: string,
    facultyId: string,
    data: Partial<{
      title: string;
      description: string;
      durationMinutes: number;
      startTime: Date;
      endTime: Date;
    }>
  ) {
    const quiz = await this.assertQuizOwnership(id, facultyId);
    if (quiz.status !== QuizStatus.DRAFT) {
      throw ApiError.badRequest("Only draft quizzes can be edited");
    }
    return prisma.quiz.update({ where: { id }, data });
  },

  async remove(id: string, facultyId: string) {
    await this.assertQuizOwnership(id, facultyId);
    await prisma.quiz.delete({ where: { id } });
  },

  async assignQuestions(id: string, facultyId: string, questionIds: string[]) {
    const quiz = await this.assertQuizOwnership(id, facultyId);
    if (quiz.status !== QuizStatus.DRAFT) {
      throw ApiError.badRequest("Cannot modify questions of a published/closed quiz");
    }

    const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });
    if (questions.length !== questionIds.length) {
      throw ApiError.badRequest("One or more questions were not found");
    }
    const invalidCourse = questions.some((q) => q.courseId !== quiz.courseId);
    if (invalidCourse) {
      throw ApiError.badRequest("All questions must belong to the quiz's course");
    }

    return prisma.$transaction(async (tx) => {
      await tx.quizQuestion.deleteMany({ where: { quizId: id } });
      await tx.quizQuestion.createMany({
        data: questionIds.map((questionId, index) => ({ quizId: id, questionId, order: index })),
      });
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      return tx.quiz.update({
        where: { id },
        data: { totalMarks },
        include: { quizQuestions: { include: { question: { include: { options: true } } } } },
      });
    });
  },

  async removeQuestion(id: string, facultyId: string, questionId: string) {
    const quiz = await this.assertQuizOwnership(id, facultyId);
    if (quiz.status !== QuizStatus.DRAFT) {
      throw ApiError.badRequest("Cannot modify questions of a published/closed quiz");
    }
    await prisma.quizQuestion.deleteMany({ where: { quizId: id, questionId } });

    const remaining = await prisma.question.findMany({
      where: { quizQuestions: { some: { quizId: id } } },
    });
    const totalMarks = remaining.reduce((sum, q) => sum + q.marks, 0);
    return prisma.quiz.update({ where: { id }, data: { totalMarks } });
  },

  async publish(id: string, facultyId: string) {
    const quiz = await this.assertQuizOwnership(id, facultyId);
    const questionCount = await prisma.quizQuestion.count({ where: { quizId: id } });
    if (questionCount === 0) {
      throw ApiError.badRequest("Cannot publish a quiz with no questions");
    }
    if (quiz.status !== QuizStatus.DRAFT) {
      throw ApiError.badRequest("Only draft quizzes can be published");
    }
    return prisma.quiz.update({ where: { id }, data: { status: QuizStatus.PUBLISHED } });
  },

  async close(id: string, facultyId: string) {
    await this.assertQuizOwnership(id, facultyId);
    return prisma.quiz.update({ where: { id }, data: { status: QuizStatus.CLOSED } });
  },
};
