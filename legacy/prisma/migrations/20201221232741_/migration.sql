/*
  Warnings:

  - You are about to drop the column `stripeCustomerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `giftedAccess` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscribedAccess` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionEndTime` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Clip` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClipTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Clip" DROP CONSTRAINT "Clip_userId_fkey";

-- DropForeignKey
ALTER TABLE "ClipTag" DROP CONSTRAINT "ClipTag_clipId_fkey";

-- DropForeignKey
ALTER TABLE "ClipTag" DROP CONSTRAINT "ClipTag_tagId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "stripeCustomerId",
DROP COLUMN "giftedAccess",
DROP COLUMN "subscribedAccess",
DROP COLUMN "subscriptionEndTime";

-- DropTable
DROP TABLE "Clip";

-- DropTable
DROP TABLE "ClipTag";

-- DropTable
DROP TABLE "Tag";
