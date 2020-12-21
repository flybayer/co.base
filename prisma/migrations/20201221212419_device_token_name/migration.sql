/*
  Warnings:

  - Added the required column `name` to the `DeviceToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DeviceToken" ADD COLUMN     "name" TEXT NOT NULL;
