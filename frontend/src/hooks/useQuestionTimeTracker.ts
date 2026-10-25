import { useCallback, useEffect, useRef } from "react";
import { studentQuizService } from "@/services/studentQuiz.service";

const FLUSH_INTERVAL_MS = 15_000;

/**
 * Measures how long the student spends on each question and sends it to the server.
 *
 * - Time is counted for the question currently on screen, only while the browser tab is visible.
 * - It is sent when the student changes question, when the tab is hidden, every 15 seconds,
 *   and when `flush()` is called (before submitting), so at most a few seconds are lost on a refresh.
 */
export function useQuestionTimeTracker(quizId: string | undefined, activeQuestionId: string | undefined) {
  const activeRef = useRef<string | undefined>(undefined);
  const sinceRef = useRef<number | null>(null); // when the current timing segment began (null = paused)
  const pendingMsRef = useRef<Record<string, number>>({}); // milliseconds not yet sent, per question
  const stoppedRef = useRef(false);

  /** Moves the time elapsed in the current segment into the pending totals and pauses timing. */
  const closeSegment = useCallback(() => {
    if (sinceRef.current !== null && activeRef.current) {
      const elapsed = Date.now() - sinceRef.current;
      pendingMsRef.current[activeRef.current] = (pendingMsRef.current[activeRef.current] ?? 0) + elapsed;
    }
    sinceRef.current = null;
  }, []);

  const resumeSegment = useCallback(() => {
    if (!stoppedRef.current && activeRef.current && sinceRef.current === null && document.visibilityState === "visible") {
      sinceRef.current = Date.now();
    }
  }, []);

  /** Sends whole seconds that are waiting; keeps the leftover milliseconds. Never throws. */
  const sendPending = useCallback(async () => {
    if (!quizId || stoppedRef.current) return;

    const entries: { questionId: string; seconds: number }[] = [];
    for (const [questionId, ms] of Object.entries(pendingMsRef.current)) {
      const seconds = Math.floor(ms / 1000);
      if (seconds >= 1) {
        entries.push({ questionId, seconds });
        pendingMsRef.current[questionId] = ms - seconds * 1000;
      }
    }
    if (!entries.length) return;

    try {
      await studentQuizService.recordTime(quizId, entries);
    } catch {
      // Put the time back so the next flush retries it.
      for (const e of entries) {
        pendingMsRef.current[e.questionId] = (pendingMsRef.current[e.questionId] ?? 0) + e.seconds * 1000;
      }
    }
  }, [quizId]);

  const flush = useCallback(async () => {
    closeSegment();
    const sending = sendPending();
    resumeSegment();
    await sending;
  }, [closeSegment, sendPending, resumeSegment]);

  /** Stops all tracking (call after the quiz is submitted). */
  const stop = useCallback(() => {
    closeSegment();
    pendingMsRef.current = {};
    stoppedRef.current = true;
  }, [closeSegment]);

  // The student moved to a different question: bank the previous one's time and start timing the new one.
  useEffect(() => {
    if (!quizId || !activeQuestionId) return;
    closeSegment();
    activeRef.current = activeQuestionId;
    resumeSegment();
    void sendPending();
  }, [quizId, activeQuestionId, closeSegment, resumeSegment, sendPending]);

  // Pause while the tab is in the background, resume when it comes back.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        closeSegment();
        void sendPending();
      } else {
        resumeSegment();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [closeSegment, resumeSegment, sendPending]);

  // Periodic save so little is lost if the page is refreshed or closed.
  useEffect(() => {
    const id = setInterval(() => void flush(), FLUSH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [flush]);

  // Leaving the page for any reason: send whatever is left.
  useEffect(() => {
    return () => {
      closeSegment();
      void sendPending();
    };
  }, [closeSegment, sendPending]);

  return { flush, stop };
}
