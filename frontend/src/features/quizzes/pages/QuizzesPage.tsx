import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ClipboardList, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCourses } from "@/hooks/useCourses";
import { useDeleteQuiz, useQuizzes } from "@/hooks/useQuizzes";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/context/ToastContext";
import { QUIZ_STATUS_LABEL } from "@/constants";
import { formatDate } from "@/lib/utils";
import { Quiz } from "@/types";

const statusVariant: Record<string, "secondary" | "success" | "default"> = {
  DRAFT: "secondary",
  PUBLISHED: "success",
  CLOSED: "default",
};

export function QuizzesPage() {
  const { data: courses } = useCourses();
  const [courseFilter, setCourseFilter] = useState("all");
  const { data: quizzes, isLoading, isError, refetch } = useQuizzes(courseFilter === "all" ? undefined : courseFilter);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [deleting, setDeleting] = useState<Quiz | null>(null);
  const deleteQuiz = useDeleteQuiz();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    if (!quizzes) return [];
    const q = debouncedSearch.toLowerCase();
    return quizzes.filter((item) => item.title.toLowerCase().includes(q));
  }, [quizzes, debouncedSearch]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteQuiz.mutateAsync(deleting.id);
      toast({ title: "Quiz deleted", variant: "success" });
      setDeleting(null);
    } catch (err) {
      toast({ title: "Could not delete quiz", description: (err as Error).message, variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Quizzes"
        description="Create, schedule, and publish quizzes for your courses."
        action={
          <Button asChild>
            <Link to="/faculty/quizzes/new">
              <Plus className="h-4 w-4" /> Create Quiz
            </Link>
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search quizzes..." className="max-w-sm" />
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.code} — {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={quizzes?.length ? "No quizzes match your search" : "No quizzes yet"}
          description={quizzes?.length ? "Try a different search term." : "Create your first quiz to start assessing students."}
          actionLabel={!quizzes?.length ? "Create Quiz" : undefined}
          onAction={!quizzes?.length ? () => (window.location.href = "/faculty/quizzes/new") : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((quiz) => (
            <Card key={quiz.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <Link to={`/faculty/quizzes/${quiz.id}`} className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant[quiz.status]}>{QUIZ_STATUS_LABEL[quiz.status]}</Badge>
                    <Badge variant="outline">{quiz.course?.code}</Badge>
                  </div>
                  <p className="font-medium text-foreground hover:text-primary">{quiz.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {quiz.durationMinutes} min · {quiz.totalMarks} marks · {quiz._count?.quizQuestions ?? 0} questions · Created {formatDate(quiz.createdAt)}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/faculty/quizzes/${quiz.id}`}>Manage</Link>
                  </Button>
                  {quiz.status === "DRAFT" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleting(quiz)}
                      aria-label="Delete quiz"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this quiz?"
        description={`This will permanently delete "${deleting?.title}". This cannot be undone.`}
        confirmLabel="Delete quiz"
        variant="destructive"
        isLoading={deleteQuiz.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
