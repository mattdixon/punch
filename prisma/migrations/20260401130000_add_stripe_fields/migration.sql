-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "planName" TEXT,
ADD COLUMN     "planUserLimit" INTEGER,
ADD COLUMN     "subscriptionStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeCustomerId_key" ON "Organization"("stripeCustomerId");
