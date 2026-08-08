import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { useEnrollStudent } from "@/hooks/useCourses";
import { useToast } from "@/context/ToastContext";

export function EnrollStudentDialog({
  open,
  onOpenChange,
  courseId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
}) {
  const [regNo, setRegNo] = useState("");
  const [error, setError] = useState("");
  const enroll = useEnrollStudent(courseId);
  const { toast } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNo.trim()) {
      setError("Registration number is required");
      return;
    }
    try {
      await enroll.mutateAsync(regNo.trim());
      toast({ title: "Student enrolled", variant: "success" });
      setRegNo("");
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Could not enroll student", description: (err as Error).message, variant: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll a student</DialogTitle>
          <DialogDescription>Enter the student's registration number to add them to this course.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField label="Registration number" htmlFor="regNo" error={error}>
            <Input
              id="regNo"
              placeholder="e.g. REG2026001"
              value={regNo}
              onChange={(e) => {
                setRegNo(e.target.value);
                setError("");
              }}
            />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={enroll.isPending}>
              Enroll student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
