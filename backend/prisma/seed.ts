import "../src/config/env";

import { PrismaClient } from "@prisma/client";

import { seedUsers } from "./seeds/users";
import { seedBusinesses } from "./seeds/businesses";
import { seedBusinessHours } from "./seeds/businessHours";
import { seedDeals } from "./seeds/deals";

import { seedEmployers } from "./seeds/employers";
import { seedJobs } from "./seeds/jobs";
import { seedApplications } from "./seeds/applications";

import { seedServices } from "./seeds/services";
import { seedServiceBookings } from "./seeds/serviceBookings";

import { seedResumes } from "./seeds/resumes";
import { seedWorkerExperiences } from "./seeds/workerExperiences";
import { seedWorkerEducations } from "./seeds/workerEducations";
import { seedWorkerLanguages } from "./seeds/workerLanguages";
import { seedWorkerPreferences } from "./seeds/workerPreferences";

import { seedSkills } from "./seeds/skills";
import { seedUserSkills } from "./seeds/userSkills";

import { seedProviders } from "./seeds/providers";
import { seedCourses } from "./seeds/courses";
import { seedUserCertifications } from "./seeds/userCertifications";

import { seedMessages } from "./seeds/messages";
import { seedAuditLogs } from "./seeds/auditLogs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  console.log("Seeding users...");
  const users = await seedUsers(prisma);

  console.log("Seeding businesses...");
  const businesses = await seedBusinesses(prisma, users);

  console.log("Seeding business hours...");
  await seedBusinessHours(prisma, businesses);

  console.log("Seeding deals...");
  await seedDeals(prisma, businesses);

  console.log("Seeding employers...");
  const employers = await seedEmployers(prisma, users, businesses);

  console.log("Seeding skills...");
  const skills = await seedSkills(prisma);

  console.log("Seeding providers...");
  const providers = await seedProviders(prisma);

  console.log("Seeding jobs...");
  const jobs = await seedJobs(prisma, employers);

  console.log("Seeding services...");
  const services = await seedServices(prisma, businesses);

  console.log("Seeding courses...");
  const courses = await seedCourses(prisma, providers, skills);

  console.log("Seeding resumes...");
  await seedResumes(prisma, users);

  console.log("Seeding worker experiences...");
  await seedWorkerExperiences(prisma, users);

  console.log("Seeding worker educations...");
  await seedWorkerEducations(prisma, users);

  console.log("Seeding worker languages...");
  await seedWorkerLanguages(prisma, users);

  console.log("Seeding worker preferences...");
  await seedWorkerPreferences(prisma, users);

  console.log("Seeding user skills...");
  await seedUserSkills(prisma, users, skills);

  console.log("Seeding applications...");
  await seedApplications(prisma, users, jobs);

  console.log("Seeding service bookings...");
  await seedServiceBookings(prisma, users, services);

  console.log("Seeding user certifications...");
  await seedUserCertifications(prisma, users, courses, skills);

  console.log("Seeding messages...");
  await seedMessages(prisma, users, jobs);

  console.log("Seeding audit logs...");
  await seedAuditLogs(prisma, users, businesses, jobs);

  console.log("✅ Database seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Database seed failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
