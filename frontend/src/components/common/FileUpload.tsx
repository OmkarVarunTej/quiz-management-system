import { useRef, useState } from "react";
import { ImageUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  previewUrl?: string | null;
  accept?: string;
  className?: string;
}

export function FileUpload({ onFileSelect, previewUrl, accept = "image/*", className }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setLocalPreview(URL.createObjectURL(file));
    onFileSelect(file);
  };

  const preview = localPreview || previewUrl;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/30 p-6 text-center transition-colors hover:border-primary/50 hover:bg-secondary/50"
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="max-h-40 rounded-md object-contain" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLocalPreview(null);
              }}
              className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <>
            <ImageUp className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
