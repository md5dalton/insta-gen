/*
  Warnings:

  - You are about to drop the column `username` on the `media_users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[collectionId,id]` on the table `media_users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `path` to the `media_users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "media_users_collectionId_username_key";

-- AlterTable
ALTER TABLE "media_users" DROP COLUMN "username",
ADD COLUMN     "path" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "media_users_collectionId_id_key" ON "media_users"("collectionId", "id");
