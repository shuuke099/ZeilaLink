-- Public, stable identifiers and bilingual content fields are nullable so
-- deployments can roll forward without blocking existing writes. Existing
-- rows are backfilled with a readable prefix plus their complete immutable id.
ALTER TABLE "users"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "bio_so" TEXT,
  ADD COLUMN "headline" TEXT,
  ADD COLUMN "headline_so" TEXT,
  ADD COLUMN "profile_public" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "employers"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "name_so" TEXT,
  ADD COLUMN "description_so" TEXT;

ALTER TABLE "providers"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "name_so" TEXT,
  ADD COLUMN "description_so" TEXT;

ALTER TABLE "jobs"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "title_so" TEXT,
  ADD COLUMN "description_so" TEXT,
  ADD COLUMN "requirements_so" TEXT,
  ADD COLUMN "benefits_so" TEXT;

ALTER TABLE "trainings"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "name_so" TEXT,
  ADD COLUMN "description_so" TEXT,
  ADD COLUMN "duration_so" TEXT;

ALTER TABLE "services"
  ADD COLUMN "slug" TEXT;

UPDATE "users"
SET "slug" =
  COALESCE(
    NULLIF(
      TRIM(BOTH '-' FROM regexp_replace(lower(COALESCE("name", '')), '[^a-z0-9]+', '-', 'g')),
      ''
    ),
    'worker'
  ) || '-' || "id"
WHERE "slug" IS NULL;

UPDATE "employers"
SET "slug" =
  COALESCE(
    NULLIF(
      TRIM(BOTH '-' FROM regexp_replace(lower(COALESCE("name", '')), '[^a-z0-9]+', '-', 'g')),
      ''
    ),
    'business'
  ) || '-' || "id"
WHERE "slug" IS NULL;

UPDATE "providers"
SET "slug" =
  COALESCE(
    NULLIF(
      TRIM(BOTH '-' FROM regexp_replace(lower(COALESCE("name", '')), '[^a-z0-9]+', '-', 'g')),
      ''
    ),
    'provider'
  ) || '-' || "id"
WHERE "slug" IS NULL;

UPDATE "jobs"
SET "slug" =
  COALESCE(
    NULLIF(
      TRIM(BOTH '-' FROM regexp_replace(lower(COALESCE("title", '')), '[^a-z0-9]+', '-', 'g')),
      ''
    ),
    'job'
  ) || '-' || "id"
WHERE "slug" IS NULL;

UPDATE "trainings"
SET "slug" =
  COALESCE(
    NULLIF(
      TRIM(BOTH '-' FROM regexp_replace(lower(COALESCE("name", '')), '[^a-z0-9]+', '-', 'g')),
      ''
    ),
    'training'
  ) || '-' || "id"
WHERE "slug" IS NULL;

UPDATE "services"
SET "slug" =
  COALESCE(
    NULLIF(
      TRIM(BOTH '-' FROM regexp_replace(lower(COALESCE("title", '')), '[^a-z0-9]+', '-', 'g')),
      ''
    ),
    'service'
  ) || '-' || "id"
WHERE "slug" IS NULL;

CREATE UNIQUE INDEX "users_slug_key" ON "users"("slug");
CREATE UNIQUE INDEX "employers_slug_key" ON "employers"("slug");
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");
CREATE UNIQUE INDEX "jobs_slug_key" ON "jobs"("slug");
CREATE UNIQUE INDEX "trainings_slug_key" ON "trainings"("slug");
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

CREATE INDEX "users_role_is_verified_profile_public_created_at_idx"
  ON "users"("role", "is_verified", "profile_public", "created_at");
CREATE INDEX "employers_verified_created_at_idx"
  ON "employers"("verified", "created_at");
CREATE INDEX "providers_verified_created_at_idx"
  ON "providers"("verified", "created_at");
