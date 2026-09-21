import { useState, useRef } from "react";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ArrowLeft,
  X,
  FileCheck,
  HelpCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCourses } from "@/hooks/useCourses";
import { usePreviewPdfImport, useConfirmPdfImport } from "@/hooks/useQuestions";
import { useToast } from "@/context/ToastContext";
import { ParsedQuestionItem } from "@/services/question.service";
import { cn } from "@/lib/utils";

interface ImportPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCourseId?: string;
}

export function ImportPdfDialog({ open, onOpenChange, defaultCourseId }: ImportPdfDialogProps) {
  const { data: courses } = useCourses();
  const { toast } = useToast();
  const previewMutation = usePreviewPdfImport();
  const confirmMutation = useConfirmPdfImport();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(defaultCourseId || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [questions, setQuestions] = useState<ParsedQuestionItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "valid" | "invalid">("all");
  const [showFormatGuide, setShowFormatGuide] = useState(false);

  // Sync defaultCourseId when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      if (defaultCourseId) setSelectedCourseId(defaultCourseId);
    } else {
      // Reset state on close
      setTimeout(() => {
        setStep("upload");
        setSelectedFile(null);
        setQuestions([]);
        setActiveTab("all");
      }, 200);
    }
    onOpenChange(newOpen);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelection(file);
  };

  const handleFileSelection = (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file (.pdf)",
        variant: "error",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "error",
      });
      return;
    }
    setSelectedFile(file);
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please choose a PDF file to import", variant: "error" });
      return;
    }
    if (!selectedCourseId) {
      toast({ title: "No course selected", description: "Please select a target course for the questions", variant: "error" });
      return;
    }

    try {
      const result = await previewMutation.mutateAsync(selectedFile);
      if (result.questions.length === 0) {
        toast({
          title: "No questions found",
          description: "Could not detect any MCQ questions matching standard formats in the PDF.",
          variant: "error",
        });
        return;
      }
      setQuestions(result.questions);
      setStep("preview");
      toast({
        title: "Extraction complete",
        description: `Found ${result.totalQuestions} questions (${result.validQuestionsCount} valid).`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Extraction failed",
        description: (err as Error).message || "Failed to process PDF",
        variant: "error",
      });
    }
  };

  // Recalculate validity for a modified question
  const validateQuestion = (q: ParsedQuestionItem): ParsedQuestionItem => {
    const errors: string[] = [];
    if (!q.text || q.text.trim().length < 3) {
      errors.push("Question text is too short (minimum 3 characters)");
    }
    if (q.options.length < 2) {
      errors.push("At least 2 options are required");
    }
    if (q.options.some((o) => !o.text || o.text.trim().length === 0)) {
      errors.push("One or more options have empty text");
    }
    if (!q.options.some((o) => o.isCorrect)) {
      errors.push("No correct answer marked. Click an option letter to set it as correct.");
    }
    return {
      ...q,
      isValid: errors.length === 0,
      errors,
    };
  };

  const updateQuestionText = (index: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = validateQuestion({ ...copy[index], text });
      return copy;
    });
  };

  const updateMarks = (index: number, marks: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], marks: Math.max(1, Math.min(100, marks || 1)) };
      return copy;
    });
  };

  const setCorrectOption = (questionIndex: number, optionIndex: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = copy[questionIndex];
      const updatedOptions = q.options.map((opt, i) => ({
        ...opt,
        isCorrect: i === optionIndex,
      }));
      copy[questionIndex] = validateQuestion({
        ...q,
        options: updatedOptions,
      });
      return copy;
    });
  };

  const updateOptionText = (questionIndex: number, optionIndex: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = copy[questionIndex];
      const updatedOptions = [...q.options];
      updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], text };
      copy[questionIndex] = validateQuestion({
        ...q,
        options: updatedOptions,
      });
      return copy;
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const validQuestions = questions.filter((q) => q.isValid);
  const invalidQuestions = questions.filter((q) => !q.isValid);

  const displayedQuestions = questions
    .map((q, originalIndex) => ({ q, originalIndex }))
    .filter(({ q }) => {
      if (activeTab === "valid") return q.isValid;
      if (activeTab === "invalid") return !q.isValid;
      return true;
    });

  const handleConfirmImport = async () => {
    if (!selectedCourseId) {
      toast({ title: "No course selected", description: "Please select a course", variant: "error" });
      return;
    }
    if (validQuestions.length === 0) {
      toast({ title: "No valid questions", description: "Please resolve the errors or select valid questions to import", variant: "error" });
      return;
    }

    try {
      const payload = {
        courseId: selectedCourseId,
        questions: validQuestions.map((q) => ({
          text: q.text,
          marks: q.marks,
          options: q.options.map((o) => ({
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        })),
      };

      const res = await confirmMutation.mutateAsync(payload);
      toast({
        title: "Questions imported successfully",
        description: `Added ${res.count} question(s) to the Question Bank.`,
        variant: "success",
      });
      handleOpenChange(false);
    } catch (err) {
      toast({
        title: "Import failed",
        description: (err as Error).message || "Could not save questions",
        variant: "error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border bg-card">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Import Questions from PDF
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Automatically parse MCQs and import them directly into your Question Bank.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {step === "upload" ? (
            <div className="space-y-5">
              {/* Course Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Target Course <span className="text-destructive">*</span>
                </label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select target course for imported questions" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PDF Dropzone */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Question Paper (PDF) <span className="text-destructive">*</span>
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all",
                    selectedFile
                      ? "border-primary bg-primary/5 hover:bg-primary/10"
                      : "border-border bg-secondary/20 hover:border-primary/50 hover:bg-secondary/40"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelection(file);
                    }}
                  />

                  {selectedFile ? (
                    <div className="flex items-center gap-4 w-full max-w-md p-3 bg-card rounded-lg border border-border shadow-sm">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileCheck className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-sm font-semibold text-foreground truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to parse
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          <span className="text-primary hover:underline">Click to browse</span> or drag and drop your PDF
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF files up to 10MB supported
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Supported Format Accordion */}
              <div className="rounded-lg border border-border/80 bg-secondary/30 p-4 text-xs">
                <button
                  type="button"
                  onClick={() => setShowFormatGuide(!showFormatGuide)}
                  className="flex w-full items-center justify-between font-medium text-foreground hover:text-primary transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-primary" /> Supported PDF Question Formats
                  </span>
                  <span className="text-muted-foreground">{showFormatGuide ? "Hide" : "Show examples"}</span>
                </button>
                {showFormatGuide && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-border/60 text-muted-foreground">
                    <p>The parser automatically extracts MCQs structured like:</p>
                    <pre className="p-3 bg-card rounded border border-border text-[11px] font-mono text-foreground overflow-x-auto">
{`1. What is cloud computing? [1 mark]
A. On-demand delivery of IT resources
B. Physical server rack in an office
C. Local hard disk storage
D. Unconnected peripheral device
Answer: A`}
                    </pre>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      <li>Numbered questions (1., 2., Q1., Question 1:)</li>
                      <li>Options labeled A-D or 1-4 (e.g., A., (A), 1., (1))</li>
                      <li>Answer lines (Answer: B, Correct Answer: B, Ans: B)</li>
                      <li>Questions and options spanning multiple lines are supported</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Preview Step */
            <div className="space-y-4">
              {/* Summary Stats Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-secondary/30 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">Extracted:</span>
                    <Badge variant="outline">{questions.length} Questions</Badge>
                  </div>
                  <Badge variant="secondary" className="bg-success/15 text-success border-success/20">
                    <CheckCircle2 className="h-3 w-3 mr-1 inline" /> {validQuestions.length} Ready
                  </Badge>
                  {invalidQuestions.length > 0 && (
                    <Badge variant="destructive" className="bg-destructive/15 text-destructive border-destructive/20">
                      <AlertTriangle className="h-3 w-3 mr-1 inline" /> {invalidQuestions.length} Needs Attention
                    </Badge>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-background p-0.5 rounded-md border border-border text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={cn(
                      "px-2.5 py-1 rounded transition-colors font-medium",
                      activeTab === "all" ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All ({questions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("valid")}
                    className={cn(
                      "px-2.5 py-1 rounded transition-colors font-medium",
                      activeTab === "valid" ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Valid ({validQuestions.length})
                  </button>
                  {invalidQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("invalid")}
                      className={cn(
                        "px-2.5 py-1 rounded transition-colors font-medium",
                        activeTab === "invalid" ? "bg-destructive/15 text-destructive shadow-sm" : "text-muted-foreground hover:text-destructive"
                      )}
                    >
                      Errors ({invalidQuestions.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {displayedQuestions.map(({ q, originalIndex }) => (
                  <div
                    key={q.tempId}
                    className={cn(
                      "rounded-xl border p-4 bg-card transition-all space-y-3",
                      q.isValid ? "border-border" : "border-destructive/40 bg-destructive/[0.02]"
                    )}
                  >
                    {/* Top Row: Q# badge, Marks, Discard */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-semibold text-xs">
                          Question {originalIndex + 1}
                        </Badge>
                        {q.isValid ? (
                          <Badge variant="secondary" className="bg-success/15 text-success border-success/20 text-[10px] py-0">
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] py-0">
                            Needs Review
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs text-muted-foreground">Marks:</label>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={q.marks}
                            onChange={(e) => updateMarks(originalIndex, parseInt(e.target.value, 10))}
                            className="h-7 w-16 text-center text-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeQuestion(originalIndex)}
                          title="Remove from import"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Question Statement */}
                    <div>
                      <Textarea
                        rows={2}
                        value={q.text}
                        onChange={(e) => updateQuestionText(originalIndex, e.target.value)}
                        placeholder="Question statement"
                        className="text-sm resize-y"
                      />
                    </div>

                    {/* Options list */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Options (Click letter to mark as correct)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIndex) => {
                          const letter = String.fromCharCode(65 + optIndex);
                          return (
                            <div
                              key={optIndex}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border transition-all",
                                opt.isCorrect
                                  ? "border-success bg-success/10"
                                  : "border-border bg-secondary/20 hover:border-border/80"
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => setCorrectOption(originalIndex, optIndex)}
                                className={cn(
                                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                                  opt.isCorrect
                                    ? "bg-success text-success-foreground shadow-sm ring-2 ring-success/30"
                                    : "bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary"
                                )}
                                title={`Mark ${letter} as correct answer`}
                              >
                                {letter}
                              </button>
                              <Input
                                value={opt.text}
                                onChange={(e) => updateOptionText(originalIndex, optIndex, e.target.value)}
                                className="h-8 text-xs bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-primary shadow-none px-1"
                                placeholder={`Option ${letter}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Error Alerts */}
                    {!q.isValid && q.errors.length > 0 && (
                      <div className="rounded-lg bg-destructive/10 p-2.5 border border-destructive/20 text-xs text-destructive space-y-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>Validation Issues:</span>
                        </div>
                        <ul className="list-disc list-inside pl-1 space-y-0.5 text-[11px]">
                          {q.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border bg-card flex items-center justify-between sm:justify-between">
          {step === "upload" ? (
            <>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!selectedFile || !selectedCourseId || previewMutation.isPending}
                isLoading={previewMutation.isPending}
                onClick={handleExtract}
              >
                Extract Questions
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("upload")}
                disabled={confirmMutation.isPending}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back / Re-upload
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={validQuestions.length === 0 || confirmMutation.isPending}
                  isLoading={confirmMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  Import {validQuestions.length} Question{validQuestions.length === 1 ? "" : "s"}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
