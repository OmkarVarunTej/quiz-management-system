-- Track how long (in seconds) a student spent on each question.
ALTER TABLE "student_answers" ADD COLUMN "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0;
