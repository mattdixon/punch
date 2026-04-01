import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

export type PlanDefinition = {
  name: string
  amountCents: number // monthly price in cents
  userLimit: number
  features: string[]
}

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    name: "Free",
    amountCents: 0,
    userLimit: 2,
    features: [
      "Up to 2 users",
      "Time tracking",
      "Weekly timesheets",
      "CSV export",
    ],
  },
  {
    name: "Pro",
    amountCents: 2900, // $29.00
    userLimit: 10,
    features: [
      "Up to 10 users",
      "Everything in Free",
      "Timecard approvals",
      "Custom bill & pay rates",
      "Email support",
    ],
  },
  {
    name: "Business",
    amountCents: 7900, // $79.00
    userLimit: 50,
    features: [
      "Up to 50 users",
      "Everything in Pro",
      "QuickBooks export format",
      "Priority support",
    ],
  },
]

/**
 * Get the Stripe price ID for a plan, creating the product/price in Stripe
 * if it doesn't exist yet. Returns null for the Free plan.
 */
export async function getOrCreateStripePriceId(planName: string): Promise<string | null> {
  const def = PLAN_DEFINITIONS.find((p) => p.name === planName)
  if (!def || def.amountCents === 0 || !stripe) return null

  // Check DB cache first
  const existing = await prisma.stripePlan.findUnique({
    where: { name: planName },
  })
  if (existing) return existing.stripePriceId

  // Create in Stripe
  const product = await stripe.products.create({
    name: `Punch ${planName}`,
    description: `Punch ${planName} plan — up to ${def.userLimit} users`,
  })

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: def.amountCents,
    currency: "usd",
    recurring: { interval: "month" },
  })

  // Cache in DB
  await prisma.stripePlan.create({
    data: {
      name: planName,
      stripePriceId: price.id,
      stripeProductId: product.id,
      amountCents: def.amountCents,
      userLimit: def.userLimit,
    },
  })

  return price.id
}

/**
 * Look up a plan by its Stripe price ID.
 */
export async function getPlanByPriceId(priceId: string): Promise<PlanDefinition | undefined> {
  const stored = await prisma.stripePlan.findUnique({
    where: { stripePriceId: priceId },
  })
  if (!stored) return undefined
  return PLAN_DEFINITIONS.find((p) => p.name === stored.name)
}

export function getPlanByName(name: string): PlanDefinition | undefined {
  return PLAN_DEFINITIONS.find((p) => p.name === name)
}
