import { PrismaClient } from "@prisma/client";

export async function seedUserSkills(
  prisma: PrismaClient,
  users: any,
  skills: any,
) {
  const userSkills = [
    {
      userId: users.hodanAli.id,
      skillId: skills.customerService.id,
      level: "advanced",
    },
    {
      userId: users.hodanAli.id,
      skillId: skills.conflictResolution.id,
      level: "intermediate",
    },

    {
      userId: users.fadumoYusuf.id,
      skillId: skills.customerService.id,
      level: "intermediate",
    },

    {
      userId: users.ahmedOmar.id,
      skillId: skills.html.id,
      level: "advanced",
    },
    {
      userId: users.ahmedOmar.id,
      skillId: skills.css.id,
      level: "advanced",
    },
    {
      userId: users.ahmedOmar.id,
      skillId: skills.javascript.id,
      level: "advanced",
    },
    {
      userId: users.ahmedOmar.id,
      skillId: skills.react.id,
      level: "intermediate",
    },
    {
      userId: users.ahmedOmar.id,
      skillId: skills.nodejs.id,
      level: "intermediate",
    },
    {
      userId: users.ahmedOmar.id,
      skillId: skills.databases.id,
      level: "intermediate",
    },

    {
      userId: users.sahraMohamed.id,
      skillId: skills.translation.id,
      level: "advanced",
    },
    {
      userId: users.sahraMohamed.id,
      skillId: skills.interpretation.id,
      level: "advanced",
    },

    {
      userId: users.nimcoAden.id,
      skillId: skills.customerService.id,
      level: "intermediate",
    },
    {
      userId: users.nimcoAden.id,
      skillId: skills.conflictResolution.id,
      level: "intermediate",
    },
  ];

  for (const userSkill of userSkills) {
    await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId: userSkill.userId,
          skillId: userSkill.skillId,
        },
      },
      update: {
        level: userSkill.level,
      },
      create: userSkill,
    });
  }
}
