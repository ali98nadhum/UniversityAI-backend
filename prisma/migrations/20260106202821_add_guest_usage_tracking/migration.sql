-- CreateTable
CREATE TABLE "GuestUsage" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuestUsage_userId_idx" ON "GuestUsage"("userId");

-- CreateIndex
CREATE INDEX "GuestUsage_date_idx" ON "GuestUsage"("date");

-- CreateIndex
CREATE UNIQUE INDEX "GuestUsage_userId_date_key" ON "GuestUsage"("userId", "date");

-- AddForeignKey
ALTER TABLE "GuestUsage" ADD CONSTRAINT "GuestUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
