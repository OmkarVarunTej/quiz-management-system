import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, BookOpen, Users, ClipboardList, HelpCircle, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourses, useDeleteCourse } from "@/hooks/useCourses";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/context/ToastContext";
import { CourseFormDialog } from "../components/CourseFormDialog";
import { Course } from "@/types";

export function CoursesPage() {
  const { data: courses, isLoading, isError, refetch } = useCourses();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const deleteCourse = useDeleteCourse();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    if (!courses) return [];
    const q = debouncedSearch.toLowerCase();
    return courses.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [courses, debouncedSearch]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteCourse.mutateAsync(deleting.id);
      toast({ title: "Course deleted", variant: "success" });
      setDeleting(null);
    } catch (err) {
      toast({ title: "Could not delete course", description: (err as Error).message, variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Manage the courses you teach, their questions, and enrolled students."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New Course
          </Button>
        }
      />

      <SearchBar value={search} onChange={setSearch} placeholder="Search courses by name or code..." className="mb-5 max-w-sm" />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={courses?.length ? "No courses match your search" : "No courses yet"}
          description={courses?.length ? "Try a different search term." : "Create your first course to start building question banks and quizzes."}
          actionLabel={!courses?.length ? "New Course" : undefined}
          onAction={!courses?.length ? () => setFormOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <Card key={course.id} className="group relative flex flex-col transition-shadow hover:shadow-md">
              <CardContent className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between">
                  <Link to={`/faculty/courses/${course.id}`} className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground hover:text-primary">{course.name}</p>
                    <p className="text-xs text-muted-foreground">{course.code}</p>
                  </Link>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditing(course);
                        setFormOpen(true);
                      }}
                      aria-label="Edit course"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleting(course)}
                      aria-label="Delete course"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                  <div>
                    <Users className="mx-auto h-4 w-4 text-muted-foreground" />
                    <p className="mt-1 text-sm font-semibold text-foreground">{course._count?.students ?? 0}</p>
                    <p className="text-[11px] text-muted-foreground">Students</p>
                  </div>
                  <div>
                    <HelpCircle className="mx-auto h-4 w-4 text-muted-foreground" />
                    <p className="mt-1 text-sm font-semibold text-foreground">{course._count?.questions ?? 0}</p>
                    <p className="text-[11px] text-muted-foreground">Questions</p>
                  </div>
                  <div>
                    <ClipboardList className="mx-auto h-4 w-4 text-muted-foreground" />
                    <p className="mt-1 text-sm font-semibold text-foreground">{course._count?.quizzes ?? 0}</p>
                    <p className="text-[11px] text-muted-foreground">Quizzes</p>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                  <Link to={`/faculty/courses/${course.id}`}>Manage course</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CourseFormDialog open={formOpen} onOpenChange={setFormOpen} course={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this course?"
        description={`This will permanently delete "${deleting?.name}" along with its questions and quizzes. This cannot be undone.`}
        confirmLabel="Delete course"
        variant="destructive"
        isLoading={deleteCourse.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
