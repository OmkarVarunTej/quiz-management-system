import { Link } from "react-router-dom";
import { ClipboardCheck, Award, ArrowRight, PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useAvailableQuizzes } from "@/hooks/useStudentQuiz";
import { useMyResults } from "@/hooks/useResults";
import { STUDENT_QUIZ_STATUS_LABEL } from "@/constants";

export function StudentDashboardPage() {
  const { user } = useAuth();
  const { data: quizzes, isLoading: quizzesLoading } = useAvailableQuizzes();
  const { data: results, isLoading: resultsLoading } = useMyResults();

  const pending = quizzes?.filter((q) => !q.studentQuizzes?.[0] || q.studentQuizzes[0].status === "NOT_STARTED") || [];

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name?.split(" ")[0] || "Student"}`} description="Track your quizzes and results here." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Available quizzes</p>
              {quizzesLoading ? <Skeleton className="mt-1 h-7 w-10" /> : <p className="text-2xl font-bold text-foreground">{quizzes?.length ?? 0}</p>}
            </div>
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <ClipboardCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Published results</p>
              {resultsLoading ? <Skeleton className="mt-1 h-7 w-10" /> : <p className="text-2xl font-bold text-foreground">{results?.length ?? 0}</p>}
            </div>
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Available quizzes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/student/quizzes">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {quizzesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !pending.length ? (
            <EmptyState icon={ClipboardCheck} title="No quizzes to take right now" description="Check back later, or ask your faculty about upcoming assessments." />
          ) : (
            <div className="divide-y divide-border">
              {pending.slice(0, 5).map((q) => {
                const status = q.studentQuizzes?.[0]?.status || "NOT_STARTED";
                return (
                  <div key={q.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{q.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.course?.name} · {q.durationMinutes} min · {q.totalMarks} marks
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{STUDENT_QUIZ_STATUS_LABEL[status]}</Badge>
                      <Button size="sm" asChild>
                        <Link to={`/student/quizzes/${q.id}/take`}>
                          <PlayCircle className="h-4 w-4" /> {status === "IN_PROGRESS" ? "Resume" : "Start"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
