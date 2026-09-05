/*
  Warnings:

  - The primary key for the `media_assets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `media_assets` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "media_assets_mediaId_idx";

-- DropIndex
DROP INDEX "media_assets_mediaId_type_key";

-- DropIndex
DROP INDEX "media_assets_type_idx";

-- AlterTable
ALTER TABLE "media_assets" DROP CONSTRAINT "media_assets_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "media_assets_pkey" PRIMARY KEY ("mediaId", "type");
