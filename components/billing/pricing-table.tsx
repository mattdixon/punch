"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"
import { createCheckoutSession } from "@/app/actions/billing"
import { toast } from "sonner"

type Plan = {
  name: string
  monthlyPrice: number
  userLimit: number
  features: string[]
}

interface PricingTableProps {
  plans: Plan[]
  currentPlan: string
  isOwner: boolean
}

export function PricingTable({ plans, currentPlan, isOwner }: PricingTableProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleChoosePlan(planName: string) {
    setLoading(planName)
    try {
      const { url } = await createCheckoutSession(planName)
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => {
        const isCurrent = plan.name === currentPlan
        const isPopular = plan.name === "Pro"
        const isPaid = plan.monthlyPrice > 0

        return (
          <Card
            key={plan.name}
            className={`relative ${isPopular ? "border-primary shadow-md" : ""}`}
          >
            {isPopular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">
                  ${plan.monthlyPrice}
                </span>
                {plan.monthlyPrice > 0 && (
                  <span className="text-muted-foreground">/mo</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Up to {plan.userLimit} users
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button className="w-full" variant="outline" disabled>
                  Current Plan
                </Button>
              ) : isPaid && isOwner ? (
                <Button
                  className="w-full"
                  variant={isPopular ? "default" : "outline"}
                  disabled={loading !== null}
                  onClick={() => handleChoosePlan(plan.name)}
                >
                  {loading === plan.name ? "Redirecting..." : `Choose ${plan.name}`}
                </Button>
              ) : !isPaid ? (
                <Button className="w-full" variant="outline" disabled>
                  Free
                </Button>
              ) : (
                <Button className="w-full" variant="outline" disabled>
                  Contact owner to upgrade
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
