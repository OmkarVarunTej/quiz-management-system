-- Track tab switching during a quiz attempt.
ALTER TABLE "student_quizzes" ADD COLUMN "tabSwitchCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "student_quizzes" ADD COLUMN "terminatedForTabSwitching" BOOLEAN NOT NULL DEFAULT false;

-- One row per tab switch, so faculty can see when each one happened.
CREATE TABLE "tab_switch_events" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "studentQuizId" TEXT NOT NULL,
    "questionId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tab_switch_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tab_switch_events_studentQuizId_idx" ON "tab_switch_events"("studentQuizId");

ALTER TABLE "tab_switch_events" ADD CONSTRAINT "tab_switch_events_studentQuizId_fkey" FOREIGN KEY ("studentQuizId") REFERENCES "student_quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
