export type Plan = {
  name: string
  priceId: string | null
  monthlyPrice: number // in dollars, for display
  userLimit: number
  features: string[]
}

export const PLANS: Plan[] = [
  {
    name: "Free",
    priceId: null,
    monthlyPrice: 0,
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
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    monthlyPrice: 29,
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
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID ?? null,
    monthlyPrice: 79,
    userLimit: 50,
    features: [
      "Up to 50 users",
      "Everything in Pro",
      "QuickBooks export format",
      "Priority support",
    ],
  },
]

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return PLANS.find((p) => p.priceId === priceId)
}

export function getPlanByName(name: string): Plan | undefined {
  return PLANS.find((p) => p.name === name)
}
