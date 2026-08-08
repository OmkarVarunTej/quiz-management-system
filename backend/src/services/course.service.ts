import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { Messages } from "../constants/messages";

export const courseService = {
  async create(facultyId: string, name: string, code: string) {
    const existing = await prisma.course.findUnique({ where: { code } });
    if (existing) throw ApiError.conflict("A course with this code already exists");

    return prisma.course.create({
      data: { name, code, facultyId },
    });
  },

  async listForFaculty(facultyId: string) {
    return prisma.course.findMany({
      where: { facultyId },
      include: { _count: { select: { students: true, quizzes: true, questions: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async listForStudent(studentId: string) {
    return prisma.course.findMany({
      where: { students: { some: { id: studentId } } },
      include: { faculty: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        faculty: { select: { id: true, name: true, email: true } },
        _count: { select: { students: true, quizzes: true, questions: true } },
      },
    });
    if (!course) throw ApiError.notFound(Messages.GENERIC.NOT_FOUND("Course"));
    return course;
  },

  async assertOwnership(courseId: string, facultyId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound(Messages.GENERIC.NOT_FOUND("Course"));
    if (course.facultyId !== facultyId) throw ApiError.forbidden("You do not own this course");
    return course;
  },

  async update(id: string, facultyId: string, data: { name?: string; code?: string }) {
    await this.assertOwnership(id, facultyId);
    return prisma.course.update({ where: { id }, data });
  },

  async remove(id: string, facultyId: string) {
    await this.assertOwnership(id, facultyId);
    await prisma.course.delete({ where: { id } });
  },

  async enrollStudent(courseId: string, facultyId: string, regNo: string) {
    await this.assertOwnership(courseId, facultyId);
    const student = await prisma.student.findUnique({ where: { regNo } });
    if (!student) throw ApiError.notFound(Messages.GENERIC.NOT_FOUND("Student"));

    await prisma.course.update({
      where: { id: courseId },
      data: { students: { connect: { id: student.id } } },
    });
    return student;
  },

  async unenrollStudent(courseId: string, facultyId: string, studentId: string) {
    await this.assertOwnership(courseId, facultyId);
    await prisma.course.update({
      where: { id: courseId },
      data: { students: { disconnect: { id: studentId } } },
    });
  },

  async listStudents(courseId: string, facultyId: string) {
    await this.assertOwnership(courseId, facultyId);
    return prisma.student.findMany({
      where: { courses: { some: { id: courseId } } },
      select: { id: true, name: true, regNo: true, email: true },
      orderBy: { regNo: "asc" },
    });
  },
};
