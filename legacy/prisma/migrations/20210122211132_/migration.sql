/*
  Warnings:

  - The migration will change the primary key for the `BillingEvent` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `Comment` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `DeviceToken` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `EmailValidation` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `HostEvent` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `NodeRole` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `PhoneValidation` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `Site` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `SiteEvent` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `SiteNode` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `SiteRole` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `SiteRoleInvitation` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `SiteToken` table. If it partially fails, the table could be left without primary key constraint.
  - The migration will change the primary key for the `User` table. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "BillingEvent" DROP CONSTRAINT "BillingEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "DeviceToken" DROP CONSTRAINT "DeviceToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "EmailValidation" DROP CONSTRAINT "EmailValidation_userId_fkey";

-- DropForeignKey
ALTER TABLE "NodeRole" DROP CONSTRAINT "NodeRole_siteNodeId_fkey";

-- DropForeignKey
ALTER TABLE "NodeRole" DROP CONSTRAINT "NodeRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "Site" DROP CONSTRAINT "Site_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "SiteEvent" DROP CONSTRAINT "SiteEvent_siteId_fkey";

-- DropForeignKey
ALTER TABLE "SiteEvent" DROP CONSTRAINT "SiteEvent_siteNodeId_fkey";

-- DropForeignKey
ALTER TABLE "SiteEvent" DROP CONSTRAINT "SiteEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "SiteNode" DROP CONSTRAINT "SiteNode_parentNodeId_fkey";

-- DropForeignKey
ALTER TABLE "SiteNode" DROP CONSTRAINT "SiteNode_siteId_fkey";

-- DropForeignKey
ALTER TABLE "SiteRole" DROP CONSTRAINT "SiteRole_siteId_fkey";

-- DropForeignKey
ALTER TABLE "SiteRole" DROP CONSTRAINT "SiteRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "SiteRoleInvitation" DROP CONSTRAINT "SiteRoleInvitation_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "SiteRoleInvitation" DROP CONSTRAINT "SiteRoleInvitation_recipientUserId_fkey";

-- DropForeignKey
ALTER TABLE "SiteRoleInvitation" DROP CONSTRAINT "SiteRoleInvitation_siteId_fkey";

-- DropForeignKey
ALTER TABLE "SiteToken" DROP CONSTRAINT "SiteToken_siteId_fkey";

-- DropForeignKey
ALTER TABLE "VerifiedEmail" DROP CONSTRAINT "VerifiedEmail_userId_fkey";

-- AlterTable
ALTER TABLE "BillingEvent" DROP CONSTRAINT "BillingEvent_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "BillingEvent_id_seq";

-- AlterTable
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "Comment_id_seq";

-- AlterTable
ALTER TABLE "DeviceToken" DROP CONSTRAINT "DeviceToken_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "DeviceToken_id_seq";

-- AlterTable
ALTER TABLE "EmailValidation" DROP CONSTRAINT "EmailValidation_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "EmailValidation_id_seq";

-- AlterTable
ALTER TABLE "HostEvent" DROP CONSTRAINT "HostEvent_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "HostEvent_id_seq";

-- AlterTable
ALTER TABLE "NodeRole" DROP CONSTRAINT "NodeRole_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "siteNodeId" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "NodeRole_id_seq";

-- AlterTable
ALTER TABLE "PhoneValidation" DROP CONSTRAINT "PhoneValidation_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "PhoneValidation_id_seq";

-- AlterTable
ALTER TABLE "Site" DROP CONSTRAINT "Site_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "ownerId" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "Site_id_seq";

-- AlterTable
ALTER TABLE "SiteEvent" DROP CONSTRAINT "SiteEvent_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "siteId" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "siteNodeId" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "SiteEvent_id_seq";

-- AlterTable
ALTER TABLE "SiteNode" DROP CONSTRAINT "SiteNode_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "siteId" SET DATA TYPE TEXT,
ALTER COLUMN "parentNodeId" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "SiteNode_id_seq";

-- AlterTable
ALTER TABLE "SiteRole" DROP CONSTRAINT "SiteRole_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "siteId" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "SiteRole_id_seq";

-- AlterTable
ALTER TABLE "SiteRoleInvitation" DROP CONSTRAINT "SiteRoleInvitation_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "siteId" SET DATA TYPE TEXT,
ALTER COLUMN "recipientUserId" SET DATA TYPE TEXT,
ALTER COLUMN "fromUserId" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "SiteRoleInvitation_id_seq";

-- AlterTable
ALTER TABLE "SiteToken" DROP CONSTRAINT "SiteToken_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "siteId" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "SiteToken_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AlterTable
ALTER TABLE "VerifiedEmail" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "BillingEvent" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailValidation" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeRole" ADD FOREIGN KEY("siteNodeId")REFERENCES "SiteNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeRole" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD FOREIGN KEY("ownerId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteEvent" ADD FOREIGN KEY("siteId")REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteEvent" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteEvent" ADD FOREIGN KEY("siteNodeId")REFERENCES "SiteNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteNode" ADD FOREIGN KEY("siteId")REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteNode" ADD FOREIGN KEY("parentNodeId")REFERENCES "SiteNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteRole" ADD FOREIGN KEY("siteId")REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteRole" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteRoleInvitation" ADD FOREIGN KEY("siteId")REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteRoleInvitation" ADD FOREIGN KEY("recipientUserId")REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteRoleInvitation" ADD FOREIGN KEY("fromUserId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteToken" ADD FOREIGN KEY("siteId")REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedEmail" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
