import { api } from "@/lib/axios";
import { ApiSuccess, Question } from "@/types";

export interface QuestionInput {
  courseId: string;
  text: string;
  marks: number;
  options: { text: string; isCorrect: boolean }[];
}

export interface ParsedOptionPreview {
  text: string;
  isCorrect: boolean;
}

export interface ParsedQuestionItem {
  tempId: string;
  text: string;
  marks: number;
  options: ParsedOptionPreview[];
  isValid: boolean;
  errors: string[];
}

export interface PdfParseResult {
  totalQuestions: number;
  validQuestionsCount: number;
  invalidQuestionsCount: number;
  questions: ParsedQuestionItem[];
}

export const questionService = {
  async list(courseId?: string) {
    const { data } = await api.get<ApiSuccess<Question[]>>("/questions", { params: { courseId } });
    return data.data;
  },
  async getById(id: string) {
    const { data } = await api.get<ApiSuccess<Question>>(`/questions/${id}`);
    return data.data;
  },
  async create(payload: QuestionInput) {
    const { data } = await api.post<ApiSuccess<Question>>("/questions", payload);
    return data.data;
  },
  async update(id: string, payload: Partial<QuestionInput>) {
    const { data } = await api.patch<ApiSuccess<Question>>(`/questions/${id}`, payload);
    return data.data;
  },
  async remove(id: string) {
    await api.delete(`/questions/${id}`);
  },
  async uploadImage(id: string, file: File) {
    const form = new FormData();
    form.append("image", file);
    const { data } = await api.post<ApiSuccess<Question>>(`/questions/${id}/image`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },
  async previewPdfImport(file: File) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<ApiSuccess<PdfParseResult>>("/questions/import-pdf/preview", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },
  async confirmPdfImport(payload: {
    courseId: string;
    questions: { text: string; marks: number; options: { text: string; isCorrect: boolean }[] }[];
  }) {
    const { data } = await api.post<ApiSuccess<{ count: number; questions: Question[] }>>(
      "/questions/import-pdf/confirm",
      payload
    );
    return data.data;
  },
};

