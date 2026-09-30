/*
  Warnings:

  - Added the required column `passwordHash` to the `profile_users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "profile_users" ADD COLUMN     "passwordHash" TEXT NOT NULL;
