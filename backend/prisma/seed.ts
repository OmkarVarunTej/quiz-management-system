import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  const faculty = await prisma.faculty.upsert({
    where: { email: "faculty@example.com" },
    update: {},
    create: { name: "Dr. Faculty Demo", email: "faculty@example.com", password },
  });

  const student = await prisma.student.upsert({
    where: { email: "student@example.com" },
    update: {},
    create: { name: "Student Demo", regNo: "REG2026001", email: "student@example.com", password },
  });

  const course = await prisma.course.upsert({
    where: { code: "CS101" },
    update: {},
    create: {
      name: "Cloud Computing",
      code: "CS101",
      facultyId: faculty.id,
      students: { connect: { id: student.id } },
    },
  });

  const q1 = await prisma.question.create({
    data: {
      facultyId: faculty.id,
      courseId: course.id,
      text: "Which of these is an IaaS provider?",
      marks: 2,
      options: {
        create: [
          { text: "AWS EC2", isCorrect: true },
          { text: "Google Docs", isCorrect: false },
          { text: "Notion", isCorrect: false },
          { text: "Figma", isCorrect: false },
        ],
      },
    },
  });

  const q2 = await prisma.question.create({
    data: {
      facultyId: faculty.id,
      courseId: course.id,
      text: "PaaS stands for Platform as a Service.",
      marks: 1,
      options: {
        create: [
          { text: "True", isCorrect: true },
          { text: "False", isCorrect: false },
        ],
      },
    },
  });

  const quiz = await prisma.quiz.create({
    data: {
      courseId: course.id,
      title: "Cloud Basics Quiz",
      description: "A short quiz on cloud computing fundamentals",
      durationMinutes: 15,
      totalMarks: 3,
      quizQuestions: {
        create: [
          { questionId: q1.id, order: 0 },
          { questionId: q2.id, order: 1 },
        ],
      },
    },
  });

  console.log("Seed complete:");
  console.log({ faculty: faculty.email, student: student.email, course: course.code, quiz: quiz.title });
  console.log("Demo password for both accounts: Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
