import { api } from "@/lib/axios";
import { ApiSuccess, Course, Student } from "@/types";

export const courseService = {
  async list() {
    const { data } = await api.get<ApiSuccess<Course[]>>("/courses");
    return data.data;
  },
  async getById(id: string) {
    const { data } = await api.get<ApiSuccess<Course>>(`/courses/${id}`);
    return data.data;
  },
  async create(payload: { name: string; code: string }) {
    const { data } = await api.post<ApiSuccess<Course>>("/courses", payload);
    return data.data;
  },
  async update(id: string, payload: Partial<{ name: string; code: string }>) {
    const { data } = await api.patch<ApiSuccess<Course>>(`/courses/${id}`, payload);
    return data.data;
  },
  async remove(id: string) {
    await api.delete(`/courses/${id}`);
  },
  async listStudents(id: string) {
    const { data } = await api.get<ApiSuccess<Student[]>>(`/courses/${id}/students`);
    return data.data;
  },
  async enrollStudent(id: string, regNo: string) {
    const { data } = await api.post<ApiSuccess<Student>>(`/courses/${id}/students`, { regNo });
    return data.data;
  },
  async unenrollStudent(id: string, studentId: string) {
    await api.delete(`/courses/${id}/students/${studentId}`);
  },
};
