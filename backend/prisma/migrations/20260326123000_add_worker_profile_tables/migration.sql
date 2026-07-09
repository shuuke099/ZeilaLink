-- CreateTable
CREATE TABLE "worker_experiences" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "application_id" TEXT,
  "job_title" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "start_date" TIMESTAMP(3) NOT NULL,
  "end_date" TIMESTAMP(3),
  "is_current" BOOLEAN NOT NULL DEFAULT false,
  "achievements" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "worker_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_educations" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "degree_level" TEXT NOT NULL,
  "institution" TEXT NOT NULL,
  "field_of_study" TEXT,
  "certification_name" TEXT,
  "certificate_url" TEXT,
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "start_date" TIMESTAMP(3),
  "end_date" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "worker_educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_languages" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "worker_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_preferences" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "employment_type" TEXT,
  "shift_preference" TEXT,
  "desired_salary_min" INTEGER,
  "desired_salary_max" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "worker_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "worker_experiences_user_id_start_date_idx" ON "worker_experiences"("user_id", "start_date");
CREATE INDEX "worker_educations_user_id_idx" ON "worker_educations"("user_id");
CREATE INDEX "worker_languages_user_id_language_idx" ON "worker_languages"("user_id", "language");
CREATE UNIQUE INDEX "worker_preferences_user_id_key" ON "worker_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "worker_experiences"
  ADD CONSTRAINT "worker_experiences_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "worker_experiences"
  ADD CONSTRAINT "worker_experiences_application_id_fkey"
  FOREIGN KEY ("application_id") REFERENCES "applications"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "worker_educations"
  ADD CONSTRAINT "worker_educations_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "worker_languages"
  ADD CONSTRAINT "worker_languages_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "worker_preferences"
  ADD CONSTRAINT "worker_preferences_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
