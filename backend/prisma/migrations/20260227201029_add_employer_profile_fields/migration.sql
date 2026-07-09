/*
  Warnings:

  - You are about to drop the column `deactivated_at` on the `employers` table. All the data in the column will be lost.
  - You are about to drop the column `founded_year` on the `employers` table. All the data in the column will be lost.
  - You are about to drop the column `headline` on the `employers` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `employers` table. All the data in the column will be lost.
  - You are about to drop the column `notification_preferences` on the `employers` table. All the data in the column will be lost.
  - You are about to drop the column `size_range` on the `employers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employers" DROP COLUMN "deactivated_at",
DROP COLUMN "founded_year",
DROP COLUMN "headline",
DROP COLUMN "is_active",
DROP COLUMN "notification_preferences",
DROP COLUMN "size_range";
