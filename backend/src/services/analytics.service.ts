import { prisma } from "../lib/prisma";
import { StudentQuizStatus } from "@prisma/client";
import { quizService } from "./quiz.service";

const average = (nums: number[]) => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);

export const analyticsService = {
  /**
   * Faculty: time analytics for one quiz - how long each student took overall,
   * how long they spent on every question, and per-question averages.
   * Only submitted attempts are included.
   */
  async getQuizAnalytics(quizId: string, facultyId: string) {
    await quizService.assertQuizOwnership(quizId, facultyId);

    const quiz = await prisma.quiz.findUniqueOrThrow({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        durationMinutes: true,
        totalMarks: true,
        quizQuestions: {
          orderBy: { order: "asc" },
          select: { questionId: true, question: { select: { text: true, marks: true } } },
        },
      },
    });

    // Questions are numbered in the order the faculty arranged them (students see a shuffled order).
    const questionNumber = new Map(quiz.quizQuestions.map((qq, i) => [qq.questionId, i + 1]));

    const attempts = await prisma.studentQuiz.findMany({
      where: {
        quizId,
        status: { in: [StudentQuizStatus.SUBMITTED, StudentQuizStatus.AUTO_SUBMITTED] },
      },
      include: {
        student: { select: { id: true, name: true, regNo: true } },
        result: { select: { obtainedMarks: true, totalMarks: true } },
        answers: { select: { questionId: true, timeSpentSeconds: true, status: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    const students = attempts.map((a) => {
      const totalSeconds =
        a.startedAt && a.submittedAt
          ? Math.max(Math.round((a.submittedAt.getTime() - a.startedAt.getTime()) / 1000), 0)
          : 0;

      const questionTimes = a.answers
        .map((ans) => ({
          questionId: ans.questionId,
          number: questionNumber.get(ans.questionId) ?? 0,
          seconds: ans.timeSpentSeconds,
          status: ans.status,
        }))
        .sort((x, y) => x.number - y.number);

      return {
        studentQuizId: a.id,
        student: a.student,
        status: a.status,
        autoSubmitted: a.autoSubmitted,
        tabSwitchCount: a.tabSwitchCount,
        terminatedForTabSwitching: a.terminatedForTabSwitching,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        totalSeconds,
        obtainedMarks: a.result?.obtainedMarks ?? 0,
        totalMarks: a.result?.totalMarks ?? quiz.totalMarks,
        questionTimes,
      };
    });

    const questions = quiz.quizQuestions.map((qq) => {
      // Only count attempts where time was actually recorded for this question.
      const times = students
        .map((s) => s.questionTimes.find((t) => t.questionId === qq.questionId)?.seconds ?? 0)
        .filter((sec) => sec > 0);

      return {
        questionId: qq.questionId,
        number: questionNumber.get(qq.questionId)!,
        text: qq.question.text,
        marks: qq.question.marks,
        attemptedBy: times.length,
        avgSeconds: average(times),
        minSeconds: times.length ? Math.min(...times) : 0,
        maxSeconds: times.length ? Math.max(...times) : 0,
      };
    });

    const totals = students.map((s) => s.totalSeconds);

    return {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        durationMinutes: quiz.durationMinutes,
        totalMarks: quiz.totalMarks,
        questionCount: quiz.quizQuestions.length,
      },
      summary: {
        attempts: students.length,
        avgTotalSeconds: average(totals),
        fastestSeconds: totals.length ? Math.min(...totals) : 0,
        slowestSeconds: totals.length ? Math.max(...totals) : 0,
      },
      questions,
      students,
    };
  },
};
