/*
  Warnings:

  - A unique constraint covering the columns `[referral_code]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");
