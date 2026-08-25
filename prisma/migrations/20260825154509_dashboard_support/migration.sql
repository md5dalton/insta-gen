-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "processingProfileId" TEXT;

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "processingProfileId" TEXT;

-- AlterTable
ALTER TABLE "RootCollection" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "processingProfileId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "processingProfileId" TEXT;

-- CreateTable
CREATE TABLE "ProcessingProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feedImage" BOOLEAN NOT NULL DEFAULT false,
    "hls" BOOLEAN NOT NULL DEFAULT false,
    "lowQuality" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProcessingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AccessPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessPolicyMember" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "privileges" TEXT NOT NULL,

    CONSTRAINT "AccessPolicyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- AddForeignKey
ALTER TABLE "RootCollection" ADD CONSTRAINT "RootCollection_processingProfileId_fkey" FOREIGN KEY ("processingProfileId") REFERENCES "ProcessingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_processingProfileId_fkey" FOREIGN KEY ("processingProfileId") REFERENCES "ProcessingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_processingProfileId_fkey" FOREIGN KEY ("processingProfileId") REFERENCES "ProcessingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_processingProfileId_fkey" FOREIGN KEY ("processingProfileId") REFERENCES "ProcessingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessPolicyMember" ADD CONSTRAINT "AccessPolicyMember_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "AccessPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessPolicyMember" ADD CONSTRAINT "AccessPolicyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ProfileUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
