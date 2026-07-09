-- CreateTable
CREATE TABLE "services" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reviews" INTEGER NOT NULL DEFAULT 0,
  "price_label" TEXT NOT NULL,
  "image" TEXT NOT NULL,
  "badge" TEXT,
  "description" TEXT NOT NULL,
  "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "includes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "package_name" TEXT,
  "package_description" TEXT,
  "revisions" TEXT,
  "delivery_time" TEXT,
  "support" TEXT,
  "expert_name" TEXT,
  "expert_role" TEXT,
  "expert_image" TEXT,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_bookings" (
  "id" TEXT NOT NULL,
  "service_id" TEXT NOT NULL,
  "user_id" TEXT,
  "customer_name" TEXT NOT NULL,
  "customer_email" TEXT NOT NULL,
  "customer_phone" TEXT,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "service_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_bookings_service_id_created_at_idx" ON "service_bookings"("service_id", "created_at");

-- CreateIndex
CREATE INDEX "service_bookings_user_id_created_at_idx" ON "service_bookings"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "service_bookings"
ADD CONSTRAINT "service_bookings_service_id_fkey"
FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_bookings"
ADD CONSTRAINT "service_bookings_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
