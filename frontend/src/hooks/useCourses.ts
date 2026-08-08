import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { courseService } from "@/services/course.service";

export const courseKeys = {
  all: ["courses"] as const,
  detail: (id: string) => ["courses", id] as const,
  students: (id: string) => ["courses", id, "students"] as const,
};

export function useCourses() {
  return useQuery({ queryKey: courseKeys.all, queryFn: courseService.list });
}

export function useCourse(id?: string) {
  return useQuery({
    queryKey: courseKeys.detail(id!),
    queryFn: () => courseService.getById(id!),
    enabled: !!id,
  });
}

export function useCourseStudents(id?: string) {
  return useQuery({
    queryKey: courseKeys.students(id!),
    queryFn: () => courseService.listStudents(id!),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: courseService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.all }),
  });
}

export function useUpdateCourse(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof courseService.update>[1]) => courseService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.all });
      qc.invalidateQueries({ queryKey: courseKeys.detail(id) });
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: courseService.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.all }),
  });
}

export function useEnrollStudent(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (regNo: string) => courseService.enrollStudent(courseId, regNo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.students(courseId) });
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
}

export function useUnenrollStudent(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => courseService.unenrollStudent(courseId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.students(courseId) });
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
}
