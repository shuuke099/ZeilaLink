import "../src/config/env";

import { PrismaClient, UserRole } from "@prisma/client";

import { hashPassword, validatePassword } from "../src/utils/password";

const prisma = new PrismaClient();
const ADMIN_ID = "seed-user-admin";
const ADMIN_EMAIL = "abduladimabdullahi95@gmail.com";

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD;
  const passwordError = validatePassword(password);

  if (passwordError) {
    throw new Error(`SEED_ADMIN_PASSWORD: ${passwordError}`);
  }

  const passwordHash = await hashPassword(password as string);
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ id: ADMIN_ID }, { email: ADMIN_EMAIL }],
    },
    select: { id: true },
  });

  const adminData = {
    name: "Abduladim Abdullahi",
    email: ADMIN_EMAIL,
    passwordHash,
    role: UserRole.admin,
    isVerified: true,
    profilePublic: false,
    preferredLanguage: "en",
    verificationToken: null,
    verificationExpires: null,
  };

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: adminData,
    });
  } else {
    await prisma.user.create({
      data: {
        id: ADMIN_ID,
        slug: "admin-user",
        location: "Minneapolis, MN",
        bio: "ZeilaLink platform administrator.",
        bioSo: "Maamulaha madasha ZeilaLink.",
        headline: "Platform Administrator",
        headlineSo: "Maamulaha Madasha",
        avatarUrl:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=500&q=80",
        ...adminData,
      },
    });
  }

  console.log(`Admin seed completed for ${ADMIN_EMAIL}.`);
}

main()
  .catch((error) => {
    console.error("Admin seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
