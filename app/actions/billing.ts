"use server"

import { requireOrgAuth } from "@/app/actions/_auth-helpers"
import { prisma } from "@/lib/prisma"
import { stripe, isStripeEnabled } from "@/lib/stripe"
import { PLANS } from "@/lib/plans"

export async function getBillingStatus() {
  const { user } = await requireOrgAuth()

  const org = await prisma.organization.findUnique({
    where: { id: user.orgId },
    select: {
      planName: true,
      subscriptionStatus: true,
      stripePriceId: true,
      planUserLimit: true,
      trialEndsAt: true,
    },
  })

  if (!org) throw new Error("Organization not found")

  return {
    planName: org.planName ?? "Free",
    subscriptionStatus: org.subscriptionStatus ?? null,
    planUserLimit: org.planUserLimit ?? 2,
    trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
    isStripeEnabled: isStripeEnabled(),
  }
}

export async function createCheckoutSession(priceId: string) {
  const { user } = await requireOrgAuth()

  if (!stripe) {
    throw new Error("Billing is not configured")
  }

  if (user.role !== "OWNER") {
    throw new Error("Only the organization owner can manage billing")
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.orgId },
    include: { users: { where: { role: "OWNER" }, take: 1 } },
  })
  if (!org) throw new Error("Organization not found")

  // Get or create Stripe customer
  let customerId = org.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.companyName,
      email: org.users[0]?.email,
      metadata: { orgId: org.id },
    })
    customerId = customer.id
    await prisma.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/settings/billing?success=1`,
    cancel_url: `${baseUrl}/settings/billing?canceled=1`,
    metadata: { orgId: org.id },
  })

  return { url: session.url }
}

export async function createBillingPortalSession() {
  const { user } = await requireOrgAuth()

  if (!stripe) {
    throw new Error("Billing is not configured")
  }

  if (user.role !== "OWNER") {
    throw new Error("Only the organization owner can manage billing")
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.orgId },
    select: { stripeCustomerId: true },
  })
  if (!org?.stripeCustomerId) {
    throw new Error("No billing account found")
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${baseUrl}/settings/billing`,
  })

  return { url: session.url }
}

export async function getPlans() {
  return PLANS.map((p) => ({
    name: p.name,
    priceId: p.priceId,
    monthlyPrice: p.monthlyPrice,
    userLimit: p.userLimit,
    features: p.features,
  }))
}
