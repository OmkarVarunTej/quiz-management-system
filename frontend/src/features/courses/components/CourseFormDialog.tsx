import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { useCreateCourse, useUpdateCourse } from "@/hooks/useCourses";
import { useToast } from "@/context/ToastContext";
import { Course } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Course name is required"),
  code: z.string().min(2, "Course code is required").toUpperCase(),
});
type FormValues = z.infer<typeof schema>;

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
}

export function CourseFormDialog({ open, onOpenChange, course }: CourseFormDialogProps) {
  const { toast } = useToast();
  const isEdit = !!course;
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse(course?.id || "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) reset({ name: course?.name || "", code: course?.code || "" });
  }, [open, course, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await updateCourse.mutateAsync(values);
        toast({ title: "Course updated", variant: "success" });
      } else {
        await createCourse.mutateAsync(values);
        toast({ title: "Course created", variant: "success" });
      }
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Something went wrong", description: (err as Error).message, variant: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit course" : "Create a new course"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Course name" htmlFor="name" error={errors.name?.message}>
            <Input id="name" placeholder="e.g. Cloud Computing" {...register("name")} error={!!errors.name} />
          </FormField>
          <FormField label="Course code" htmlFor="code" error={errors.code?.message} hint="A short unique identifier, e.g. CS101">
            <Input id="code" placeholder="e.g. CS101" {...register("code")} error={!!errors.code} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEdit ? "Save changes" : "Create course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
