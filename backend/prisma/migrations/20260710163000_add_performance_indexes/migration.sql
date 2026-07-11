-- Fast public listing, dashboard, and stats filters.
CREATE INDEX IF NOT EXISTS "users_role_created_at_idx" ON "users"("role", "created_at");

CREATE INDEX IF NOT EXISTS "jobs_published_created_at_idx" ON "jobs"("published", "created_at");
CREATE INDEX IF NOT EXISTS "jobs_published_employment_type_idx" ON "jobs"("published", "employment_type");
CREATE INDEX IF NOT EXISTS "jobs_published_remote_idx" ON "jobs"("published", "remote");
CREATE INDEX IF NOT EXISTS "jobs_employer_id_created_at_idx" ON "jobs"("employer_id", "created_at");
CREATE INDEX IF NOT EXISTS "jobs_location_idx" ON "jobs"("location");
CREATE INDEX IF NOT EXISTS "jobs_salary_min_idx" ON "jobs"("salary_min");
CREATE INDEX IF NOT EXISTS "jobs_salary_max_idx" ON "jobs"("salary_max");

CREATE INDEX IF NOT EXISTS "applications_user_id_applied_at_idx" ON "applications"("user_id", "applied_at");
CREATE INDEX IF NOT EXISTS "applications_job_id_applied_at_idx" ON "applications"("job_id", "applied_at");
CREATE INDEX IF NOT EXISTS "applications_status_applied_at_idx" ON "applications"("status", "applied_at");

CREATE INDEX IF NOT EXISTS "services_published_created_at_idx" ON "services"("published", "created_at");
CREATE INDEX IF NOT EXISTS "services_published_category_idx" ON "services"("published", "category");
CREATE INDEX IF NOT EXISTS "services_category_idx" ON "services"("category");

CREATE INDEX IF NOT EXISTS "resumes_user_id_created_at_idx" ON "resumes"("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "trainings_published_created_at_idx" ON "trainings"("published", "created_at");
CREATE INDEX IF NOT EXISTS "trainings_provider_id_created_at_idx" ON "trainings"("provider_id", "created_at");
CREATE INDEX IF NOT EXISTS "trainings_skill_id_created_at_idx" ON "trainings"("skill_id", "created_at");
CREATE INDEX IF NOT EXISTS "trainings_published_cost_idx" ON "trainings"("published", "cost");

CREATE INDEX IF NOT EXISTS "user_certifications_user_id_issued_at_idx" ON "user_certifications"("user_id", "issued_at");
CREATE INDEX IF NOT EXISTS "user_certifications_training_id_issued_at_idx" ON "user_certifications"("training_id", "issued_at");
CREATE INDEX IF NOT EXISTS "user_certifications_skill_id_idx" ON "user_certifications"("skill_id");

CREATE INDEX IF NOT EXISTS "messages_from_user_id_created_at_idx" ON "messages"("from_user_id", "created_at");
CREATE INDEX IF NOT EXISTS "messages_to_user_id_read_created_at_idx" ON "messages"("to_user_id", "read", "created_at");
CREATE INDEX IF NOT EXISTS "messages_job_id_created_at_idx" ON "messages"("job_id", "created_at");

CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_resource_type_created_at_idx" ON "audit_logs"("resource_type", "created_at");

-- Speed up case-insensitive substring search used by Prisma contains/mode: insensitive.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "jobs_title_trgm_idx" ON "jobs" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "jobs_description_trgm_idx" ON "jobs" USING GIN ("description" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "jobs_tags_gin_idx" ON "jobs" USING GIN ("tags");
CREATE INDEX IF NOT EXISTS "trainings_name_trgm_idx" ON "trainings" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "trainings_description_trgm_idx" ON "trainings" USING GIN ("description" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "services_title_trgm_idx" ON "services" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "services_provider_trgm_idx" ON "services" USING GIN ("provider" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "services_description_trgm_idx" ON "services" USING GIN ("description" gin_trgm_ops);
