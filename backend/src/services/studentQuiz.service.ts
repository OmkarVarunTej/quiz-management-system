import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { Messages } from "../constants/messages";
import { seededShuffle } from "../utils/shuffle";
import { QuizStatus, StudentQuizStatus, AnswerStatus } from "@prisma/client";

export const studentQuizService = {
  async assertQuizAccessible(quizId: string, studentId: string) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: true, quizQuestions: { include: { question: { include: { options: true } } } } },
    });
    if (!quiz) throw ApiError.notFound(Messages.GENERIC.NOT_FOUND("Quiz"));

    const enrolled = await prisma.course.findFirst({
      where: { id: quiz.courseId, students: { some: { id: studentId } } },
    });
    if (!enrolled) throw ApiError.forbidden("You are not enrolled in this course");

    if (quiz.status !== QuizStatus.PUBLISHED) throw ApiError.badRequest(Messages.QUIZ.NOT_PUBLISHED);

    const now = new Date();
    if (quiz.startTime && now < quiz.startTime) throw ApiError.badRequest("Quiz has not started yet");
    if (quiz.endTime && now > quiz.endTime) throw ApiError.badRequest("Quiz window has closed");

    return quiz;
  },

  /**
   * Starts (or resumes) a quiz attempt. On first start, generates a per-student
   * randomized question order and, for each question, a randomized option order -
   * both seeded deterministically so refreshing the page keeps the same order.
   */
  async start(quizId: string, studentId: string) {
    const quiz = await this.assertQuizAccessible(quizId, studentId);

    const existing = await prisma.studentQuiz.findUnique({
      where: { studentId_quizId: { studentId, quizId } },
    });

    if (existing) {
      if (existing.status === StudentQuizStatus.SUBMITTED || existing.status === StudentQuizStatus.AUTO_SUBMITTED) {
        throw ApiError.badRequest(Messages.QUIZ.ALREADY_SUBMITTED);
      }
      return existing;
    }

    const questionIds = quiz.quizQuestions.map((qq) => qq.questionId);
    const randomizedQuestionOrder = seededShuffle(questionIds, `${studentId}:${quizId}:questions`);

    const studentQuiz = await prisma.$transaction(async (tx) => {
      const sq = await tx.studentQuiz.create({
        data: {
          studentId,
          quizId,
          status: StudentQuizStatus.IN_PROGRESS,
          questionOrder: randomizedQuestionOrder,
          startedAt: new Date(),
        },
      });

      await tx.studentAnswer.createMany({
        data: quiz.quizQuestions.map((qq) => ({
          studentQuizId: sq.id,
          questionId: qq.questionId,
          optionOrder: seededShuffle(
            qq.question.options.map((o) => o.id),
            `${studentId}:${quizId}:${qq.questionId}`
          ),
          status: AnswerStatus.SKIPPED,
        })),
      });

      return sq;
    });

    return studentQuiz;
  },

  /** Returns the student's current session: question order, options (no correct-flag leaked), and saved answers. */
  async getSession(quizId: string, studentId: string) {
    const quiz = await this.assertQuizAccessible(quizId, studentId);

    const studentQuiz = await prisma.studentQuiz.findUnique({
      where: { studentId_quizId: { studentId, quizId } },
      include: { answers: true },
    });
    if (!studentQuiz) throw ApiError.badRequest(Messages.QUIZ.NOT_STARTED_YET);
    if (studentQuiz.status === StudentQuizStatus.SUBMITTED || studentQuiz.status === StudentQuizStatus.AUTO_SUBMITTED) {
      throw ApiError.badRequest(Messages.QUIZ.ALREADY_SUBMITTED);
    }

    const questionMap = new Map(quiz.quizQuestions.map((qq) => [qq.questionId, qq.question]));
    const questionOrder = studentQuiz.questionOrder as string[];

    const questions = questionOrder.map((qId) => {
      const question = questionMap.get(qId)!;
      const answer = studentQuiz.answers.find((a) => a.questionId === qId);
      const optionOrder = (answer?.optionOrder as string[]) || [];
      const optionMap = new Map(question.options.map((o) => [o.id, o]));

      return {
        id: question.id,
        text: question.text,
        imageUrl: question.imageUrl,
        marks: question.marks,
        options: optionOrder.map((oId) => ({ id: optionMap.get(oId)!.id, text: optionMap.get(oId)!.text })),
        selectedOptionId: answer?.selectedOptionId || null,
      };
    });

    const elapsedMs = studentQuiz.startedAt ? Date.now() - studentQuiz.startedAt.getTime() : 0;
    const remainingSeconds = Math.max(quiz.durationMinutes * 60 - Math.floor(elapsedMs / 1000), 0);

    return {
      studentQuizId: studentQuiz.id,
      quizId: quiz.id,
      title: quiz.title,
      durationMinutes: quiz.durationMinutes,
      remainingSeconds,
      status: studentQuiz.status,
      questions,
    };
  },

  /** Auto-save a single answer (or clear it by passing selectedOptionId: null). */
  async saveAnswer(
    quizId: string,
    studentId: string,
    questionId: string,
    selectedOptionId: string | null
  ) {
    const studentQuiz = await prisma.studentQuiz.findUnique({
      where: { studentId_quizId: { studentId, quizId } },
    });
    if (!studentQuiz) throw ApiError.badRequest(Messages.QUIZ.NOT_STARTED_YET);
    if (studentQuiz.status === StudentQuizStatus.SUBMITTED || studentQuiz.status === StudentQuizStatus.AUTO_SUBMITTED) {
      throw ApiError.badRequest(Messages.QUIZ.ALREADY_SUBMITTED);
    }

    if (selectedOptionId) {
      const option = await prisma.option.findUnique({ where: { id: selectedOptionId } });
      if (!option || option.questionId !== questionId) {
        throw ApiError.badRequest("Selected option does not belong to this question");
      }
    }

    return prisma.studentAnswer.update({
      where: { studentQuizId_questionId: { studentQuizId: studentQuiz.id, questionId } },
      data: {
        selectedOptionId,
        answeredAt: selectedOptionId ? new Date() : null,
      },
    });
  },

  /** Evaluates all answers, creates the Result row, and marks the attempt submitted. */
  async submit(quizId: string, studentId: string, autoSubmitted: boolean) {
    const studentQuiz = await prisma.studentQuiz.findUnique({
      where: { studentId_quizId: { studentId, quizId } },
      include: { answers: { include: { question: true, selectedOption: true } } },
    });
    if (!studentQuiz) throw ApiError.badRequest(Messages.QUIZ.NOT_STARTED_YET);
    if (studentQuiz.status === StudentQuizStatus.SUBMITTED || studentQuiz.status === StudentQuizStatus.AUTO_SUBMITTED) {
      throw ApiError.badRequest(Messages.QUIZ.ALREADY_SUBMITTED);
    }

    let obtainedMarks = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    const answerUpdates = studentQuiz.answers.map((answer) => {
      let status: AnswerStatus;
      let marksAwarded = 0;

      if (!answer.selectedOptionId) {
        status = AnswerStatus.SKIPPED;
        skippedCount++;
      } else if (answer.selectedOption?.isCorrect) {
        status = AnswerStatus.CORRECT;
        marksAwarded = answer.question.marks;
        obtainedMarks += marksAwarded;
        correctCount++;
      } else {
        status = AnswerStatus.WRONG;
        wrongCount++;
      }

      return { id: answer.id, status, marksAwarded };
    });

    const totalMarks = studentQuiz.answers.reduce((sum, a) => sum + a.question.marks, 0);

    return prisma.$transaction(async (tx) => {
      await Promise.all(
        answerUpdates.map((u) =>
          tx.studentAnswer.update({ where: { id: u.id }, data: { status: u.status, marksAwarded: u.marksAwarded } })
        )
      );

      const updatedStudentQuiz = await tx.studentQuiz.update({
        where: { id: studentQuiz.id },
        data: {
          status: autoSubmitted ? StudentQuizStatus.AUTO_SUBMITTED : StudentQuizStatus.SUBMITTED,
          submittedAt: new Date(),
          autoSubmitted,
        },
      });

      const result = await tx.result.create({
        data: {
          studentQuizId: studentQuiz.id,
          studentId,
          quizId,
          totalMarks,
          obtainedMarks,
          correctCount,
          wrongCount,
          skippedCount,
          published: false,
        },
      });

      return { studentQuiz: updatedStudentQuiz, result };
    });
  },
};
