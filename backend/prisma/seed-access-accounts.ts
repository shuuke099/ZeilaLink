import "../src/config/env";

import { PrismaClient, UserRole } from "@prisma/client";

import { hashPassword, validatePassword } from "../src/utils/password";

const prisma = new PrismaClient();

const accounts = {
  admin: {
    id: "seed-user-admin",
    email: "abduladimabdullahi95@gmail.com",
    name: "Admin User",
    slug: "admin-user",
    role: UserRole.admin,
  },
  employer: {
    id: "seed-user-abdi-hassan",
    email: "abdi.hassan@example.com",
    name: "Abdi Hassan",
    slug: "abdi-hassan",
    role: UserRole.employer,
  },
  provider: {
    id: "seed-user-amina-nur",
    email: "amina.nur@example.com",
    name: "Amina Nur",
    slug: "amina-nur",
    role: UserRole.provider,
  },
} as const;

async function upsertUser(
  account: (typeof accounts)[keyof typeof accounts],
  passwordHash: string,
) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ id: account.id }, { email: account.email }] },
    select: { id: true },
  });
  const data = {
      email: account.email,
      name: account.name,
      role: account.role,
      passwordHash,
      isVerified: true,
      verificationToken: null,
      verificationExpires: null,
  };

  if (existing) {
    return prisma.user.update({ where: { id: existing.id }, data });
  }

  return prisma.user.create({
    data: {
      ...account,
      passwordHash,
      isVerified: true,
      profilePublic: account.role !== UserRole.admin,
      preferredLanguage: "en",
    },
  });
}

async function main() {
  const password = process.env.SEED_ACCESS_PASSWORD;
  const passwordError = validatePassword(password);
  if (passwordError) {
    throw new Error(`SEED_ACCESS_PASSWORD: ${passwordError}`);
  }

  const passwordHash = await hashPassword(password as string);
  const admin = await upsertUser(accounts.admin, passwordHash);
  const employerUser = await upsertUser(accounts.employer, passwordHash);
  const providerUser = await upsertUser(accounts.provider, passwordHash);

  await prisma.employer.upsert({
    where: { id: "seed-employer-safari-restaurant" },
    update: {
      userId: employerUser.id,
      verified: true,
      active: true,
    },
    create: {
      id: "seed-employer-safari-restaurant",
      slug: "safari-restaurant-employer",
      userId: employerUser.id,
      name: "Safari Restaurant",
      email: employerUser.email,
      city: "Minneapolis",
      state: "MN",
      country: "US",
      verified: true,
      verifiedAt: new Date(),
      active: true,
    },
  });

  await prisma.provider.upsert({
    where: { id: "seed-provider-northstar-career-center" },
    update: {
      contactUserId: providerUser.id,
      verified: true,
      active: true,
    },
    create: {
      id: "seed-provider-northstar-career-center",
      slug: "northstar-career-center",
      contactUserId: providerUser.id,
      name: "Northstar Career Center",
      email: providerUser.email,
      city: "Minneapolis",
      state: "MN",
      country: "US",
      timezone: "America/Chicago",
      verified: true,
      verifiedAt: new Date(),
      active: true,
    },
  });

  console.log("Access account seed completed.");
  console.log(`Admin: ${admin.email}`);
  console.log(`Employer: ${employerUser.email}`);
  console.log(`Provider: ${providerUser.email}`);
}

main()
  .catch((error) => {
    console.error("Access account seed failed.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
