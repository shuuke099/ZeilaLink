ALTER TABLE "services"
ADD COLUMN "title_so" TEXT,
ADD COLUMN "description_so" TEXT,
ADD COLUMN "availability_mode" TEXT NOT NULL DEFAULT 'instant_booking',
ADD COLUMN "sla_response" TEXT,
ADD COLUMN "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "advanced_config" JSONB NOT NULL DEFAULT '{}'::jsonb;
