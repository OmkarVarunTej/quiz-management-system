import * as XLSX from "xlsx";
import { BulkEnrollData, BulkEnrollSummary } from "@/types";

export interface ParsedEnrollmentResult {
  fileName: string;
  fileSize: number;
  rawEntries: string[];
  normalizedUnique: string[];
  duplicatesInFile: Array<{ regNo: string; count: number }>;
  totalDetected: number;
  uniqueCount: number;
  duplicateCount: number;
  invalidCount: number;
  invalidEntries: Array<{ regNo: string; reason: string }>;
  preview: string[];
  error?: string;
}

const REG_HEADER_CANDIDATES = [
  "registrationnumber",
  "registrationno",
  "regnumber",
  "regno",
  "studentregistrationnumber",
  "studentregno",
  "registration",
  "reg",
  "studentreg",
];

function normalizeHeader(header: string): string {
  return (header || "").toLowerCase().replace(/[\s_\-.]/g, "");
}

function isRegistrationHeader(header: string): boolean {
  const norm = normalizeHeader(header);
  return REG_HEADER_CANDIDATES.includes(norm);
}

/**
 * Downloads a sample CSV enrollment template.
 */
export function downloadCsvTemplate(): void {
  const csvContent = "registrationNumber\nREG2026001\nREG2026002\nREG2026003\n";
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, "student-enrollment-template.csv");
}

/**
 * Downloads a sample TXT enrollment template.
 */
export function downloadTxtTemplate(): void {
  const txtContent = "REG2026001\nREG2026002\nREG2026003\n";
  const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" });
  triggerDownload(blob, "student-enrollment-template.txt");
}

/**
 * Downloads a CSV summary report of the bulk enrollment results.
 */
export function downloadEnrollmentReport(
  courseCode: string,
  summary: BulkEnrollSummary,
  results: BulkEnrollData["results"]
): void {
  const headers = ["Registration Number", "Status", "Student Name", "Email", "Details"];
  const rows: string[][] = [headers];

  for (const item of results.enrolled) {
    rows.push([
      `"${item.regNo}"`,
      '"Enrolled"',
      `"${item.name || "-"}"`,
      `"${item.email || "-"}"`,
      '"Successfully enrolled in course"',
    ]);
  }

  for (const item of results.alreadyEnrolled) {
    rows.push([
      `"${item.regNo}"`,
      '"Already Enrolled"',
      `"${item.name || "-"}"`,
      `"${item.email || "-"}"`,
      `"${item.reason || "Already enrolled in this course"}"`,
    ]);
  }

  for (const item of results.notFound) {
    rows.push([
      `"${item.regNo}"`,
      '"Not Found"',
      '"-"',
      '"-"',
      `"${item.reason || "Student account not registered in system"}"`,
    ]);
  }

  for (const item of results.invalid) {
    rows.push([
      `"${item.regNo}"`,
      '"Invalid"',
      '"-"',
      '"-"',
      `"${item.reason || "Invalid registration number format"}"`,
    ]);
  }

  for (const item of results.duplicates) {
    rows.push([
      `"${item.regNo}"`,
      '"Duplicate in File"',
      '"-"',
      '"-"',
      `"${item.reason || "Duplicate entry in uploaded file"}"`,
    ]);
  }

  // Summary row at bottom
  rows.push([]);
  rows.push([
    '"--- Summary ---"',
    `"Total: ${summary.totalSubmitted}"`,
    `"Enrolled: ${summary.enrolled}"`,
    `"Already Enrolled: ${summary.alreadyEnrolled}"`,
    `"Not Found: ${summary.notFound}, Duplicates: ${summary.duplicatesInFile}, Invalid: ${summary.invalid}"`,
  ]);

  const csvString = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const safeCode = (courseCode || "course").replace(/[^a-zA-Z0-9_-]/g, "_");
  triggerDownload(blob, `${safeCode}-enrollment-report-${timestamp}.csv`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Main parser entry point supporting TXT, CSV, and XLSX.
 */
export async function parseEnrollmentFile(file: File): Promise<ParsedEnrollmentResult> {
  const fileName = file.name;
  const fileSize = file.size;

  if (fileSize === 0) {
    return createErrorResult(fileName, fileSize, "The uploaded file is empty (0 bytes).");
  }

  if (fileSize > 5 * 1024 * 1024) {
    return createErrorResult(fileName, fileSize, "File is too large. Maximum supported file size is 5MB.");
  }

  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

  try {
    let extractedValues: string[] = [];

    if (ext === ".txt") {
      extractedValues = await parseTxtFile(file);
    } else if (ext === ".csv") {
      extractedValues = await parseCsvFile(file);
    } else if (ext === ".xlsx" || ext === ".xls") {
      extractedValues = await parseXlsxFile(file);
    } else {
      return createErrorResult(
        fileName,
        fileSize,
        "Unsupported file format. Please upload a .txt, .csv, or .xlsx file."
      );
    }

    if (extractedValues.length === 0) {
      return createErrorResult(
        fileName,
        fileSize,
        "No registration numbers could be extracted from this file. Please verify the file content and format."
      );
    }

    return processExtractedValues(fileName, fileSize, extractedValues);
  } catch (err) {
    return createErrorResult(
      fileName,
      fileSize,
      (err as Error).message || "Failed to parse file. Please verify the file format."
    );
  }
}

function createErrorResult(fileName: string, fileSize: number, error: string): ParsedEnrollmentResult {
  return {
    fileName,
    fileSize,
    rawEntries: [],
    normalizedUnique: [],
    duplicatesInFile: [],
    totalDetected: 0,
    uniqueCount: 0,
    duplicateCount: 0,
    invalidCount: 0,
    invalidEntries: [],
    preview: [],
    error,
  };
}

/**
 * Parses TXT file: each non-empty line or comma/space separated token.
 */
async function parseTxtFile(file: File): Promise<string[]> {
  const text = await file.text();
  const lines = text.split(/\r?\n/);
  const values: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check if line contains commas
    if (line.includes(",")) {
      const parts = line.split(",").map((p) => p.trim()).filter(Boolean);
      values.push(...parts);
    } else {
      values.push(line);
    }
  }

  return values;
}

/**
 * Parses CSV file, checking headers and finding registration number column.
 */
async function parseCsvFile(file: File): Promise<string[]> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  // Parse lines into rows
  const parsedRows: string[][] = lines.map((l) => parseCsvLine(l));
  if (parsedRows.length === 0) return [];

  const firstRow = parsedRows[0];
  let regColIndex = -1;

  for (let i = 0; i < firstRow.length; i++) {
    if (isRegistrationHeader(firstRow[i])) {
      regColIndex = i;
      break;
    }
  }

  const values: string[] = [];

  if (regColIndex !== -1) {
    // Header found: extract from subsequent rows
    for (let r = 1; r < parsedRows.length; r++) {
      const val = parsedRows[r][regColIndex]?.trim();
      if (val) values.push(val);
    }
  } else {
    // No recognized header found
    if (firstRow.length === 1) {
      // Single column: if row 0 looks like an unrecognized header, skip or include safely
      const normFirst = normalizeHeader(firstRow[0]);
      const isSuspectedHeader = /^[a-z_]+$/i.test(firstRow[0]) && !/\d/.test(firstRow[0]) && normFirst.length > 2;

      const startIndex = isSuspectedHeader ? 1 : 0;
      for (let r = startIndex; r < parsedRows.length; r++) {
        const val = parsedRows[r][0]?.trim();
        if (val) values.push(val);
      }
    } else {
      throw new Error(
        `Could not find a registration number column in CSV. Found headers: [${firstRow.join(
          ", "
        )}]. Please use 'registrationNumber', 'registration_no', or 'Registration Number'.`
      );
    }
  }

  return values;
}

/**
 * Simple CSV line parser handling quotes.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses XLSX/XLS file preserving text values and leading zeros.
 */
async function parseXlsxFile(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellText: true, raw: false });

  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("Excel workbook contains no sheets.");
  }

  const sheet = wb.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "" });

  const nonEmptyRows = rows.filter((r) => Array.isArray(r) && r.some((c) => String(c).trim().length > 0));
  if (nonEmptyRows.length === 0) return [];

  const firstRow = nonEmptyRows[0].map((c) => String(c).trim());
  let regColIndex = -1;

  for (let i = 0; i < firstRow.length; i++) {
    if (isRegistrationHeader(firstRow[i])) {
      regColIndex = i;
      break;
    }
  }

  const values: string[] = [];

  if (regColIndex !== -1) {
    for (let r = 1; r < nonEmptyRows.length; r++) {
      const val = String(nonEmptyRows[r][regColIndex] ?? "").trim();
      if (val) values.push(val);
    }
  } else {
    if (firstRow.length === 1) {
      const normFirst = normalizeHeader(firstRow[0]);
      const isSuspectedHeader = /^[a-z_]+$/i.test(firstRow[0]) && !/\d/.test(firstRow[0]) && normFirst.length > 2;

      const startIndex = isSuspectedHeader ? 1 : 0;
      for (let r = startIndex; r < nonEmptyRows.length; r++) {
        const val = String(nonEmptyRows[r][0] ?? "").trim();
        if (val) values.push(val);
      }
    } else {
      throw new Error(
        `Could not find a registration number column in the Excel worksheet. Found headers: [${firstRow.join(
          ", "
        )}]. Please name the column 'Registration Number', 'registrationNumber', or 'registration_no'.`
      );
    }
  }

  return values;
}

/**
 * Processes and validates extracted values: counts duplicates, checks format, generates previews.
 */
function processExtractedValues(
  fileName: string,
  fileSize: number,
  values: string[]
): ParsedEnrollmentResult {
  const totalDetected = values.length;
  const invalidEntries: Array<{ regNo: string; reason: string }> = [];
  const countMap = new Map<string, number>(); // upperKey -> count
  const canonicalMap = new Map<string, string>(); // upperKey -> canonical string
  const uniqueOrder: string[] = [];

  for (const raw of values) {
    const trimmed = (raw || "").trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 50) {
      invalidEntries.push({
        regNo: raw,
        reason: "Must be between 2 and 50 characters",
      });
      continue;
    }

    const upperKey = trimmed.toUpperCase();
    const currentCount = countMap.get(upperKey) || 0;
    countMap.set(upperKey, currentCount + 1);

    if (currentCount === 0) {
      canonicalMap.set(upperKey, trimmed);
      uniqueOrder.push(trimmed);
    }
  }

  const duplicatesInFile: Array<{ regNo: string; count: number }> = [];
  for (const [upperKey, count] of countMap.entries()) {
    if (count > 1) {
      duplicatesInFile.push({
        regNo: canonicalMap.get(upperKey) || upperKey,
        count: count - 1,
      });
    }
  }

  const duplicateCount = duplicatesInFile.reduce((acc, curr) => acc + curr.count, 0);

  return {
    fileName,
    fileSize,
    rawEntries: values,
    normalizedUnique: uniqueOrder,
    duplicatesInFile,
    totalDetected,
    uniqueCount: uniqueOrder.length,
    duplicateCount,
    invalidCount: invalidEntries.length,
    invalidEntries,
    preview: uniqueOrder.slice(0, 20),
  };
}
