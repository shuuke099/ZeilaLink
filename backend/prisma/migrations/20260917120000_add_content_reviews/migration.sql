ALTER TABLE "courses"
ADD COLUMN "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "reviews_count" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "business_reviews" (
  "id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "business_reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "business_reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);

CREATE TABLE "service_reviews" (
  "id" TEXT NOT NULL,
  "service_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "service_reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "service_reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);

CREATE TABLE "course_reviews" (
  "id" TEXT NOT NULL,
  "course_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "course_reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "course_reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX "business_reviews_business_id_user_id_key" ON "business_reviews"("business_id", "user_id");
CREATE INDEX "business_reviews_business_id_created_at_idx" ON "business_reviews"("business_id", "created_at");
CREATE INDEX "business_reviews_user_id_created_at_idx" ON "business_reviews"("user_id", "created_at");

CREATE UNIQUE INDEX "service_reviews_service_id_user_id_key" ON "service_reviews"("service_id", "user_id");
CREATE INDEX "service_reviews_service_id_created_at_idx" ON "service_reviews"("service_id", "created_at");
CREATE INDEX "service_reviews_user_id_created_at_idx" ON "service_reviews"("user_id", "created_at");

CREATE UNIQUE INDEX "course_reviews_course_id_user_id_key" ON "course_reviews"("course_id", "user_id");
CREATE INDEX "course_reviews_course_id_created_at_idx" ON "course_reviews"("course_id", "created_at");
CREATE INDEX "course_reviews_user_id_created_at_idx" ON "course_reviews"("user_id", "created_at");

ALTER TABLE "business_reviews" ADD CONSTRAINT "business_reviews_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "business_reviews" ADD CONSTRAINT "business_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
