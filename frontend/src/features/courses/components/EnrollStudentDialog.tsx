import { useState, useRef } from "react";
import {
  User,
  Users,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Download,
  RotateCcw,
  Check,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/forms/FormField";
import { useEnrollStudent, useBulkEnrollStudents } from "@/hooks/useCourses";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { BulkEnrollData } from "@/types";
import {
  parseEnrollmentFile,
  ParsedEnrollmentResult,
  downloadCsvTemplate,
  downloadTxtTemplate,
  downloadEnrollmentReport,
} from "../utils/enrollmentParser";

interface EnrollStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseCode?: string;
}

export function EnrollStudentDialog({
  open,
  onOpenChange,
  courseId,
  courseCode = "",
}: EnrollStudentDialogProps) {
  const { toast } = useToast();

  // Mode: "single" or "bulk"
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // Single enrollment state
  const [singleRegNo, setSingleRegNo] = useState("");
  const [singleError, setSingleError] = useState("");
  const singleEnroll = useEnrollStudent(courseId);

  // Bulk enrollment state
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedEnrollmentResult | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkEnrollData | null>(null);
  const [bulkActiveTab, setBulkActiveTab] = useState<"enrolled" | "alreadyEnrolled" | "notFound" | "duplicates" | "invalid">("enrolled");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkEnroll = useBulkEnrollStudents(courseId);

  // Reset states on dialog close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTimeout(() => {
        setSingleRegNo("");
        setSingleError("");
        setParsedResult(null);
        setBulkResult(null);
        setIsDragging(false);
      }, 200);
    }
    onOpenChange(newOpen);
  };

  // --- Single Enrollment Handler ---
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRegNo = singleRegNo.trim();
    if (!cleanRegNo) {
      setSingleError("Registration number is required");
      return;
    }
    try {
      await singleEnroll.mutateAsync(cleanRegNo);
      toast({ title: "Student enrolled successfully", variant: "success" });
      setSingleRegNo("");
      handleOpenChange(false);
    } catch (err) {
      toast({
        title: "Could not enroll student",
        description: (err as Error).message,
        variant: "error",
      });
    }
  };

  // --- Bulk File Selection & Parsing ---
  const handleFileChosen = async (file: File) => {
    setIsParsing(true);
    setBulkResult(null);
    try {
      const parsed = await parseEnrollmentFile(file);
      setParsedResult(parsed);
      if (parsed.error) {
        toast({ title: "File validation warning", description: parsed.error, variant: "error" });
      }
    } catch (err) {
      toast({
        title: "File parsing error",
        description: (err as Error).message || "Failed to parse file",
        variant: "error",
      });
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChosen(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChosen(file);
    }
  };

  const resetBulkState = () => {
    setParsedResult(null);
    setBulkResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Submit Bulk Enrollment ---
  const handleBulkEnrollSubmit = async () => {
    if (!parsedResult || parsedResult.normalizedUnique.length === 0) {
      toast({
        title: "No valid registration numbers",
        description: "Please upload a file with valid registration numbers.",
        variant: "error",
      });
      return;
    }

    try {
      const response = await bulkEnroll.mutateAsync({
        registrationNumbers: parsedResult.normalizedUnique,
      });
      setBulkResult(response);

      // Select default tab based on what's available
      if (response.results.enrolled.length > 0) {
        setBulkActiveTab("enrolled");
      } else if (response.results.alreadyEnrolled.length > 0) {
        setBulkActiveTab("alreadyEnrolled");
      } else {
        setBulkActiveTab("notFound");
      }

      toast({
        title: "Bulk enrollment processed",
        description: `${response.summary.enrolled} enrolled, ${response.summary.alreadyEnrolled} already enrolled, ${response.summary.notFound} not found.`,
        variant: response.summary.enrolled > 0 ? "success" : "info",
      });
    } catch (err) {
      toast({
        title: "Bulk enrollment failed",
        description: (err as Error).message || "An error occurred while enrolling students",
        variant: "error",
      });
    }
  };

  // Download CSV report helper
  const handleDownloadReport = () => {
    if (!bulkResult) return;
    downloadEnrollmentReport(courseCode, bulkResult.summary, bulkResult.results);
    toast({ title: "Report downloaded", description: "Enrollment summary report saved to your computer.", variant: "success" });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("transition-all duration-200", mode === "bulk" ? "max-w-2xl sm:max-w-2xl" : "max-w-lg")}>
        <DialogHeader>
          <DialogTitle>Enroll Students</DialogTitle>
          <DialogDescription>
            Add students to this course manually or upload a batch file containing their registration numbers.
          </DialogDescription>
        </DialogHeader>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-border mb-2">
          <button
            type="button"
            id="tab-single-enrollment"
            onClick={() => setMode("single")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-[1px]",
              mode === "single"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="h-4 w-4" />
            Single Enrollment
          </button>
          <button
            type="button"
            id="tab-bulk-enrollment"
            onClick={() => setMode("bulk")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-[1px]",
              mode === "bulk"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-4 w-4" />
            Bulk Enrollment
          </button>
        </div>

        {/* Single Enrollment Mode */}
        {mode === "single" && (
          <form onSubmit={handleSingleSubmit} className="space-y-4" noValidate>
            <FormField label="Registration number" htmlFor="regNo" error={singleError}>
              <Input
                id="regNo"
                placeholder="e.g. REG2026001"
                value={singleRegNo}
                onChange={(e) => {
                  setSingleRegNo(e.target.value);
                  setSingleError("");
                }}
              />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={singleEnroll.isPending}>
                Enroll student
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Bulk Enrollment Mode */}
        {mode === "bulk" && (
          <div className="space-y-4">
            {/* STAGE 1: Upload Dropzone (when no file or result yet) */}
            {!parsedResult && !bulkResult && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="bulk-enrollment-file-input"
                  accept=".txt,.csv,.xlsx,.xls,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={handleInputChange}
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-3",
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : "border-border hover:border-primary/50 hover:bg-muted/50 bg-card"
                  )}
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <UploadCloud className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      Drag and drop your file here, or <span className="text-primary underline">browse files</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supported formats: <span className="font-medium text-foreground">TXT, CSV, XLSX</span> (Max 5MB)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs font-mono">.txt</Badge>
                    <Badge variant="outline" className="text-xs font-mono">.csv</Badge>
                    <Badge variant="outline" className="text-xs font-mono">.xlsx</Badge>
                  </div>
                </div>

                {isParsing && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground animate-pulse">
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Parsing and validating registration numbers...
                  </div>
                )}

                {/* Templates and Help Section */}
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <Info className="h-3.5 w-3.5 text-primary" />
                      Download Sample Templates
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadCsvTemplate}
                        className="h-7 text-xs gap-1.5"
                      >
                        <Download className="h-3 w-3" />
                        CSV Template
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadTxtTemplate}
                        className="h-7 text-xs gap-1.5"
                      >
                        <Download className="h-3 w-3" />
                        TXT Template
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    CSV & Excel files should include a header named <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">registrationNumber</code>. TXT files can list one registration number per line.
                  </p>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse Files
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* STAGE 2: Parsed File Preview & Confirmation (before submitting) */}
            {parsedResult && !bulkResult && (
              <div className="space-y-4">
                {/* File Header Card */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                      {parsedResult.fileName.endsWith(".csv") ? (
                        <FileText className="h-5 w-5" />
                      ) : (
                        <FileSpreadsheet className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-foreground">{parsedResult.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(parsedResult.fileSize / 1024).toFixed(1)} KB · {parsedResult.totalDetected} entries found
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetBulkState}
                    className="text-xs text-muted-foreground hover:text-foreground shrink-0 gap-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Change file
                  </Button>
                </div>

                {/* Error Banner if parse failed */}
                {parsedResult.error ? (
                  <div className="p-3.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2.5 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Validation Error</p>
                      <p className="mt-0.5">{parsedResult.error}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Stats Metrics Grid */}
                    <div className="grid grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-lg border border-border bg-card/50 text-center">
                        <p className="text-xs text-muted-foreground font-medium">Total Found</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">{parsedResult.totalDetected}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-center">
                        <p className="text-xs text-primary font-medium">Unique</p>
                        <p className="text-lg font-bold text-primary mt-0.5">{parsedResult.uniqueCount}</p>
                      </div>
                      <div className={cn(
                        "p-3 rounded-lg border text-center",
                        parsedResult.duplicateCount > 0 ? "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400" : "border-border bg-card/50 text-muted-foreground"
                      )}>
                        <p className="text-xs font-medium">Duplicates</p>
                        <p className="text-lg font-bold mt-0.5">{parsedResult.duplicateCount}</p>
                      </div>
                      <div className={cn(
                        "p-3 rounded-lg border text-center",
                        parsedResult.invalidCount > 0 ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border bg-card/50 text-muted-foreground"
                      )}>
                        <p className="text-xs font-medium">Invalid</p>
                        <p className="text-lg font-bold mt-0.5">{parsedResult.invalidCount}</p>
                      </div>
                    </div>

                    {/* Duplicate Warning */}
                    {parsedResult.duplicateCount > 0 && (
                      <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">
                            {parsedResult.duplicateCount} duplicate entries detected in file.
                          </span>{" "}
                          They will be automatically deduplicated so each student is processed once.
                        </div>
                      </div>
                    )}

                    {/* Preview List Box */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Registration Numbers Preview ({Math.min(parsedResult.preview.length, 20)} of {parsedResult.uniqueCount})
                        </span>
                        <span>Showing first {parsedResult.preview.length} unique</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border bg-muted/20 max-h-36 overflow-y-auto flex flex-wrap gap-1.5">
                        {parsedResult.preview.map((num, idx) => (
                          <Badge
                            key={`${num}-${idx}`}
                            variant="secondary"
                            className="font-mono text-xs font-normal"
                          >
                            {num}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetBulkState}
                    disabled={bulkEnroll.isPending}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleBulkEnrollSubmit}
                    isLoading={bulkEnroll.isPending}
                    disabled={!parsedResult || parsedResult.uniqueCount === 0 || !!parsedResult.error}
                  >
                    Enroll {parsedResult?.uniqueCount ?? 0} Students
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* STAGE 3: Final Results Summary (after enrollment completed) */}
            {bulkResult && (
              <div className="space-y-4">
                {/* Result Announcement */}
                <div className="flex items-center gap-3 p-3.5 rounded-lg border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Bulk Enrollment Completed</p>
                    <p className="text-xs opacity-90">
                      Successfully processed {bulkResult.summary.uniqueRegistrationNumbers} unique registration numbers.
                    </p>
                  </div>
                </div>

                {/* Summary Stat Cards */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  <div className="p-2.5 rounded-lg border border-green-500/20 bg-green-500/5 text-center">
                    <p className="text-[11px] font-medium text-green-700 dark:text-green-400">Enrolled</p>
                    <p className="text-base font-bold text-green-700 dark:text-green-400">{bulkResult.summary.enrolled}</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 text-center">
                    <p className="text-[11px] font-medium text-blue-700 dark:text-blue-400">Already Enrolled</p>
                    <p className="text-base font-bold text-blue-700 dark:text-blue-400">{bulkResult.summary.alreadyEnrolled}</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-center">
                    <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Not Found</p>
                    <p className="text-base font-bold text-amber-700 dark:text-amber-400">{bulkResult.summary.notFound}</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-card/60 text-center">
                    <p className="text-[11px] font-medium text-muted-foreground">Duplicates</p>
                    <p className="text-base font-bold text-muted-foreground">{bulkResult.summary.duplicatesInFile}</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-destructive/20 bg-destructive/5 text-center">
                    <p className="text-[11px] font-medium text-destructive">Invalid</p>
                    <p className="text-base font-bold text-destructive">{bulkResult.summary.invalid}</p>
                  </div>
                </div>

                {/* Filterable tabs for results */}
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-md text-xs font-medium border border-border">
                  <button
                    type="button"
                    onClick={() => setBulkActiveTab("enrolled")}
                    className={cn(
                      "px-2.5 py-1 rounded transition-colors",
                      bulkActiveTab === "enrolled" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Enrolled ({bulkResult.results.enrolled.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkActiveTab("alreadyEnrolled")}
                    className={cn(
                      "px-2.5 py-1 rounded transition-colors",
                      bulkActiveTab === "alreadyEnrolled" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Already Enrolled ({bulkResult.results.alreadyEnrolled.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkActiveTab("notFound")}
                    className={cn(
                      "px-2.5 py-1 rounded transition-colors",
                      bulkActiveTab === "notFound" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Not Found ({bulkResult.results.notFound.length})
                  </button>
                  {bulkResult.results.duplicates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBulkActiveTab("duplicates")}
                      className={cn(
                        "px-2.5 py-1 rounded transition-colors",
                        bulkActiveTab === "duplicates" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Duplicates ({bulkResult.results.duplicates.length})
                    </button>
                  )}
                  {bulkResult.results.invalid.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBulkActiveTab("invalid")}
                      className={cn(
                        "px-2.5 py-1 rounded transition-colors",
                        bulkActiveTab === "invalid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Invalid ({bulkResult.results.invalid.length})
                    </button>
                  )}
                </div>

                {/* Results List View */}
                <div className="rounded-lg border border-border max-h-44 overflow-y-auto text-xs divide-y divide-border bg-card">
                  {bulkActiveTab === "enrolled" && (
                    bulkResult.results.enrolled.length === 0 ? (
                      <p className="p-4 text-center text-muted-foreground">No new students were enrolled.</p>
                    ) : (
                      bulkResult.results.enrolled.map((item, idx) => (
                        <div key={`${item.regNo}-${idx}`} className="p-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            <span className="font-mono font-medium text-foreground">{item.regNo}</span>
                            {item.name && <span className="text-muted-foreground">({item.name})</span>}
                          </div>
                          {item.email && <span className="text-muted-foreground text-[11px]">{item.email}</span>}
                        </div>
                      ))
                    )
                  )}

                  {bulkActiveTab === "alreadyEnrolled" && (
                    bulkResult.results.alreadyEnrolled.length === 0 ? (
                      <p className="p-4 text-center text-muted-foreground">No students were previously enrolled.</p>
                    ) : (
                      bulkResult.results.alreadyEnrolled.map((item, idx) => (
                        <div key={`${item.regNo}-${idx}`} className="p-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] text-blue-600 dark:text-blue-400">Already in course</Badge>
                            <span className="font-mono font-medium text-foreground">{item.regNo}</span>
                            {item.name && <span className="text-muted-foreground">({item.name})</span>}
                          </div>
                          <span className="text-muted-foreground text-[11px]">Skipped</span>
                        </div>
                      ))
                    )
                  )}

                  {bulkActiveTab === "notFound" && (
                    bulkResult.results.notFound.length === 0 ? (
                      <p className="p-4 text-center text-muted-foreground">All registration numbers were found in system.</p>
                    ) : (
                      bulkResult.results.notFound.map((item, idx) => (
                        <div key={`${item.regNo}-${idx}`} className="p-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                            <span className="font-mono font-medium text-foreground">{item.regNo}</span>
                          </div>
                          <span className="text-amber-600 dark:text-amber-400 text-[11px]">Student not registered</span>
                        </div>
                      ))
                    )
                  )}

                  {bulkActiveTab === "duplicates" && (
                    bulkResult.results.duplicates.map((item, idx) => (
                      <div key={`${item.regNo}-${idx}`} className="p-2.5 flex items-center justify-between">
                        <span className="font-mono font-medium text-foreground">{item.regNo}</span>
                        <span className="text-muted-foreground text-[11px]">{item.reason}</span>
                      </div>
                    ))
                  )}

                  {bulkActiveTab === "invalid" && (
                    bulkResult.results.invalid.map((item, idx) => (
                      <div key={`${item.regNo}-${idx}`} className="p-2.5 flex items-center justify-between">
                        <span className="font-mono font-medium text-destructive">{item.regNo}</span>
                        <span className="text-destructive text-[11px]">{item.reason}</span>
                      </div>
                    ))
                  )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadReport}
                    className="gap-1.5"
                  >
                    <Download className="h-4 w-4" />
                    Download Report (CSV)
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={resetBulkState}
                    >
                      Enroll More
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleOpenChange(false)}
                    >
                      Done
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
