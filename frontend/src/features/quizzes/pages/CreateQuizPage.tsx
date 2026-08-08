import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/FormField";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCourses } from "@/hooks/useCourses";
import { useCreateQuiz } from "@/hooks/useQuizzes";
import { useToast } from "@/context/ToastContext";
import { EmptyState } from "@/components/common/EmptyState";
import { BookOpen } from "lucide-react";

const schema = z.object({
  courseId: z.string().min(1, "Select a course"),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(1, "Duration must be at least 1 minute").max(600),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CreateQuizPage() {
  const navigate = useNavigate();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const createQuiz = useCreateQuiz();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { durationMinutes: 30 } });

  const onSubmit = async (values: FormValues) => {
    try {
      const quiz = await createQuiz.mutateAsync({
        courseId: values.courseId,
        title: values.title,
        description: values.description || undefined,
        durationMinutes: values.durationMinutes,
        startTime: values.startTime ? new Date(values.startTime).toISOString() : undefined,
        endTime: values.endTime ? new Date(values.endTime).toISOString() : undefined,
      });
      toast({ title: "Quiz created", description: "Now add questions to it.", variant: "success" });
      navigate(`/faculty/quizzes/${quiz.id}`);
    } catch (err) {
      toast({ title: "Could not create quiz", description: (err as Error).message, variant: "error" });
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Quizzes", to: "/faculty/quizzes" }, { label: "New" }]} />
      <PageHeader title="Create a quiz" description="Set up the quiz details. You'll add questions in the next step." />

      {!coursesLoading && !courses?.length ? (
        <EmptyState icon={BookOpen} title="Create a course first" description="You need at least one course before creating a quiz." />
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField label="Course" htmlFor="courseId" error={errors.courseId?.message}>
                <Select value={watch("courseId")} onValueChange={(v) => setValue("courseId", v, { shouldValidate: true })}>
                  <SelectTrigger id="courseId">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Quiz title" htmlFor="title" error={errors.title?.message}>
                <Input id="title" placeholder="e.g. Midterm Assessment" {...register("title")} error={!!errors.title} />
              </FormField>

              <FormField label="Description (optional)" htmlFor="description">
                <Textarea id="description" rows={3} placeholder="Brief description shown to students..." {...register("description")} />
              </FormField>

              <FormField label="Duration (minutes)" htmlFor="durationMinutes" error={errors.durationMinutes?.message}>
                <Input id="durationMinutes" type="number" min={1} max={600} {...register("durationMinutes")} error={!!errors.durationMinutes} />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Start time (optional)" htmlFor="startTime" hint="Leave blank to allow anytime after publishing">
                  <Input id="startTime" type="datetime-local" {...register("startTime")} />
                </FormField>
                <FormField label="End time (optional)" htmlFor="endTime" hint="Leave blank for no deadline">
                  <Input id="endTime" type="datetime-local" {...register("endTime")} />
                </FormField>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate("/faculty/quizzes")}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Continue to add questions
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
