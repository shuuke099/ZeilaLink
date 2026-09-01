/*
  Warnings:

  - You are about to drop the column `responsible_full_name` on the `service_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `advanced_config` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `attachments` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `badge` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_time` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `expert_image` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `expert_name` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `expert_role` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `highlights` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `includes` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `package_description` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `package_name` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `reviews` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `revisions` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `sla_response` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `support` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `application_id` on the `worker_experiences` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `employers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[business_id]` on the table `employers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `jobs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `providers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[business_id]` on the table `providers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_checkout_session_id]` on the table `service_bookings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `services` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `trainings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,language]` on the table `worker_languages` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `employers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `providers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_certifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_skills` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'withdrawn';

-- DropForeignKey
ALTER TABLE "worker_experiences" DROP CONSTRAINT "worker_experiences_application_id_fkey";

-- DropIndex
DROP INDEX "worker_languages_user_id_language_idx";

-- AlterTable
ALTER TABLE "employers" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "business_id" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN     "description_so" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "name_so" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "verified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "benefits_so" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN     "description_so" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "requirements_so" TEXT,
ADD COLUMN     "salary_currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "salary_period" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "title_so" TEXT;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "read_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "business_id" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN     "description_so" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "name_so" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "verified_at" TIMESTAMP(3),
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "service_bookings" DROP COLUMN "responsible_full_name";

-- AlterTable
ALTER TABLE "services" DROP COLUMN "advanced_config",
DROP COLUMN "attachments",
DROP COLUMN "badge",
DROP COLUMN "delivery_time",
DROP COLUMN "expert_image",
DROP COLUMN "expert_name",
DROP COLUMN "expert_role",
DROP COLUMN "highlights",
DROP COLUMN "includes",
DROP COLUMN "package_description",
DROP COLUMN "package_name",
DROP COLUMN "reviews",
DROP COLUMN "revisions",
DROP COLUMN "sla_response",
DROP COLUMN "support",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "business_id" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN     "email" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "featured_until" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "price_from" DOUBLE PRECISION,
ADD COLUMN     "price_type" TEXT,
ADD COLUMN     "remote_available" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviews_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "service_area" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "subcategory" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "views_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "website" TEXT,
ALTER COLUMN "price_label" DROP NOT NULL,
ALTER COLUMN "image" DROP NOT NULL,
ALTER COLUMN "availability_mode" SET DEFAULT 'contact';

-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "description_so" TEXT,
ADD COLUMN     "name_so" TEXT;

-- AlterTable
ALTER TABLE "trainings" ADD COLUMN     "address" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "delivery_mode" TEXT NOT NULL DEFAULT 'in_person',
ADD COLUMN     "description_so" TEXT,
ADD COLUMN     "duration_so" TEXT,
ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "enrollment_open" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enrollment_url" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "featured_until" TIMESTAMP(3),
ADD COLUMN     "level" TEXT,
ADD COLUMN     "name_so" TEXT,
ADD COLUMN     "online_url" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "registration_deadline" TIMESTAMP(3),
ADD COLUMN     "schedule" TEXT,
ADD COLUMN     "schedule_so" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "start_date" TIMESTAMP(3),
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "user_certifications" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user_skills" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio_so" TEXT,
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "headline_so" TEXT,
ADD COLUMN     "profile_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "worker_educations" ADD COLUMN     "is_current" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "worker_experiences" DROP COLUMN "application_id",
ADD COLUMN     "applicationId" TEXT;

-- AlterTable
ALTER TABLE "worker_preferences" ADD COLUMN     "salary_currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "salary_period" TEXT;

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_so" TEXT,
    "description" TEXT,
    "description_so" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "logo_url" TEXT,
    "banner_url" TEXT,
    "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "has_physical_location" BOOLEAN NOT NULL DEFAULT false,
    "service_area" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "remote_available" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviews_count" INTEGER NOT NULL DEFAULT 0,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "featured_until" TIMESTAMP(3),
    "published" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");

-- CreateIndex
CREATE INDEX "businesses_published_active_created_at_idx" ON "businesses"("published", "active", "created_at");

-- CreateIndex
CREATE INDEX "businesses_category_idx" ON "businesses"("category");

-- CreateIndex
CREATE INDEX "businesses_category_subcategory_idx" ON "businesses"("category", "subcategory");

-- CreateIndex
CREATE INDEX "businesses_city_state_idx" ON "businesses"("city", "state");

-- CreateIndex
CREATE INDEX "businesses_country_state_city_idx" ON "businesses"("country", "state", "city");

-- CreateIndex
CREATE INDEX "businesses_verified_created_at_idx" ON "businesses"("verified", "created_at");

-- CreateIndex
CREATE INDEX "businesses_featured_featured_until_idx" ON "businesses"("featured", "featured_until");

-- CreateIndex
CREATE INDEX "businesses_user_id_idx" ON "businesses"("user_id");

-- CreateIndex
CREATE INDEX "businesses_name_trgm_idx" ON "businesses" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "businesses_description_trgm_idx" ON "businesses" USING GIN ("description" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "applications_user_id_applied_at_idx" ON "applications"("user_id", "applied_at");

-- CreateIndex
CREATE INDEX "applications_job_id_applied_at_idx" ON "applications"("job_id", "applied_at");

-- CreateIndex
CREATE INDEX "applications_status_applied_at_idx" ON "applications"("status", "applied_at");

-- CreateIndex
CREATE INDEX "applications_job_id_status_idx" ON "applications"("job_id", "status");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_created_at_idx" ON "audit_logs"("resource_type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "employers_slug_key" ON "employers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "employers_business_id_key" ON "employers"("business_id");

-- CreateIndex
CREATE INDEX "employers_active_verified_created_at_idx" ON "employers"("active", "verified", "created_at");

-- CreateIndex
CREATE INDEX "employers_city_state_idx" ON "employers"("city", "state");

-- CreateIndex
CREATE INDEX "employers_country_state_city_idx" ON "employers"("country", "state", "city");

-- CreateIndex
CREATE INDEX "employers_name_trgm_idx" ON "employers" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "jobs_slug_key" ON "jobs"("slug");

-- CreateIndex
CREATE INDEX "jobs_published_created_at_idx" ON "jobs"("published", "created_at");

-- CreateIndex
CREATE INDEX "jobs_published_employment_type_idx" ON "jobs"("published", "employment_type");

-- CreateIndex
CREATE INDEX "jobs_published_remote_idx" ON "jobs"("published", "remote");

-- CreateIndex
CREATE INDEX "jobs_employer_id_created_at_idx" ON "jobs"("employer_id", "created_at");

-- CreateIndex
CREATE INDEX "jobs_location_idx" ON "jobs"("location");

-- CreateIndex
CREATE INDEX "jobs_city_state_idx" ON "jobs"("city", "state");

-- CreateIndex
CREATE INDEX "jobs_country_state_city_idx" ON "jobs"("country", "state", "city");

-- CreateIndex
CREATE INDEX "jobs_salary_min_idx" ON "jobs"("salary_min");

-- CreateIndex
CREATE INDEX "jobs_salary_max_idx" ON "jobs"("salary_max");

-- CreateIndex
CREATE INDEX "jobs_title_trgm_idx" ON "jobs" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "jobs_description_trgm_idx" ON "jobs" USING GIN ("description" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "jobs_tags_gin_idx" ON "jobs" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "messages_from_user_id_created_at_idx" ON "messages"("from_user_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_to_user_id_read_created_at_idx" ON "messages"("to_user_id", "read", "created_at");

-- CreateIndex
CREATE INDEX "messages_job_id_created_at_idx" ON "messages"("job_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "providers_business_id_key" ON "providers"("business_id");

-- CreateIndex
CREATE INDEX "providers_verified_created_at_idx" ON "providers"("verified", "created_at");

-- CreateIndex
CREATE INDEX "providers_active_verified_idx" ON "providers"("active", "verified");

-- CreateIndex
CREATE INDEX "providers_city_state_idx" ON "providers"("city", "state");

-- CreateIndex
CREATE INDEX "providers_country_state_city_idx" ON "providers"("country", "state", "city");

-- CreateIndex
CREATE INDEX "resumes_user_id_created_at_idx" ON "resumes"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "service_bookings_stripe_checkout_session_id_key" ON "service_bookings"("stripe_checkout_session_id");

-- CreateIndex
CREATE INDEX "service_bookings_service_id_status_service_date_time_idx" ON "service_bookings"("service_id", "status", "service_date_time");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE INDEX "services_published_active_created_at_idx" ON "services"("published", "active", "created_at");

-- CreateIndex
CREATE INDEX "services_published_category_idx" ON "services"("published", "category");

-- CreateIndex
CREATE INDEX "services_category_subcategory_idx" ON "services"("category", "subcategory");

-- CreateIndex
CREATE INDEX "services_business_id_idx" ON "services"("business_id");

-- CreateIndex
CREATE INDEX "services_city_state_idx" ON "services"("city", "state");

-- CreateIndex
CREATE INDEX "services_country_state_city_idx" ON "services"("country", "state", "city");

-- CreateIndex
CREATE INDEX "services_published_featured_featured_until_idx" ON "services"("published", "featured", "featured_until");

-- CreateIndex
CREATE INDEX "services_title_trgm_idx" ON "services" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "services_provider_trgm_idx" ON "services" USING GIN ("provider" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "services_description_trgm_idx" ON "services" USING GIN ("description" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "trainings_slug_key" ON "trainings"("slug");

-- CreateIndex
CREATE INDEX "trainings_published_created_at_idx" ON "trainings"("published", "created_at");

-- CreateIndex
CREATE INDEX "trainings_provider_id_created_at_idx" ON "trainings"("provider_id", "created_at");

-- CreateIndex
CREATE INDEX "trainings_skill_id_created_at_idx" ON "trainings"("skill_id", "created_at");

-- CreateIndex
CREATE INDEX "trainings_published_cost_idx" ON "trainings"("published", "cost");

-- CreateIndex
CREATE INDEX "trainings_published_delivery_mode_idx" ON "trainings"("published", "delivery_mode");

-- CreateIndex
CREATE INDEX "trainings_city_state_idx" ON "trainings"("city", "state");

-- CreateIndex
CREATE INDEX "trainings_country_state_city_idx" ON "trainings"("country", "state", "city");

-- CreateIndex
CREATE INDEX "trainings_start_date_idx" ON "trainings"("start_date");

-- CreateIndex
CREATE INDEX "trainings_published_featured_featured_until_idx" ON "trainings"("published", "featured", "featured_until");

-- CreateIndex
CREATE INDEX "trainings_name_trgm_idx" ON "trainings" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "trainings_description_trgm_idx" ON "trainings" USING GIN ("description" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "user_certifications_user_id_issued_at_idx" ON "user_certifications"("user_id", "issued_at");

-- CreateIndex
CREATE INDEX "user_certifications_training_id_issued_at_idx" ON "user_certifications"("training_id", "issued_at");

-- CreateIndex
CREATE INDEX "user_certifications_skill_id_idx" ON "user_certifications"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_slug_key" ON "users"("slug");

-- CreateIndex
CREATE INDEX "users_role_created_at_idx" ON "users"("role", "created_at");

-- CreateIndex
CREATE INDEX "users_role_is_verified_profile_public_created_at_idx" ON "users"("role", "is_verified", "profile_public", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "worker_languages_user_id_language_key" ON "worker_languages"("user_id", "language");

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_experiences" ADD CONSTRAINT "worker_experiences_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
