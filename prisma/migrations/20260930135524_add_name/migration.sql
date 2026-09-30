/*
  Warnings:

  - Added the required column `name` to the `collections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `media_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `media_users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `root_collections` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "collections" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "media_items" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "media_users" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "root_collections" ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "visibility" SET DEFAULT 'RESTRICTED';
