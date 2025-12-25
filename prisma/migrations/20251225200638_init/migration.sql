-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "uuid" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "avatar" TEXT,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "keywords" TEXT[],

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
