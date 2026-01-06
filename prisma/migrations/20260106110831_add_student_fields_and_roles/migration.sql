/*
  Warnings:

  - The values [USER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[universityId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('STUDENT', 'GUEST', 'ADMIN', 'SUPER_ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STUDENT';
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "stage" TEXT,
ADD COLUMN     "universityId" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "googleId" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'STUDENT';

-- CreateIndex
CREATE UNIQUE INDEX "User_universityId_key" ON "User"("universityId");
