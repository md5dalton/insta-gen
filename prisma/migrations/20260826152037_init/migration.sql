-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('NEW', 'NEEDS_PROCESSING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('THUMBNAIL', 'FEED_IMAGE', 'HLS', 'LOW_QUALITY');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('READY', 'MISSING', 'PROCESSING', 'FAILED');

-- CreateEnum
CREATE TYPE "VisibilityType" AS ENUM ('INHERIT', 'ALL_USERS', 'RESTRICTED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "RootVisibilityType" AS ENUM ('ALL_USERS', 'RESTRICTED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "UserCapability" AS ENUM ('VIEW', 'DOWNLOAD', 'MANAGE', 'ADMIN');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('DISCOVERY', 'PROCESSED', 'FAILED', 'POLICY_CHANGE', 'DELETED', 'SETTINGS_UPDATE');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "capability" "UserCapability" NOT NULL DEFAULT 'VIEW',
    "picture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processing_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "reqThumbnail" BOOLEAN NOT NULL DEFAULT true,
    "reqFeedImage" BOOLEAN NOT NULL DEFAULT true,
    "reqHls" BOOLEAN NOT NULL DEFAULT false,
    "reqLowQuality" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "root_collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "visibility" "RootVisibilityType" NOT NULL DEFAULT 'ALL_USERS',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processingProfileId" TEXT,

    CONSTRAINT "root_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "root_collection_allowed_users" (
    "rootCollectionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "root_collection_allowed_users_pkey" PRIMARY KEY ("rootCollectionId","userId")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "visibility" "VisibilityType" NOT NULL DEFAULT 'INHERIT',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rootCollectionId" TEXT NOT NULL,
    "processingProfileId" TEXT,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_allowed_users" (
    "collectionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "collection_allowed_users_pkey" PRIMARY KEY ("collectionId","userId")
);

-- CreateTable
CREATE TABLE "media_users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "visibility" "VisibilityType" NOT NULL DEFAULT 'INHERIT',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "collectionId" TEXT NOT NULL,
    "processingProfileId" TEXT,

    CONSTRAINT "media_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_user_allowed_users" (
    "mediaUserId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "media_user_allowed_users_pkey" PRIMARY KEY ("mediaUserId","userId")
);

-- CreateTable
CREATE TABLE "media_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "path" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION,
    "bitrate" INTEGER,
    "previewUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "savesCount" INTEGER NOT NULL DEFAULT 0,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'NEW',
    "processingError" TEXT,
    "visibility" "VisibilityType" NOT NULL DEFAULT 'INHERIT',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "rootCollectionId" TEXT NOT NULL,
    "processingProfileId" TEXT,

    CONSTRAINT "media_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_item_allowed_users" (
    "mediaItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "media_item_allowed_users_pkey" PRIMARY KEY ("mediaItemId","userId")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'MISSING',
    "path" TEXT,
    "size" BIGINT,
    "width" INTEGER,
    "height" INTEGER,
    "error" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mediaId" TEXT NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "mediaRoot" TEXT NOT NULL DEFAULT '/mnt/media/library',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profile_users_email_key" ON "profile_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "processing_profiles_name_key" ON "processing_profiles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "root_collections_path_key" ON "root_collections"("path");

-- CreateIndex
CREATE INDEX "root_collections_deletedAt_idx" ON "root_collections"("deletedAt");

-- CreateIndex
CREATE INDEX "collections_rootCollectionId_idx" ON "collections"("rootCollectionId");

-- CreateIndex
CREATE INDEX "collections_deletedAt_idx" ON "collections"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "collections_rootCollectionId_path_key" ON "collections"("rootCollectionId", "path");

-- CreateIndex
CREATE INDEX "media_users_collectionId_idx" ON "media_users"("collectionId");

-- CreateIndex
CREATE INDEX "media_users_deletedAt_idx" ON "media_users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "media_users_collectionId_username_key" ON "media_users"("collectionId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "media_items_path_key" ON "media_items"("path");

-- CreateIndex
CREATE INDEX "media_items_userId_idx" ON "media_items"("userId");

-- CreateIndex
CREATE INDEX "media_items_collectionId_idx" ON "media_items"("collectionId");

-- CreateIndex
CREATE INDEX "media_items_rootCollectionId_idx" ON "media_items"("rootCollectionId");

-- CreateIndex
CREATE INDEX "media_items_processingStatus_idx" ON "media_items"("processingStatus");

-- CreateIndex
CREATE INDEX "media_items_type_idx" ON "media_items"("type");

-- CreateIndex
CREATE INDEX "media_items_deletedAt_idx" ON "media_items"("deletedAt");

-- CreateIndex
CREATE INDEX "media_items_createdAt_idx" ON "media_items"("createdAt");

-- CreateIndex
CREATE INDEX "media_assets_mediaId_idx" ON "media_assets"("mediaId");

-- CreateIndex
CREATE INDEX "media_assets_status_idx" ON "media_assets"("status");

-- CreateIndex
CREATE INDEX "media_assets_type_idx" ON "media_assets"("type");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_mediaId_type_key" ON "media_assets"("mediaId", "type");

-- CreateIndex
CREATE INDEX "activity_logs_timestamp_idx" ON "activity_logs"("timestamp");

-- CreateIndex
CREATE INDEX "activity_logs_type_idx" ON "activity_logs"("type");

-- AddForeignKey
ALTER TABLE "root_collections" ADD CONSTRAINT "root_collections_processingProfileId_fkey" FOREIGN KEY ("processingProfileId") REFERENCES "processing_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "root_collection_allowed_users" ADD CONSTRAINT "root_collection_allowed_users_rootCollectionId_fkey" FOREIGN KEY ("rootCollectionId") REFERENCES "root_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "root_collection_allowed_users" ADD CONSTRAINT "root_collection_allowed_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profile_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_rootCollectionId_fkey" FOREIGN KEY ("rootCollectionId") REFERENCES "root_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_processingProfileId_fkey" FOREIGN KEY ("processingProfileId") REFERENCES "processing_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_allowed_users" ADD CONSTRAINT "collection_allowed_users_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_allowed_users" ADD CONSTRAINT "collection_allowed_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profile_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_users" ADD CONSTRAINT "media_users_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_users" ADD CONSTRAINT "media_users_processingProfileId_fkey" FOREIGN KEY ("processingProfileId") REFERENCES "processing_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_user_allowed_users" ADD CONSTRAINT "media_user_allowed_users_mediaUserId_fkey" FOREIGN KEY ("mediaUserId") REFERENCES "media_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_user_allowed_users" ADD CONSTRAINT "media_user_allowed_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profile_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "media_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_rootCollectionId_fkey" FOREIGN KEY ("rootCollectionId") REFERENCES "root_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_processingProfileId_fkey" FOREIGN KEY ("processingProfileId") REFERENCES "processing_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_item_allowed_users" ADD CONSTRAINT "media_item_allowed_users_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "media_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_item_allowed_users" ADD CONSTRAINT "media_item_allowed_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profile_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
