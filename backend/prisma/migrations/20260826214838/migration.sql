/*
  Warnings:

  - You are about to drop the column `description_so` on the `employers` table. All the data in the column will be lost.
  - You are about to drop the column `name_so` on the `employers` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `employers` table. All the data in the column will be lost.
  - You are about to drop the column `benefits_so` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `description_so` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `requirements_so` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `title_so` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `description_so` on the `providers` table. All the data in the column will be lost.
  - You are about to drop the column `name_so` on the `providers` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `providers` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `description_so` on the `trainings` table. All the data in the column will be lost.
  - You are about to drop the column `duration_so` on the `trainings` table. All the data in the column will be lost.
  - You are about to drop the column `name_so` on the `trainings` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `trainings` table. All the data in the column will be lost.
  - You are about to drop the column `bio_so` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `headline` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `headline_so` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `profile_public` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "applications_job_id_applied_at_idx";

-- DropIndex
DROP INDEX "applications_status_applied_at_idx";

-- DropIndex
DROP INDEX "applications_user_id_applied_at_idx";

-- DropIndex
DROP INDEX "audit_logs_created_at_idx";

-- DropIndex
DROP INDEX "audit_logs_resource_type_created_at_idx";

-- DropIndex
DROP INDEX "audit_logs_user_id_created_at_idx";

-- DropIndex
DROP INDEX "employers_slug_key";

-- DropIndex
DROP INDEX "employers_verified_created_at_idx";

-- DropIndex
DROP INDEX "jobs_description_trgm_idx";

-- DropIndex
DROP INDEX "jobs_employer_id_created_at_idx";

-- DropIndex
DROP INDEX "jobs_location_idx";

-- DropIndex
DROP INDEX "jobs_published_created_at_idx";

-- DropIndex
DROP INDEX "jobs_published_employment_type_idx";

-- DropIndex
DROP INDEX "jobs_published_remote_idx";

-- DropIndex
DROP INDEX "jobs_salary_max_idx";

-- DropIndex
DROP INDEX "jobs_salary_min_idx";

-- DropIndex
DROP INDEX "jobs_slug_key";

-- DropIndex
DROP INDEX "jobs_tags_gin_idx";

-- DropIndex
DROP INDEX "jobs_title_trgm_idx";

-- DropIndex
DROP INDEX "messages_from_user_id_created_at_idx";

-- DropIndex
DROP INDEX "messages_job_id_created_at_idx";

-- DropIndex
DROP INDEX "messages_to_user_id_read_created_at_idx";

-- DropIndex
DROP INDEX "providers_slug_key";

-- DropIndex
DROP INDEX "providers_verified_created_at_idx";

-- DropIndex
DROP INDEX "resumes_user_id_created_at_idx";

-- DropIndex
DROP INDEX "services_category_idx";

-- DropIndex
DROP INDEX "services_description_trgm_idx";

-- DropIndex
DROP INDEX "services_provider_trgm_idx";

-- DropIndex
DROP INDEX "services_published_category_idx";

-- DropIndex
DROP INDEX "services_published_created_at_idx";

-- DropIndex
DROP INDEX "services_slug_key";

-- DropIndex
DROP INDEX "services_title_trgm_idx";

-- DropIndex
DROP INDEX "trainings_description_trgm_idx";

-- DropIndex
DROP INDEX "trainings_name_trgm_idx";

-- DropIndex
DROP INDEX "trainings_provider_id_created_at_idx";

-- DropIndex
DROP INDEX "trainings_published_cost_idx";

-- DropIndex
DROP INDEX "trainings_published_created_at_idx";

-- DropIndex
DROP INDEX "trainings_skill_id_created_at_idx";

-- DropIndex
DROP INDEX "trainings_slug_key";

-- DropIndex
DROP INDEX "user_certifications_skill_id_idx";

-- DropIndex
DROP INDEX "user_certifications_training_id_issued_at_idx";

-- DropIndex
DROP INDEX "user_certifications_user_id_issued_at_idx";

-- DropIndex
DROP INDEX "users_role_created_at_idx";

-- DropIndex
DROP INDEX "users_role_is_verified_profile_public_created_at_idx";

-- DropIndex
DROP INDEX "users_slug_key";

-- AlterTable
ALTER TABLE "employers" DROP COLUMN "description_so",
DROP COLUMN "name_so",
DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "jobs" DROP COLUMN "benefits_so",
DROP COLUMN "description_so",
DROP COLUMN "requirements_so",
DROP COLUMN "slug",
DROP COLUMN "title_so";

-- AlterTable
ALTER TABLE "providers" DROP COLUMN "description_so",
DROP COLUMN "name_so",
DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "services" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "trainings" DROP COLUMN "description_so",
DROP COLUMN "duration_so",
DROP COLUMN "name_so",
DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "bio_so",
DROP COLUMN "headline",
DROP COLUMN "headline_so",
DROP COLUMN "profile_public",
DROP COLUMN "slug";
