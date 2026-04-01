-- CreateTable
CREATE TABLE "StripePlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "stripeProductId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "userLimit" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripePlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripePlan_name_key" ON "StripePlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StripePlan_stripePriceId_key" ON "StripePlan"("stripePriceId");
