import { PrismaClient } from "@prisma/client";

export async function seedWorkerLanguages(prisma: PrismaClient, users: any) {
  const languages = [
    {
      userId: users.hodanAli.id,
      language: "Somali",
      level: "Native",
    },
    {
      userId: users.hodanAli.id,
      language: "English",
      level: "Fluent",
    },
    {
      userId: users.fadumoYusuf.id,
      language: "Somali",
      level: "Native",
    },
    {
      userId: users.ahmedOmar.id,
      language: "English",
      level: "Fluent",
    },
    {
      userId: users.sahraMohamed.id,
      language: "Somali",
      level: "Native",
    },
  ];

  for (const language of languages) {
    await prisma.workerLanguage.upsert({
      where: {
        userId_language: {
          userId: language.userId,
          language: language.language,
        },
      },
      update: {
        level: language.level,
      },
      create: language,
    });
  }
}
