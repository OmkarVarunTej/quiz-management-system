import { useState } from "react";
import { useParams } from "react-router-dom";
import { UserPlus, Users, Trash2 } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSpinner } from "@/components/ui/spinner";
import { useCourse, useCourseStudents, useUnenrollStudent } from "@/hooks/useCourses";
import { useToast } from "@/context/ToastContext";
import { getInitials } from "@/lib/utils";
import { EnrollStudentDialog } from "../components/EnrollStudentDialog";
import { Student } from "@/types";

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: course, isLoading, isError, refetch } = useCourse(id);
  const { data: students, isLoading: studentsLoading } = useCourseStudents(id);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [removing, setRemoving] = useState<Student | null>(null);
  const unenroll = useUnenrollStudent(id || "");
  const { toast } = useToast();

  if (isLoading) return <PageSpinner />;
  if (isError || !course) return <ErrorState onRetry={() => refetch()} />;

  const handleRemove = async () => {
    if (!removing) return;
    try {
      await unenroll.mutateAsync(removing.id);
      toast({ title: "Student removed from course", variant: "success" });
      setRemoving(null);
    } catch (err) {
      toast({ title: "Could not remove student", description: (err as Error).message, variant: "error" });
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Courses", to: "/faculty/courses" }, { label: course.code }]} />
      <PageHeader
        title={course.name}
        description={`Course code: ${course.code} · ${course._count?.quizzes ?? 0} quizzes · ${course._count?.questions ?? 0} questions`}
        action={
          <Button onClick={() => setEnrollOpen(true)}>
            <UserPlus className="h-4 w-4" /> Enroll Student
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Enrolled students ({students?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !students?.length ? (
            <EmptyState
              icon={Users}
              title="No students enrolled yet"
              description="Enroll students using their registration number so they can access quizzes for this course."
              actionLabel="Enroll Student"
              onAction={() => setEnrollOpen(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Reg. No.</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">{getInitials(s.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.regNo}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setRemoving(s)}
                        aria-label={`Remove ${s.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {id && <EnrollStudentDialog open={enrollOpen} onOpenChange={setEnrollOpen} courseId={id} />}
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Remove student from course?"
        description={`${removing?.name} will lose access to quizzes in this course.`}
        confirmLabel="Remove"
        variant="destructive"
        isLoading={unenroll.isPending}
        onConfirm={handleRemove}
      />
    </div>
  );
}
