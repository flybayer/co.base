/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[siteId,userId]` on the table `SiteRole`. If there are existing duplicate values, the migration will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SiteRoleUnique" ON "SiteRole"("siteId", "userId");
