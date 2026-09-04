/*
  Warnings:

  - You are about to drop the column `path` on the `collections` table. All the data in the column will be lost.
  - You are about to drop the column `avatarUrl` on the `media_users` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `media_users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `root_collections` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rootCollectionId,id]` on the table `collections` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "collections_rootCollectionId_path_key";

-- AlterTable
ALTER TABLE "collections" DROP COLUMN "path";

-- AlterTable
ALTER TABLE "media_users" DROP COLUMN "avatarUrl",
DROP COLUMN "displayName",
ADD COLUMN     "picture" TEXT;

-- AlterTable
ALTER TABLE "root_collections" DROP COLUMN "name";

-- CreateIndex
CREATE UNIQUE INDEX "collections_rootCollectionId_id_key" ON "collections"("rootCollectionId", "id");
