-- Add image URL and certificate flag to trainings
ALTER TABLE "trainings"
ADD COLUMN IF NOT EXISTS "image_url" TEXT,
ADD COLUMN IF NOT EXISTS "provides_certificate" BOOLEAN NOT NULL DEFAULT false;

