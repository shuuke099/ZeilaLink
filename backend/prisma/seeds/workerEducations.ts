import { PrismaClient } from "@prisma/client";

export async function seedWorkerEducations(prisma: PrismaClient, users: any) {
  const educations = [
    {
      id: "seed-education-1",
      userId: users.hodanAli.id,
      degreeLevel: "Certificate",
      institution: "Minneapolis College",
      fieldOfStudy: "Photography",
      isVerified: true,
      startDate: new Date("2021-09-01"),
      endDate: new Date("2022-05-01"),
      isCurrent: false,
    },
    {
      id: "seed-education-2",
      userId: users.fadumoYusuf.id,
      degreeLevel: "High School Diploma",
      institution: "Roosevelt High School",
      fieldOfStudy: null,
      isVerified: true,
      startDate: null,
      endDate: new Date("2021-06-01"),
      isCurrent: false,
    },
    {
      id: "seed-education-3",
      userId: users.ahmedOmar.id,
      degreeLevel: "Associate Degree",
      institution: "Minneapolis College",
      fieldOfStudy: "Computer Science",
      isVerified: true,
      startDate: new Date("2023-08-01"),
      endDate: new Date("2025-05-01"),
      isCurrent: false,
    },
    {
      id: "seed-education-4",
      userId: users.sahraMohamed.id,
      degreeLevel: "Bachelor Degree",
      institution: "University of Minnesota",
      fieldOfStudy: "Communication",
      isVerified: true,
      startDate: new Date("2020-09-01"),
      endDate: new Date("2024-05-01"),
      isCurrent: false,
    },
    {
      id: "seed-education-5",
      userId: users.nimcoAden.id,
      degreeLevel: "Associate Degree",
      institution: "Saint Paul College",
      fieldOfStudy: "Human Services",
      isVerified: true,
      startDate: new Date("2024-08-01"),
      endDate: null,
      isCurrent: true,
    },
  ];

  for (const education of educations) {
    await prisma.workerEducation.upsert({
      where: { id: education.id },
      update: education,
      create: education,
    });
  }
}
