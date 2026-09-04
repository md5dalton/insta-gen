/*
  Warnings:

  - You are about to drop the column `collectionId` on the `media_items` table. All the data in the column will be lost.
  - You are about to drop the column `rootCollectionId` on the `media_items` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "media_items" DROP CONSTRAINT "media_items_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "media_items" DROP CONSTRAINT "media_items_rootCollectionId_fkey";

-- DropIndex
DROP INDEX "media_items_collectionId_idx";

-- DropIndex
DROP INDEX "media_items_rootCollectionId_idx";

-- AlterTable
ALTER TABLE "media_items" DROP COLUMN "collectionId",
DROP COLUMN "rootCollectionId";
