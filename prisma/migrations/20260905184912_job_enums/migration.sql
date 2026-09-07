/*
  Warnings:

  - The `status` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `Job` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('ROOT_COLLECTION', 'COLLECTION', 'USER', 'TAG', 'MEDIA');

-- CreateEnum
CREATE TYPE "JobEvent" AS ENUM ('ADD', 'DELETE', 'UPDATE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "type",
ADD COLUMN     "type" "JobType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "JobStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Job_status_availableAt_idx" ON "Job"("status", "availableAt");
