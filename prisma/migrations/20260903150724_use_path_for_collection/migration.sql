/*
  Warnings:

  - You are about to drop the column `name` on the `collections` table. All the data in the column will be lost.
  - Added the required column `path` to the `collections` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "collections" DROP COLUMN "name",
ADD COLUMN     "path" TEXT NOT NULL;
