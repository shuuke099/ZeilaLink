-- AlterTable
ALTER TABLE "employers" ADD COLUMN     "address" TEXT,
ADD COLUMN     "banner_url" TEXT,
ADD COLUMN     "deactivated_at" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "founded_year" INTEGER,
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notification_preferences" JSONB,
ADD COLUMN     "size_range" TEXT,
ADD COLUMN     "website" TEXT;
