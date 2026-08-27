import { PrismaClient } from "@prisma/client";

export async function seedWorkerPreferences(prisma: PrismaClient, users: any) {
  const preferences = [
    {
      userId: users.hodanAli.id,
      employmentType: "Full-time",
      shiftPreference: "Day",
      desiredSalaryMin: 20,
      desiredSalaryMax: 30,
      salaryCurrency: "USD",
      salaryPeriod: "hour",
    },
    {
      userId: users.fadumoYusuf.id,
      employmentType: "Full-time",
      shiftPreference: "Day",
      desiredSalaryMin: 18,
      desiredSalaryMax: 25,
      salaryCurrency: "USD",
      salaryPeriod: "hour",
    },
    {
      userId: users.ahmedOmar.id,
      employmentType: "Full-time",
      shiftPreference: "Flexible",
      desiredSalaryMin: 60000,
      desiredSalaryMax: 85000,
      salaryCurrency: "USD",
      salaryPeriod: "year",
    },
    {
      userId: users.sahraMohamed.id,
      employmentType: "Part-time",
      shiftPreference: "Flexible",
      desiredSalaryMin: 22,
      desiredSalaryMax: 32,
      salaryCurrency: "USD",
      salaryPeriod: "hour",
    },
    {
      userId: users.nimcoAden.id,
      employmentType: "Full-time",
      shiftPreference: "Day",
      desiredSalaryMin: 20,
      desiredSalaryMax: 28,
      salaryCurrency: "USD",
      salaryPeriod: "hour",
    },
  ];

  for (const preference of preferences) {
    await prisma.workerPreference.upsert({
      where: {
        userId: preference.userId,
      },
      update: preference,
      create: preference,
    });
  }
}
