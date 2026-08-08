import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { Messages } from "../constants/messages";
import { quizService } from "./quiz.service";

export const resultService = {
  /** Faculty: publish all results for a quiz at once. */
  async publishForQuiz(quizId: string, facultyId: string) {
    await quizService.assertQuizOwnership(quizId, facultyId);

    const { count } = await prisma.result.updateMany({
      where: { quizId, published: false },
      data: { published: true, publishedAt: new Date() },
    });

    await prisma.quiz.update({ where: { id: quizId }, data: { resultsPublished: true } });

    return { publishedCount: count };
  },

  /** Faculty: view all results for a quiz, optionally searched by regNo, sorted by marks. */
  async listForQuizAsFaculty(quizId: string, facultyId: string, regNo?: string, sort: "asc" | "desc" = "asc") {
    await quizService.assertQuizOwnership(quizId, facultyId);

    return prisma.result.findMany({
      where: {
        quizId,
        ...(regNo ? { student: { regNo: { contains: regNo, mode: "insensitive" } } } : {}),
      },
      include: { student: { select: { id: true, name: true, regNo: true, email: true } } },
      orderBy: { obtainedMarks: sort },
    });
  },

  /** Student: list own published results. */
  async listForStudent(studentId: string) {
    return prisma.result.findMany({
      where: { studentId, published: true },
      include: { quiz: { select: { id: true, title: true, totalMarks: true } } },
      orderBy: { publishedAt: "desc" },
    });
  },

  /** Student: view marks + correct answers for one attempt, only if published. */
  async getDetailForStudent(studentQuizId: string, studentId: string) {
    const result = await prisma.result.findUnique({
      where: { studentQuizId },
      include: {
        quiz: { select: { id: true, title: true, totalMarks: true } },
        studentQuiz: {
          include: {
            answers: {
              include: {
                question: { include: { options: true } },
                selectedOption: true,
              },
            },
          },
        },
      },
    });
    if (!result) throw ApiError.notFound(Messages.GENERIC.NOT_FOUND("Result"));
    if (result.studentId !== studentId) throw ApiError.forbidden("This result does not belong to you");
    if (!result.published) throw ApiError.badRequest(Messages.QUIZ.RESULTS_NOT_PUBLISHED);

    return {
      quiz: result.quiz,
      totalMarks: result.totalMarks,
      obtainedMarks: result.obtainedMarks,
      correctCount: result.correctCount,
      wrongCount: result.wrongCount,
      skippedCount: result.skippedCount,
      answers: result.studentQuiz.answers.map((a) => ({
        question: a.question.text,
        marks: a.question.marks,
        marksAwarded: a.marksAwarded,
        status: a.status,
        selectedOption: a.selectedOption?.text || null,
        correctOption: a.question.options.find((o) => o.isCorrect)?.text || null,
        options: a.question.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
      })),
    };
  },
};
