export type Role = "FACULTY" | "STUDENT";

export type QuizStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type StudentQuizStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED";
export type AnswerStatus = "CORRECT" | "WRONG" | "SKIPPED";

export interface Faculty {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  regNo: string;
  email: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  regNo?: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  facultyId: string;
  faculty?: { id: string; name: string; email?: string };
  createdAt: string;
  updatedAt: string;
  _count?: { students: number; quizzes: number; questions: number };
}

export interface Option {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  facultyId: string;
  courseId: string;
  text: string;
  imageUrl: string | null;
  marks: number;
  options: Option[];
  course?: { id: string; name: string; code: string };
  createdAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  course?: { id: string; name: string; code: string };
  durationMinutes: number;
  totalMarks: number;
  status: QuizStatus;
  startTime: string | null;
  endTime: string | null;
  resultsPublished: boolean;
  createdAt: string;
  quizQuestions?: { id: string; order: number; question: Question }[];
  studentQuizzes?: { id: string; status: StudentQuizStatus }[];
  _count?: { quizQuestions: number; studentQuizzes: number };
}

export interface SessionQuestion {
  id: string;
  text: string;
  imageUrl: string | null;
  marks: number;
  options: { id: string; text: string }[];
  selectedOptionId: string | null;
}

export interface QuizSession {
  studentQuizId: string;
  quizId: string;
  title: string;
  durationMinutes: number;
  remainingSeconds: number;
  status: StudentQuizStatus;
  questions: SessionQuestion[];
}

export interface ResultSummary {
  id: string;
  studentQuizId: string;
  studentId: string;
  quizId: string;
  totalMarks: number;
  obtainedMarks: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  published: boolean;
  publishedAt: string | null;
  student?: { id: string; name: string; regNo: string; email: string };
  quiz?: { id: string; title: string; totalMarks: number };
}

export interface ResultDetailAnswer {
  question: string;
  marks: number;
  marksAwarded: number;
  status: AnswerStatus;
  selectedOption: string | null;
  correctOption: string | null;
  options: { id: string; text: string; isCorrect: boolean }[];
}

export interface ResultDetail {
  quiz: { id: string; title: string; totalMarks: number };
  totalMarks: number;
  obtainedMarks: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  answers: ResultDetailAnswer[];
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: unknown;
}
