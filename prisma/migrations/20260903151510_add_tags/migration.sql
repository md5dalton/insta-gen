/*
  Warnings:

  - You are about to drop the column `tags` on the `media_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "media_items" DROP COLUMN "tags";

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaTag" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,

    CONSTRAINT "MediaTag_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MediaTag" ADD CONSTRAINT "MediaTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaTag" ADD CONSTRAINT "MediaTag_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
