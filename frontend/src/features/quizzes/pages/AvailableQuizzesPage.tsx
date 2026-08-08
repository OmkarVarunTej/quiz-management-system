import { Link } from "react-router-dom";
import { PlayCircle, ClipboardCheck, Clock, Award } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailableQuizzes } from "@/hooks/useStudentQuiz";
import { STUDENT_QUIZ_STATUS_LABEL } from "@/constants";
import { formatDateTime } from "@/lib/utils";

export function AvailableQuizzesPage() {
  const { data: quizzes, isLoading, isError, refetch } = useAvailableQuizzes();

  return (
    <div>
      <PageHeader title="Available Quizzes" description="Quizzes published for the courses you're enrolled in." />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !quizzes?.length ? (
        <EmptyState icon={ClipboardCheck} title="No quizzes available" description="Your faculty hasn't published any quizzes for your courses yet." />
      ) : (
        <div className="space-y-3">
          {quizzes.map((q) => {
            const status = q.studentQuizzes?.[0]?.status || "NOT_STARTED";
            const submitted = status === "SUBMITTED" || status === "AUTO_SUBMITTED";
            return (
              <Card key={q.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{q.course?.code}</Badge>
                      <Badge variant={submitted ? "success" : "secondary"}>{STUDENT_QUIZ_STATUS_LABEL[status]}</Badge>
                    </div>
                    <p className="font-medium text-foreground">{q.title}</p>
                    {q.description && <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{q.description}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {q.durationMinutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" /> {q.totalMarks} marks
                      </span>
                      {q.endTime && <span>Closes {formatDateTime(q.endTime)}</span>}
                    </div>
                  </div>
                  <Button size="sm" asChild disabled={submitted} className="shrink-0 self-end sm:self-center">
                    <Link to={`/student/quizzes/${q.id}/take`}>
                      <PlayCircle className="h-4 w-4" /> {submitted ? "Submitted" : status === "IN_PROGRESS" ? "Resume" : "Start Quiz"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
