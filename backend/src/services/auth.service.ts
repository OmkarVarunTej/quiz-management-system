import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { Role } from "../constants/roles";
import { Messages } from "../constants/messages";

export const authService = {
  async registerFaculty(name: string, email: string, password: string) {
    const existing = await prisma.faculty.findUnique({ where: { email } });
    if (existing) throw ApiError.conflict(Messages.AUTH.EMAIL_TAKEN);

    const hashed = await hashPassword(password);
    const faculty = await prisma.faculty.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    const token = signToken({ id: faculty.id, role: Role.FACULTY, email: faculty.email });
    return { faculty, token };
  },

  async loginFaculty(email: string, password: string) {
    const faculty = await prisma.faculty.findUnique({ where: { email } });
    if (!faculty) throw ApiError.unauthorized(Messages.AUTH.INVALID_CREDENTIALS);

    const valid = await comparePassword(password, faculty.password);
    if (!valid) throw ApiError.unauthorized(Messages.AUTH.INVALID_CREDENTIALS);

    const token = signToken({ id: faculty.id, role: Role.FACULTY, email: faculty.email });
    return {
      faculty: { id: faculty.id, name: faculty.name, email: faculty.email },
      token,
    };
  },

  async registerStudent(name: string, regNo: string, email: string, password: string) {
    const [existingEmail, existingRegNo] = await Promise.all([
      prisma.student.findUnique({ where: { email } }),
      prisma.student.findUnique({ where: { regNo } }),
    ]);
    if (existingEmail) throw ApiError.conflict(Messages.AUTH.EMAIL_TAKEN);
    if (existingRegNo) throw ApiError.conflict(Messages.AUTH.REGNO_TAKEN);

    const hashed = await hashPassword(password);
    const student = await prisma.student.create({
      data: { name, regNo, email, password: hashed },
      select: { id: true, name: true, regNo: true, email: true, createdAt: true },
    });

    const token = signToken({ id: student.id, role: Role.STUDENT, email: student.email });
    return { student, token };
  },

  async loginStudent(email: string, password: string) {
    const student = await prisma.student.findUnique({ where: { email } });
    if (!student) throw ApiError.unauthorized(Messages.AUTH.INVALID_CREDENTIALS);

    const valid = await comparePassword(password, student.password);
    if (!valid) throw ApiError.unauthorized(Messages.AUTH.INVALID_CREDENTIALS);

    const token = signToken({ id: student.id, role: Role.STUDENT, email: student.email });
    return {
      student: { id: student.id, name: student.name, regNo: student.regNo, email: student.email },
      token,
    };
  },

  async getMe(id: string, role: string) {
    if (role === Role.FACULTY) {
      const faculty = await prisma.faculty.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, createdAt: true },
      });
      if (!faculty) throw ApiError.notFound(Messages.GENERIC.NOT_FOUND("Faculty"));
      return { ...faculty, role: Role.FACULTY };
    }
    const student = await prisma.student.findUnique({
      where: { id },
      select: { id: true, name: true, regNo: true, email: true, createdAt: true },
    });
    if (!student) throw ApiError.notFound(Messages.GENERIC.NOT_FOUND("Student"));
    return { ...student, role: Role.STUDENT };
  },
};
