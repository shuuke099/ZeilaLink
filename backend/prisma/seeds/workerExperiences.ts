import { PrismaClient } from "@prisma/client";

export async function seedWorkerExperiences(prisma: PrismaClient, users: any) {
  const experiences = [
    {
      id: "seed-experience-1",
      userId: users.hodanAli.id,
      jobTitle: "Photographer",
      company: "Freelance",
      startDate: new Date("2022-01-01"),
      endDate: null,
      isCurrent: true,
      achievements:
        "Photographed weddings, family events, and community programs.",
    },
    {
      id: "seed-experience-2",
      userId: users.fadumoYusuf.id,
      jobTitle: "Cleaning Associate",
      company: "Twin Cities Cleaning Services",
      startDate: new Date("2023-03-01"),
      endDate: null,
      isCurrent: true,
      achievements:
        "Provided residential cleaning and maintained strong customer satisfaction.",
    },
    {
      id: "seed-experience-3",
      userId: users.ahmedOmar.id,
      jobTitle: "Junior Web Developer",
      company: "Digital Solutions LLC",
      startDate: new Date("2024-01-01"),
      endDate: null,
      isCurrent: true,
      achievements:
        "Built responsive websites and maintained web applications.",
    },
    {
      id: "seed-experience-4",
      userId: users.sahraMohamed.id,
      jobTitle: "Interpreter",
      company: "Community Language Services",
      startDate: new Date("2023-06-01"),
      endDate: null,
      isCurrent: true,
      achievements:
        "Provided Somali-English interpretation for community members.",
    },
    {
      id: "seed-experience-5",
      userId: users.nimcoAden.id,
      jobTitle: "Community Support Specialist",
      company: "Community Resource Center",
      startDate: new Date("2022-08-01"),
      endDate: new Date("2025-12-31"),
      isCurrent: false,
      achievements:
        "Helped families connect with local resources and services.",
    },
  ];

  for (const experience of experiences) {
    await prisma.workerExperience.upsert({
      where: { id: experience.id },
      update: experience,
      create: experience,
    });
  }
}
