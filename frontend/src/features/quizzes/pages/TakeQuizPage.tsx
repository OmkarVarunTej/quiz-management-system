import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, ChevronRight, BadgeCheck, CloudUpload, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useStartQuiz, useQuizSession, useSaveAnswer, useSubmitQuiz } from "@/hooks/useStudentQuiz";
import { useToast } from "@/context/ToastContext";
import { QuizTimer } from "../components/QuizTimer";
import { QuestionPalette } from "../components/QuestionPalette";
import { cn } from "@/lib/utils";

export function TakeQuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const startQuiz = useStartQuiz();
  const [started, setStarted] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) return;
    startQuiz.mutate(quizId, {
      onSuccess: () => setStarted(true),
      onError: (err) => setStartError((err as Error).message),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const { data: session, isLoading, isError, refetch } = useQuizSession(quizId, { enabled: started });
  const saveAnswer = useSaveAnswer(quizId || "");
  const submitQuiz = useSubmitQuiz(quizId || "");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string | null>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (session) {
      const initial: Record<string, string | null> = {};
      session.questions.forEach((q) => {
        initial[q.id] = q.selectedOptionId;
      });
      setLocalAnswers((prev) => ({ ...initial, ...prev }));
    }
  }, [session]);

  // Warn before leaving the page while the quiz is in progress.
  useEffect(() => {
    if (!started || hasSubmittedRef.current) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [started]);

  const handleSubmit = useCallback(
    async (autoSubmitted: boolean) => {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;
      try {
        await submitQuiz.mutateAsync(autoSubmitted);
        toast({
          title: autoSubmitted ? "Time's up — quiz auto-submitted" : "Quiz submitted successfully",
          variant: autoSubmitted ? "info" : "success",
        });
        navigate("/student/quizzes", { replace: true });
      } catch (err) {
        hasSubmittedRef.current = false;
        toast({ title: "Could not submit quiz", description: (err as Error).message, variant: "error" });
      }
    },
    [submitQuiz, toast, navigate]
  );

  const handleSelect = (questionId: string, optionId: string) => {
    const next = localAnswers[questionId] === optionId ? null : optionId;
    setLocalAnswers((prev) => ({ ...prev, [questionId]: next }));
    setSaveStatus("saving");
    saveAnswer.mutate(
      { questionId, selectedOptionId: next },
      {
        onSuccess: () => setSaveStatus("saved"),
        onError: () => setSaveStatus("idle"),
      }
    );
  };

  const answeredCount = useMemo(() => Object.values(localAnswers).filter(Boolean).length, [localAnswers]);

  if (startError) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <ErrorState title="Can't start this quiz" description={startError} />
      </div>
    );
  }

  if (!started || isLoading) return <PageSpinner />;
  if (isError || !session) return <ErrorState onRetry={() => refetch()} />;

  const question = session.questions[currentIndex];
  const isLast = currentIndex === session.questions.length - 1;

  return (
    <div className="-mx-4 -my-6 min-h-screen bg-secondary/10 px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-semibold text-foreground">{session.title}</h1>
          <p className="text-xs text-muted-foreground">
            Question {currentIndex + 1} of {session.questions.length} · {answeredCount} answered
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {saveStatus === "saving" ? (
              <>
                <CloudUpload className="h-3.5 w-3.5 animate-pulse" /> Saving...
              </>
            ) : saveStatus === "saved" ? (
              <>
                <BadgeCheck className="h-3.5 w-3.5 text-success" /> Saved
              </>
            ) : null}
          </span>
          <QuizTimer initialSeconds={session.remainingSeconds} onExpire={() => handleSubmit(true)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <p className="text-base font-medium leading-relaxed text-foreground">{question.text}</p>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {question.marks} {question.marks === 1 ? "mark" : "marks"}
                </span>
                <button
                  onClick={() =>
                    setFlagged((prev) => {
                      const next = new Set(prev);
                      next.has(question.id) ? next.delete(question.id) : next.add(question.id);
                      return next;
                    })
                  }
                  className={cn(
                    "rounded-md border p-1.5 transition-colors",
                    flagged.has(question.id) ? "border-warning/40 bg-warning/10 text-warning-foreground" : "border-border text-muted-foreground hover:bg-secondary"
                  )}
                  aria-label="Flag question for review"
                  title="Flag for review"
                >
                  <Flag className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {question.imageUrl && (
              <img src={question.imageUrl} alt="Question illustration" className="mb-4 max-h-64 rounded-md border border-border object-contain" />
            )}

            <div className="space-y-2.5" role="radiogroup" aria-label="Answer options">
              {question.options.map((opt, idx) => {
                const isSelected = localAnswers[question.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelect(question.id, opt.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
                      )}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-foreground">{opt.text}</span>
                    {isSelected && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Button variant="outline" onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))} disabled={currentIndex === 0}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              {isLast ? (
                <Button onClick={() => setSubmitConfirm(true)}>Submit quiz</Button>
              ) : (
                <Button onClick={() => setCurrentIndex((i) => Math.min(i + 1, session.questions.length - 1))}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Question palette</p>
              <QuestionPalette
                count={session.questions.length}
                currentIndex={currentIndex}
                isAnswered={(idx) => !!localAnswers[session.questions[idx].id]}
                onNavigate={setCurrentIndex}
              />
            </CardContent>
          </Card>
          <Button variant="secondary" className="w-full" onClick={() => setSubmitConfirm(true)}>
            Submit quiz
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={submitConfirm}
        onOpenChange={setSubmitConfirm}
        title="Submit quiz?"
        description={`You've answered ${answeredCount} of ${session.questions.length} questions. Once submitted, you cannot make further changes.`}
        confirmLabel="Submit"
        isLoading={submitQuiz.isPending}
        onConfirm={() => handleSubmit(false)}
      />
    </div>
  );
}
