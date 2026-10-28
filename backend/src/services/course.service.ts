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

    const alreadyEnrolled = await prisma.course.findFirst({
      where: { id: courseId, students: { some: { id: student.id } } },
    });
    if (alreadyEnrolled) {
      throw ApiError.conflict("Student is already enrolled in this course");
    }

    await prisma.course.update({
      where: { id: courseId },
      data: { students: { connect: { id: student.id } } },
    });
    return student;
  },

  async bulkEnrollStudents(
    courseId: string,
    facultyId: string,
    rawRegistrationNumbers: string[],
    dryRun = false
  ) {
    await this.assertOwnership(courseId, facultyId);

    const totalSubmitted = rawRegistrationNumbers.length;
    const invalid: Array<{ regNo: string; reason: string }> = [];
    const duplicates: Array<{ regNo: string; reason: string }> = [];
    const uniqueMap = new Map<string, string>(); // upperCaseKey -> originalTrimmed

    for (const raw of rawRegistrationNumbers) {
      if (typeof raw !== "string") {
        invalid.push({ regNo: String(raw), reason: "Registration number must be a string" });
        continue;
      }
      const trimmed = raw.trim();
      if (!trimmed || trimmed.length < 2 || trimmed.length > 50) {
        invalid.push({
          regNo: raw,
          reason: "Registration number must be between 2 and 50 characters",
        });
        continue;
      }

      const upperKey = trimmed.toUpperCase();
      if (uniqueMap.has(upperKey)) {
        duplicates.push({
          regNo: trimmed,
          reason: "Duplicate registration number in submitted list",
        });
      } else {
        uniqueMap.set(upperKey, trimmed);
      }
    }

    const uniqueRegNos = Array.from(uniqueMap.values());
    const uniqueRegistrationNumbers = uniqueRegNos.length;

    const enrolled: Array<{ id: string; regNo: string; name: string; email: string }> = [];
    const alreadyEnrolled: Array<{ id: string; regNo: string; name: string; email: string; reason: string }> = [];
    const notFound: Array<{ regNo: string; reason: string }> = [];

    if (uniqueRegNos.length > 0) {
      const dbStudents = await prisma.student.findMany({
        where: {
          OR: [
            { regNo: { in: uniqueRegNos } },
            { regNo: { in: Array.from(uniqueMap.keys()) } },
          ],
        },
        select: {
          id: true,
          name: true,
          regNo: true,
          email: true,
          courses: {
            where: { id: courseId },
            select: { id: true },
          },
        },
      });

      const dbStudentByUpper = new Map<string, (typeof dbStudents)[0]>();
      for (const s of dbStudents) {
        dbStudentByUpper.set(s.regNo.toUpperCase(), s);
      }

      const eligibleToConnect: Array<{ id: string; regNo: string; name: string; email: string }> = [];

      for (const regNo of uniqueRegNos) {
        const student = dbStudentByUpper.get(regNo.toUpperCase());
        if (!student) {
          notFound.push({
            regNo,
            reason: "Student not found in system",
          });
        } else if (student.courses && student.courses.length > 0) {
          alreadyEnrolled.push({
            id: student.id,
            regNo: student.regNo,
            name: student.name,
            email: student.email,
            reason: "Student is already enrolled in this course",
          });
        } else {
          eligibleToConnect.push({
            id: student.id,
            regNo: student.regNo,
            name: student.name,
            email: student.email,
          });
        }
      }

      if (!dryRun && eligibleToConnect.length > 0) {
        await prisma.$transaction(async (tx) => {
          await tx.course.update({
            where: { id: courseId },
            data: {
              students: {
                connect: eligibleToConnect.map((s) => ({ id: s.id })),
              },
            },
          });
        });
      }

      for (const s of eligibleToConnect) {
        enrolled.push(s);
      }
    }

    const summary = {
      totalSubmitted,
      uniqueRegistrationNumbers,
      enrolled: enrolled.length,
      alreadyEnrolled: alreadyEnrolled.length,
      notFound: notFound.length,
      invalid: invalid.length,
      duplicatesInFile: duplicates.length,
    };

    return {
      summary,
      results: {
        enrolled,
        alreadyEnrolled,
        notFound,
        invalid,
        duplicates,
      },
    };
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
