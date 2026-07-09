ALTER TABLE "service_bookings"
ADD COLUMN "responsible_full_name" TEXT,
ADD COLUMN "service_date_time" TIMESTAMP(3),
ADD COLUMN "is_remote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "location_address" TEXT,
ADD COLUMN "stripe_checkout_session_id" TEXT,
ADD COLUMN "payment_status" TEXT NOT NULL DEFAULT 'pending';

CREATE INDEX "service_bookings_payment_status_created_at_idx"
ON "service_bookings"("payment_status", "created_at");
