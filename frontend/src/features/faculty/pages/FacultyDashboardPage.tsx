import { Link } from "react-router-dom";
import { BookOpen, HelpCircle, ClipboardList, Users, Plus, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { useQuizzes } from "@/hooks/useQuizzes";
import { QUIZ_STATUS_LABEL } from "@/constants";
import { formatDate } from "@/lib/utils";

const statusVariant: Record<string, "secondary" | "success" | "default"> = {
  DRAFT: "secondary",
  PUBLISHED: "success",
  CLOSED: "default",
};

export function FacultyDashboardPage() {
  const { user } = useAuth();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: quizzes, isLoading: quizzesLoading } = useQuizzes();

  const totalStudents = courses?.reduce((sum, c) => sum + (c._count?.students || 0), 0) || 0;
  const totalQuestions = courses?.reduce((sum, c) => sum + (c._count?.questions || 0), 0) || 0;
  const recentQuizzes = quizzes?.slice(0, 5) || [];

  const stats = [
    { label: "Courses", value: courses?.length ?? 0, icon: BookOpen, to: "/faculty/courses" },
    { label: "Questions", value: totalQuestions, icon: HelpCircle, to: "/faculty/questions" },
    { label: "Quizzes", value: quizzes?.length ?? 0, icon: ClipboardList, to: "/faculty/quizzes" },
    { label: "Enrolled students", value: totalStudents, icon: Users, to: "/faculty/courses" },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] || "Professor"}`}
        description="Here's an overview of your courses and quizzes."
        action={
          <Button asChild>
            <Link to="/faculty/quizzes/new">
              <Plus className="h-4 w-4" /> Create Quiz
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  {coursesLoading || quizzesLoading ? (
                    <Skeleton className="mt-1 h-7 w-10" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  )}
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recent quizzes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/faculty/quizzes">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {quizzesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : recentQuizzes.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No quizzes yet"
              description="Create your first quiz to get started."
              actionLabel="Create Quiz"
              onAction={() => (window.location.href = "/faculty/quizzes/new")}
            />
          ) : (
            <div className="divide-y divide-border">
              {recentQuizzes.map((q) => (
                <Link
                  key={q.id}
                  to={`/faculty/quizzes/${q.id}`}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{q.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.course?.name} · {formatDate(q.createdAt)}
                    </p>
                  </div>
                  <Badge variant={statusVariant[q.status]}>{QUIZ_STATUS_LABEL[q.status]}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
