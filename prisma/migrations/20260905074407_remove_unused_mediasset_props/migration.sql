/*
  Warnings:

  - You are about to drop the column `error` on the `media_assets` table. All the data in the column will be lost.
  - You are about to drop the column `generatedAt` on the `media_assets` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `media_assets` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `media_assets` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `media_assets` table. All the data in the column will be lost.
  - Made the column `path` on table `media_assets` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "media_assets" DROP COLUMN "error",
DROP COLUMN "generatedAt",
DROP COLUMN "height",
DROP COLUMN "size",
DROP COLUMN "width",
ALTER COLUMN "path" SET NOT NULL;
