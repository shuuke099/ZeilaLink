import "../src/config/env";

import { PrismaClient } from "@prisma/client";
import { seedCourses } from "./seeds/courses";
import { seedProviders } from "./seeds/providers";
import { seedSkills } from "./seeds/skills";

const prisma = new PrismaClient();

async function main() {
  // Older local databases may predate the required Skill timestamp. Add it
  // without deleting existing skills so this focused seed remains safe.
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP',
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "timezone" TEXT',
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "providers" ALTER COLUMN "contact_user_id" DROP NOT NULL',
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "courses" (
      "id" TEXT PRIMARY KEY,
      "slug" TEXT UNIQUE,
      "name" TEXT NOT NULL,
      "name_so" TEXT,
      "description" TEXT NOT NULL,
      "description_so" TEXT,
      "provider_id" TEXT NOT NULL REFERENCES "providers"("id") ON DELETE CASCADE,
      "category" TEXT,
      "level" TEXT,
      "duration" TEXT NOT NULL,
      "duration_so" TEXT,
      "delivery_mode" TEXT NOT NULL DEFAULT 'in_person',
      "address" TEXT,
      "city" TEXT,
      "state" TEXT,
      "postal_code" TEXT,
      "country" TEXT NOT NULL DEFAULT 'US',
      "timezone" TEXT,
      "online_url" TEXT,
      "start_date" TIMESTAMP(3),
      "end_date" TIMESTAMP(3),
      "registration_deadline" TIMESTAMP(3),
      "schedule" TEXT,
      "schedule_so" TEXT,
      "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "enrollment_url" TEXT,
      "enrollment_open" BOOLEAN NOT NULL DEFAULT true,
      "image_url" TEXT,
      "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "provides_certificate" BOOLEAN NOT NULL DEFAULT false,
      "certificate_url" TEXT,
      "published" BOOLEAN NOT NULL DEFAULT false,
      "featured" BOOLEAN NOT NULL DEFAULT false,
      "featured_until" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "course_skills" (
      "course_id" TEXT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
      "skill_id" TEXT NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
      PRIMARY KEY ("course_id", "skill_id")
    )
  `);
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "user_certifications" ADD COLUMN IF NOT EXISTS "course_id" TEXT',
  );

  console.log("Seeding training dependencies...");
  const skills = await seedSkills(prisma);
  const providers = await seedProviders(prisma);

  console.log("Seeding 10 training programs...");
  const courses = await seedCourses(prisma, providers, skills);

  console.log(`Training seed completed: ${Object.keys(courses).length} programs.`);
}

main()
  .catch((error) => {
    console.error("Training seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
