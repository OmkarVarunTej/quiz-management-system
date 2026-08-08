import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/FormField";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCreateQuestion, useUpdateQuestion } from "@/hooks/useQuestions";
import { useCourses } from "@/hooks/useCourses";
import { useToast } from "@/context/ToastContext";
import { Question } from "@/types";
import { cn } from "@/lib/utils";

const schema = z.object({
  courseId: z.string().min(1, "Select a course"),
  text: z.string().min(3, "Question text is required"),
  marks: z.coerce.number().int().min(1).max(100),
  options: z
    .array(z.object({ text: z.string().min(1, "Option text is required"), isCorrect: z.boolean() }))
    .min(2, "At least 2 options required")
    .refine((opts) => opts.some((o) => o.isCorrect), { message: "Mark at least one option as correct" }),
});
type FormValues = z.infer<typeof schema>;

interface QuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: Question | null;
  defaultCourseId?: string;
}

export function QuestionFormDialog({ open, onOpenChange, question, defaultCourseId }: QuestionFormDialogProps) {
  const isEdit = !!question;
  const { data: courses } = useCourses();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion(question?.id || "");
  const { toast } = useToast();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { courseId: defaultCourseId || "", text: "", marks: 1, options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const options = watch("options");

  useEffect(() => {
    if (open) {
      reset(
        question
          ? {
              courseId: question.courseId,
              text: question.text,
              marks: question.marks,
              options: question.options.map((o) => ({ text: o.text, isCorrect: !!o.isCorrect })),
            }
          : {
              courseId: defaultCourseId || "",
              text: "",
              marks: 1,
              options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }],
            }
      );
    }
  }, [open, question, defaultCourseId, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await updateQuestion.mutateAsync({ text: values.text, marks: values.marks, options: values.options });
        toast({ title: "Question updated", variant: "success" });
      } else {
        await createQuestion.mutateAsync(values);
        toast({ title: "Question created", variant: "success" });
      }
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Something went wrong", description: (err as Error).message, variant: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit question" : "Add a new question"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Course" htmlFor="courseId" error={errors.courseId?.message}>
              <Select
                disabled={isEdit}
                value={watch("courseId")}
                onValueChange={(v) => setValue("courseId", v, { shouldValidate: true })}
              >
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
            <FormField label="Marks" htmlFor="marks" error={errors.marks?.message}>
              <Input id="marks" type="number" min={1} max={100} {...register("marks")} error={!!errors.marks} />
            </FormField>
          </div>

          <FormField label="Question text" htmlFor="text" error={errors.text?.message}>
            <Textarea id="text" rows={3} placeholder="Enter the question..." {...register("text")} error={!!errors.text} />
          </FormField>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Options</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => append({ text: "", isCorrect: false })}
                disabled={fields.length >= 8}
              >
                <Plus className="h-3.5 w-3.5" /> Add option
              </Button>
            </div>
            {errors.options?.message && <p className="text-xs font-medium text-destructive">{errors.options.message}</p>}
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setValue(
                        "options",
                        options.map((o, i) => ({ ...o, isCorrect: i === idx })),
                        { shouldValidate: true }
                      )
                    }
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                      options?.[idx]?.isCorrect
                        ? "border-success bg-success/10 text-success"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                    aria-label={`Mark option ${idx + 1} as correct`}
                    title="Mark as correct answer"
                  >
                    {String.fromCharCode(65 + idx)}
                  </button>
                  <Input
                    placeholder={`Option ${idx + 1}`}
                    {...register(`options.${idx}.text` as const)}
                    error={!!errors.options?.[idx]?.text}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(idx)}
                    disabled={fields.length <= 2}
                    aria-label="Remove option"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Click the letter to mark an option as the correct answer.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEdit ? "Save changes" : "Create question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
