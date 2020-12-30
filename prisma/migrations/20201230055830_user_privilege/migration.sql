-- CreateEnum
CREATE TYPE "UserPrivilege" AS ENUM ('NONE', 'MEMBER', 'VIP');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "privilege" "UserPrivilege" NOT NULL DEFAULT E'NONE';
