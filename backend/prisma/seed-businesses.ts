import "../src/config/env";

import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { seedBusinesses } from "./seeds/businesses";
import { seedUsers } from "./seeds/users";

const prisma = new PrismaClient();

async function loadOwners() {
  const [admin, worker, employee, employerUser, providerUser] = await Promise.all([
    prisma.user.findUnique({ where: { email: "admin@zeilalink.com" }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: "hodan.ali@example.com" }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: "fadumo.yusuf@example.com" }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: "abdi.hassan@example.com" }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: "amina.nur@example.com" }, select: { id: true } }),
  ]);
  return admin && worker && employee && employerUser && providerUser
    ? { admin, worker, employee, employerUser, providerUser }
    : null;
}

async function main() {
  let owners = await loadOwners();
  if (!owners) {
    process.env.SEED_USER_PASSWORD = `${randomBytes(18).toString("base64url")}Aa1!`;
    await seedUsers(prisma);
    delete process.env.SEED_USER_PASSWORD;
    owners = await loadOwners();
  }
  if (!owners) throw new Error("Could not create the required business seed owners");

  const businesses = await seedBusinesses(prisma, owners);
  console.log(`Business seed completed: ${Object.keys(businesses).length} businesses.`);
}

main()
  .catch((error) => {
    console.error("Business seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
