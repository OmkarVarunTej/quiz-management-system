import pdfParse from "pdf-parse";

export interface ParsedOption {
  text: string;
  isCorrect: boolean;
}

export interface ParsedQuestion {
  tempId: string;
  text: string;
  marks: number;
  options: ParsedOption[];
  isValid: boolean;
  errors: string[];
}

export interface ParseResult {
  totalQuestions: number;
  validQuestionsCount: number;
  invalidQuestionsCount: number;
  questions: ParsedQuestion[];
  rawTextPreview?: string;
}

/**
 * Extracts raw text from a PDF buffer using pdf-parse.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text || "";
}

/**
 * Normalizes text extracted from PDF.
 */
export function normalizePdfText(rawText: string): string[] {
  return rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Replace non-breaking spaces and form feeds
    .replace(/[\u00A0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\f]/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

// Regex patterns for Question boundaries
const QUESTION_START_REGEX = /^(?:(?:Q(?:uestion)?[\s\.\:\-]*\d+[\.\)\:\-]*)|(?:\d+[\.\)\:\-]))\s*(.*)$/i;

// Regex patterns for Option prefixes
const OPTION_LETTER_REGEX = /^(?:\(?([A-Ha-h])[\.\)\:\-]\s*|\(([A-Ha-h])\)\s*)(.*)$/;
const OPTION_NUMBER_REGEX = /^(?:\(?([1-8])[\.\)\:\-]\s*|\(([1-8])\)\s*)(.*)$/;

// Regex patterns for Answer lines
const ANSWER_LINE_REGEX = /^(?:(?:correct\s+)?(?:answer|ans|key)\s*[\:\-\=]\s*|\banswer\s+is\s+)(.*)$/i;

// Regex for extracting marks, e.g., [2 marks], (1 mark), [Marks: 2], [2 pts]
const MARKS_REGEX = /(?:\[|\()(?:\s*marks?\s*[\:\=]?\s*|\s*pts?\s*[\:\=]?\s*)?(\d+)\s*(?:marks?|pts?|points?)?(?:\]|\))/i;

interface RawBlock {
  questionLines: string[];
  options: { label: string; textLines: string[] }[];
  answerLine?: string;
}

/**
 * Parses normalized lines into structured MCQ question blocks.
 */
export function parseMcqLines(lines: string[]): ParsedQuestion[] {
  const blocks: RawBlock[] = [];
  let currentBlock: RawBlock | null = null;
  let currentOption: { label: string; textLines: string[] } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Check if line is an Answer declaration
    const answerMatch = line.match(ANSWER_LINE_REGEX);
    if (answerMatch && currentBlock) {
      currentBlock.answerLine = answerMatch[1].trim();
      currentOption = null;
      continue;
    }

    const isExplicitQuestion = /^(?:Q(?:uestion)?[\s\.\:\-]*\d+)/i.test(line);
    const questionMatch = line.match(QUESTION_START_REGEX);
    const letterMatch = line.match(OPTION_LETTER_REGEX);
    const numberMatch = line.match(OPTION_NUMBER_REGEX);

    // 2. Check if this is a continuation numbered option (e.g. "2. Second item" when previous option was "1")
    const isNumberedOptionContinuation =
      Boolean(numberMatch &&
      currentBlock &&
      !currentBlock.answerLine &&
      currentBlock.options.length > 0 &&
      /^[1-8]$/.test(currentBlock.options[currentBlock.options.length - 1].label));

    // 3. Check if this is a new question
    let isNewQuestion = false;
    const hasLetterOptions = Boolean(currentBlock && currentBlock.options.some((o) => /^[A-Z]$/i.test(o.label)));

    if (isExplicitQuestion) {
      isNewQuestion = true;
    } else if (questionMatch && !isNumberedOptionContinuation) {
      if (!currentBlock) {
        isNewQuestion = true;
      } else if (currentBlock.answerLine) {
        // If current question already has an answer line, any numbered line starts a new question
        isNewQuestion = true;
      } else if (hasLetterOptions) {
        // If current question has letter options (A, B, C, D), any numbered line (e.g. 5. ...) is a new question
        isNewQuestion = true;
      } else if (currentBlock.options.length >= 2 && !numberMatch) {
        isNewQuestion = true;
      }
    }


    if (isNewQuestion) {
      currentBlock = {
        questionLines: [questionMatch ? questionMatch[1] || line : line],
        options: [],
      };
      blocks.push(currentBlock);
      currentOption = null;
      continue;
    }

    // 4. If we don't have an active question block
    if (!currentBlock) {
      if (line.endsWith("?") || line.includes("?")) {
        currentBlock = { questionLines: [line], options: [] };
        blocks.push(currentBlock);
      }
      continue;
    }

    // 5. Check for Option matches (Letter options: A-H, or Numbered options: 1-8)
    if (letterMatch && !currentBlock.answerLine) {
      const label = (letterMatch[1] || letterMatch[2]).toUpperCase();
      currentOption = { label, textLines: [letterMatch[3].trim()] };
      currentBlock.options.push(currentOption);
      continue;
    }

    if (numberMatch && !currentBlock.answerLine) {
      const label = numberMatch[1] || numberMatch[2];
      const isFirstNumberedOption = currentBlock.options.length === 0 && (label === "1" || /^\([1-8]\)/.test(line));
      const isNextNumberedOption = isNumberedOptionContinuation;

      if (isFirstNumberedOption || isNextNumberedOption) {
        currentOption = { label, textLines: [numberMatch[3].trim()] };
        currentBlock.options.push(currentOption);
        continue;
      }
    }

    // 6. Continuation lines
    if (currentOption && !currentBlock.answerLine) {
      currentOption.textLines.push(line);
    } else if (!currentBlock.options.length) {
      currentBlock.questionLines.push(line);
    }
  }


  // Convert raw blocks to ParsedQuestion items
  return blocks.map((block, index) => {
    const rawQuestionText = block.questionLines.join(" ").trim();

    // Extract marks if specified
    let marks = 1;
    let cleanText = rawQuestionText;
    const marksMatch = rawQuestionText.match(MARKS_REGEX);
    if (marksMatch && marksMatch[1]) {
      const parsedMarks = parseInt(marksMatch[1], 10);
      if (!isNaN(parsedMarks) && parsedMarks > 0 && parsedMarks <= 100) {
        marks = parsedMarks;
      }
      cleanText = rawQuestionText.replace(marksMatch[0], "").trim();
    }

    cleanText = cleanText.replace(/^[\.\)\:\-\s]+/, "").trim();

    // Normalize answer target
    let detectedAnswerLabel = "";
    if (block.answerLine) {
      const labelMatch = block.answerLine.match(/\b([A-Ha-h1-8])\b/);
      if (labelMatch) {
        detectedAnswerLabel = labelMatch[1].toUpperCase();
      }
    }

    // Prepare options
    const parsedOptions: ParsedOption[] = block.options.map((opt, optIndex) => {
      const optText = opt.textLines.join(" ").trim();
      let isCorrect = false;

      if (detectedAnswerLabel) {
        if (opt.label === detectedAnswerLabel) {
          isCorrect = true;
        } else if (
          // Handle cases where label is numeric index e.g. Answer: 2 for 2nd option
          String(optIndex + 1) === detectedAnswerLabel
        ) {
          isCorrect = true;
        }
      } else if (block.answerLine) {
        // Fallback: Check if answer text contains or matches option text
        const ansLower = block.answerLine.toLowerCase();
        const optLower = optText.toLowerCase();
        if (optLower.length > 2 && ansLower.includes(optLower)) {
          isCorrect = true;
        }
      }

      return {
        text: optText,
        isCorrect,
      };
    });

    // Validation checks
    const errors: string[] = [];

    if (cleanText.length < 3) {
      errors.push("Question text is too short (minimum 3 characters)");
    }

    if (parsedOptions.length < 2) {
      errors.push(`At least 2 options are required (found ${parsedOptions.length})`);
    } else if (parsedOptions.length > 8) {
      errors.push(`Maximum 8 options supported (found ${parsedOptions.length})`);
    }

    const emptyOptions = parsedOptions.filter((o) => !o.text || o.text.trim().length === 0);
    if (emptyOptions.length > 0) {
      errors.push("One or more options have empty text");
    }

    const correctCount = parsedOptions.filter((o) => o.isCorrect).length;
    if (correctCount === 0) {
      errors.push("No correct answer detected. Please select the correct option.");
    }

    return {
      tempId: `pdf-q-${index + 1}-${Date.now().toString(36)}`,
      text: cleanText,
      marks,
      options: parsedOptions,
      isValid: errors.length === 0,
      errors,
    };
  });
}

/**
 * Main helper to parse questions from a PDF buffer.
 */
export async function parsePdfQuestions(buffer: Buffer): Promise<ParseResult> {
  const rawText = await extractTextFromPdf(buffer);
  const lines = normalizePdfText(rawText);
  const questions = parseMcqLines(lines);

  const validQuestionsCount = questions.filter((q) => q.isValid).length;
  const invalidQuestionsCount = questions.length - validQuestionsCount;

  return {
    totalQuestions: questions.length,
    validQuestionsCount,
    invalidQuestionsCount,
    questions,
    rawTextPreview: rawText.slice(0, 500),
  };
}
