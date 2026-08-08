import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ListPlus, Send, Lock, BarChart3, Trash2, Clock, Award, HelpCircle } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageSpinner } from "@/components/ui/spinner";
import { useQuiz, usePublishQuiz, useCloseQuiz, useRemoveQuizQuestion } from "@/hooks/useQuizzes";
import { useToast } from "@/context/ToastContext";
import { QUIZ_STATUS_LABEL } from "@/constants";
import { formatDateTime } from "@/lib/utils";
import { AssignQuestionsDialog } from "../components/AssignQuestionsDialog";

const statusVariant: Record<string, "secondary" | "success" | "default"> = {
  DRAFT: "secondary",
  PUBLISHED: "success",
  CLOSED: "default",
};

export function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: quiz, isLoading, isError, refetch } = useQuiz(id);
  const [assignOpen, setAssignOpen] = useState(false);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [removingQuestionId, setRemovingQuestionId] = useState<string | null>(null);
  const publishQuiz = usePublishQuiz();
  const closeQuiz = useCloseQuiz();
  const removeQuestion = useRemoveQuizQuestion(id || "");
  const { toast } = useToast();

  if (isLoading) return <PageSpinner />;
  if (isError || !quiz) return <ErrorState onRetry={() => refetch()} />;

  const isDraft = quiz.status === "DRAFT";
  const questionCount = quiz.quizQuestions?.length ?? 0;

  const handlePublish = async () => {
    try {
      await publishQuiz.mutateAsync(quiz.id);
      toast({ title: "Quiz published", description: "Students can now take this quiz.", variant: "success" });
      setPublishConfirm(false);
    } catch (err) {
      toast({ title: "Could not publish quiz", description: (err as Error).message, variant: "error" });
    }
  };

  const handleClose = async () => {
    try {
      await closeQuiz.mutateAsync(quiz.id);
      toast({ title: "Quiz closed", variant: "success" });
      setCloseConfirm(false);
    } catch (err) {
      toast({ title: "Could not close quiz", description: (err as Error).message, variant: "error" });
    }
  };

  const handleRemoveQuestion = async () => {
    if (!removingQuestionId) return;
    try {
      await removeQuestion.mutateAsync(removingQuestionId);
      toast({ title: "Question removed", variant: "success" });
      setRemovingQuestionId(null);
    } catch (err) {
      toast({ title: "Could not remove question", description: (err as Error).message, variant: "error" });
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Quizzes", to: "/faculty/quizzes" }, { label: quiz.title }]} />
      <PageHeader
        title={quiz.title}
        description={quiz.description || undefined}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(`/faculty/quizzes/${quiz.id}/results`)}>
              <BarChart3 className="h-4 w-4" /> Results
            </Button>
            {isDraft && (
              <Button onClick={() => setPublishConfirm(true)} disabled={questionCount === 0}>
                <Send className="h-4 w-4" /> Publish
              </Button>
            )}
            {quiz.status === "PUBLISHED" && (
              <Button variant="destructive" onClick={() => setCloseConfirm(true)}>
                <Lock className="h-4 w-4" /> Close quiz
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Badge variant={statusVariant[quiz.status]}>{QUIZ_STATUS_LABEL[quiz.status]}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" /> {quiz.durationMinutes} min
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm">
            <Award className="h-4 w-4 text-muted-foreground" /> {quiz.totalMarks} marks
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm">
            <HelpCircle className="h-4 w-4 text-muted-foreground" /> {questionCount} questions
          </CardContent>
        </Card>
      </div>

      {(quiz.startTime || quiz.endTime) && (
        <p className="mb-6 text-sm text-muted-foreground">
          {quiz.startTime && <>Opens {formatDateTime(quiz.startTime)}</>}
          {quiz.startTime && quiz.endTime && " · "}
          {quiz.endTime && <>Closes {formatDateTime(quiz.endTime)}</>}
        </p>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Questions</CardTitle>
          {isDraft && (
            <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
              <ListPlus className="h-4 w-4" /> Manage questions
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {questionCount === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No questions assigned"
              description="Add questions from your question bank before publishing this quiz."
              actionLabel={isDraft ? "Manage questions" : undefined}
              onAction={isDraft ? () => setAssignOpen(true) : undefined}
            />
          ) : (
            <ol className="space-y-2">
              {quiz.quizQuestions
                ?.slice()
                .sort((a, b) => a.order - b.order)
                .map((qq, idx) => (
                  <li key={qq.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
                    <div className="flex gap-3">
                      <span className="text-sm font-semibold text-muted-foreground">{idx + 1}.</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{qq.question.text}</p>
                        <p className="text-xs text-muted-foreground">{qq.question.marks} marks · {qq.question.options.length} options</p>
                      </div>
                    </div>
                    {isDraft && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => setRemovingQuestionId(qq.question.id)}
                        aria-label="Remove question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </li>
                ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <AssignQuestionsDialog open={assignOpen} onOpenChange={setAssignOpen} quiz={quiz} />

      <ConfirmDialog
        open={publishConfirm}
        onOpenChange={setPublishConfirm}
        title="Publish this quiz?"
        description="Once published, students in this course will be able to take the quiz and its questions can no longer be edited."
        confirmLabel="Publish"
        isLoading={publishQuiz.isPending}
        onConfirm={handlePublish}
      />
      <ConfirmDialog
        open={closeConfirm}
        onOpenChange={setCloseConfirm}
        title="Close this quiz?"
        description="Students will no longer be able to start or continue this quiz."
        confirmLabel="Close quiz"
        variant="destructive"
        isLoading={closeQuiz.isPending}
        onConfirm={handleClose}
      />
      <ConfirmDialog
        open={!!removingQuestionId}
        onOpenChange={(o) => !o && setRemovingQuestionId(null)}
        title="Remove this question from the quiz?"
        confirmLabel="Remove"
        variant="destructive"
        isLoading={removeQuestion.isPending}
        onConfirm={handleRemoveQuestion}
      />
    </div>
  );
}
