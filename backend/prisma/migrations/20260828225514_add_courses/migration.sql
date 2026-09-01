/*
  Warnings:

  - You are about to drop the column `training_id` on the `user_certifications` table. All the data in the column will be lost.
  - You are about to drop the `trainings` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updated_at` to the `skills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_id` to the `user_certifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "providers" DROP CONSTRAINT "providers_contact_user_id_fkey";

-- DropForeignKey
ALTER TABLE "trainings" DROP CONSTRAINT "trainings_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "trainings" DROP CONSTRAINT "trainings_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "user_certifications" DROP CONSTRAINT "user_certifications_training_id_fkey";

-- DropIndex
DROP INDEX "providers_verified_created_at_idx";

-- DropIndex
DROP INDEX "user_certifications_training_id_issued_at_idx";

-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "timezone" TEXT,
ALTER COLUMN "contact_user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user_certifications" DROP COLUMN "training_id",
ADD COLUMN     "course_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "trainings";

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "name_so" TEXT,
    "description" TEXT NOT NULL,
    "description_so" TEXT,
    "provider_id" TEXT NOT NULL,
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_skills" (
    "course_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,

    CONSTRAINT "course_skills_pkey" PRIMARY KEY ("course_id","skill_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_published_created_at_idx" ON "courses"("published", "created_at");

-- CreateIndex
CREATE INDEX "courses_provider_id_created_at_idx" ON "courses"("provider_id", "created_at");

-- CreateIndex
CREATE INDEX "courses_published_featured_featured_until_idx" ON "courses"("published", "featured", "featured_until");

-- CreateIndex
CREATE INDEX "courses_published_cost_idx" ON "courses"("published", "cost");

-- CreateIndex
CREATE INDEX "courses_published_delivery_mode_idx" ON "courses"("published", "delivery_mode");

-- CreateIndex
CREATE INDEX "courses_category_idx" ON "courses"("category");

-- CreateIndex
CREATE INDEX "courses_level_idx" ON "courses"("level");

-- CreateIndex
CREATE INDEX "courses_city_state_idx" ON "courses"("city", "state");

-- CreateIndex
CREATE INDEX "courses_country_state_city_idx" ON "courses"("country", "state", "city");

-- CreateIndex
CREATE INDEX "courses_start_date_idx" ON "courses"("start_date");

-- CreateIndex
CREATE INDEX "courses_registration_deadline_idx" ON "courses"("registration_deadline");

-- CreateIndex
CREATE INDEX "courses_name_trgm_idx" ON "courses" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "courses_description_trgm_idx" ON "courses" USING GIN ("description" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "course_skills_skill_id_idx" ON "course_skills"("skill_id");

-- CreateIndex
CREATE INDEX "providers_created_at_idx" ON "providers"("created_at");

-- CreateIndex
CREATE INDEX "skills_category_idx" ON "skills"("category");

-- CreateIndex
CREATE INDEX "skills_created_at_idx" ON "skills"("created_at");

-- CreateIndex
CREATE INDEX "user_certifications_course_id_issued_at_idx" ON "user_certifications"("course_id", "issued_at");

-- CreateIndex
CREATE INDEX "user_skills_skill_id_idx" ON "user_skills"("skill_id");

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_contact_user_id_fkey" FOREIGN KEY ("contact_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_skills" ADD CONSTRAINT "course_skills_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_skills" ADD CONSTRAINT "course_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_certifications" ADD CONSTRAINT "user_certifications_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
