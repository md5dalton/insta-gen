/*
  Warnings:

  - You are about to drop the column `name` on the `media_items` table. All the data in the column will be lost.
  - You are about to drop the column `previewUrl` on the `media_items` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailUrl` on the `media_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "media_items" DROP COLUMN "name",
DROP COLUMN "previewUrl",
DROP COLUMN "thumbnailUrl";
