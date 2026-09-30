CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saves" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saves_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "likes_userId_mediaId_key" ON "likes"("userId", "mediaId");
CREATE INDEX "likes_userId_createdAt_idx" ON "likes"("userId", "createdAt");
CREATE INDEX "likes_mediaId_idx" ON "likes"("mediaId");
CREATE UNIQUE INDEX "saves_userId_mediaId_key" ON "saves"("userId", "mediaId");
CREATE INDEX "saves_userId_createdAt_idx" ON "saves"("userId", "createdAt");
CREATE INDEX "saves_mediaId_idx" ON "saves"("mediaId");

ALTER TABLE "likes"
    ADD CONSTRAINT "likes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "profile_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "likes"
    ADD CONSTRAINT "likes_mediaId_fkey"
    FOREIGN KEY ("mediaId") REFERENCES "media_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saves"
    ADD CONSTRAINT "saves_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "profile_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saves"
    ADD CONSTRAINT "saves_mediaId_fkey"
    FOREIGN KEY ("mediaId") REFERENCES "media_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;