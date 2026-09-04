/*
  Warnings:

  - You are about to drop the column `bitrate` on the `media_items` table. All the data in the column will be lost.
  - Added the required column `mktime` to the `media_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "media_items_type_idx";

-- AlterTable
ALTER TABLE "media_items" DROP COLUMN "bitrate",
ADD COLUMN     "mktime" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "random" DOUBLE PRECISION NOT NULL DEFAULT random();

-- CreateIndex
CREATE INDEX "media_items_mktime_idx" ON "media_items"("mktime");

-- CreateIndex
CREATE INDEX "media_items_type_random_idx" ON "media_items"("type", "random");
