import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/common/FileUpload";
import { useUploadQuestionImage } from "@/hooks/useQuestions";
import { useToast } from "@/context/ToastContext";
import { Question } from "@/types";

export function QuestionImageDialog({
  open,
  onOpenChange,
  question,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const upload = useUploadQuestionImage(question?.id || "");
  const { toast } = useToast();

  const onSubmit = async () => {
    if (!file) return;
    try {
      await upload.mutateAsync(file);
      toast({ title: "Image uploaded", variant: "success" });
      setFile(null);
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload question image</DialogTitle>
        </DialogHeader>
        <FileUpload onFileSelect={setFile} previewUrl={question?.imageUrl} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!file} isLoading={upload.isPending}>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
