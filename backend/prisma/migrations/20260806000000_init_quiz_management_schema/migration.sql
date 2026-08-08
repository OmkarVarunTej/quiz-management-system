-- Enums
CREATE TYPE "QuizStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');
CREATE TYPE "StudentQuizStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED');
CREATE TYPE "AnswerStatus" AS ENUM ('CORRECT', 'WRONG', 'SKIPPED');

CREATE TABLE "faculties" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "faculties_email_idx" ON "faculties"("email");

CREATE TABLE "students" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "regNo" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "students_regNo_idx" ON "students"("regNo");
CREATE INDEX "students_email_idx" ON "students"("email");

CREATE TABLE "courses" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL UNIQUE,
  "facultyId" TEXT NOT NULL REFERENCES "faculties"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "courses_facultyId_idx" ON "courses"("facultyId");

CREATE TABLE "_CourseStudents" (
  "A" TEXT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "students"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "_CourseStudents_AB_unique" ON "_CourseStudents"("A", "B");
CREATE INDEX "_CourseStudents_B_index" ON "_CourseStudents"("B");

CREATE TABLE "quizzes" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "courseId" TEXT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "durationMinutes" INTEGER NOT NULL,
  "totalMarks" INTEGER NOT NULL DEFAULT 0,
  "status" "QuizStatus" NOT NULL DEFAULT 'DRAFT',
  "startTime" TIMESTAMP(3),
  "endTime" TIMESTAMP(3),
  "resultsPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "quizzes_courseId_idx" ON "quizzes"("courseId");
CREATE INDEX "quizzes_status_idx" ON "quizzes"("status");

CREATE TABLE "questions" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "facultyId" TEXT NOT NULL REFERENCES "faculties"("id") ON DELETE CASCADE,
  "courseId" TEXT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "text" TEXT NOT NULL,
  "imageUrl" TEXT,
  "marks" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "questions_facultyId_idx" ON "questions"("facultyId");
CREATE INDEX "questions_courseId_idx" ON "questions"("courseId");

CREATE TABLE "options" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "questionId" TEXT NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
  "text" TEXT NOT NULL,
  "isCorrect" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX "options_questionId_idx" ON "options"("questionId");

CREATE TABLE "quiz_questions" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "quizId" TEXT NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE,
  "questionId" TEXT NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  UNIQUE ("quizId", "questionId")
);
CREATE INDEX "quiz_questions_quizId_idx" ON "quiz_questions"("quizId");
CREATE INDEX "quiz_questions_questionId_idx" ON "quiz_questions"("questionId");

CREATE TABLE "student_quizzes" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "studentId" TEXT NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
  "quizId" TEXT NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE,
  "status" "StudentQuizStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "questionOrder" JSONB NOT NULL,
  "startedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "autoSubmitted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("studentId", "quizId")
);
CREATE INDEX "student_quizzes_studentId_idx" ON "student_quizzes"("studentId");
CREATE INDEX "student_quizzes_quizId_idx" ON "student_quizzes"("quizId");

CREATE TABLE "student_answers" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "studentQuizId" TEXT NOT NULL REFERENCES "student_quizzes"("id") ON DELETE CASCADE,
  "questionId" TEXT NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
  "selectedOptionId" TEXT REFERENCES "options"("id") ON DELETE SET NULL,
  "optionOrder" JSONB NOT NULL,
  "status" "AnswerStatus" NOT NULL DEFAULT 'SKIPPED',
  "marksAwarded" INTEGER NOT NULL DEFAULT 0,
  "answeredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("studentQuizId", "questionId")
);
CREATE INDEX "student_answers_studentQuizId_idx" ON "student_answers"("studentQuizId");
CREATE INDEX "student_answers_questionId_idx" ON "student_answers"("questionId");

CREATE TABLE "results" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "studentQuizId" TEXT NOT NULL UNIQUE REFERENCES "student_quizzes"("id") ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
  "quizId" TEXT NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE,
  "totalMarks" INTEGER NOT NULL,
  "obtainedMarks" INTEGER NOT NULL,
  "correctCount" INTEGER NOT NULL,
  "wrongCount" INTEGER NOT NULL,
  "skippedCount" INTEGER NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "results_studentId_idx" ON "results"("studentId");
CREATE INDEX "results_quizId_idx" ON "results"("quizId");
CREATE INDEX "results_published_idx" ON "results"("published");
