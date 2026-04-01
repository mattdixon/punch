"use client"

import Link from "next/link"
import { AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TrialBannerProps {
  daysRemaining: number | null
  isExpired: boolean
  isStripeEnabled: boolean
}

export function TrialBanner({ daysRemaining, isExpired, isStripeEnabled }: TrialBannerProps) {
  if (daysRemaining === null) return null // no trial

  if (isExpired) {
    return (
      <div className="bg-destructive/10 text-destructive px-4 py-2 flex items-center justify-between text-sm border-b border-destructive/20">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>
            Your trial has expired. Your data is safe, but editing is disabled.
          </span>
        </div>
        {isStripeEnabled && (
          <Button size="sm" variant="destructive" asChild>
            <Link href="/settings/billing">Choose a Plan</Link>
          </Button>
        )}
      </div>
    )
  }

  if (daysRemaining <= 7) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-4 py-2 flex items-center justify-between text-sm border-b border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left in your trial.
          </span>
        </div>
        {isStripeEnabled && (
          <Button size="sm" variant="outline" asChild>
            <Link href="/settings/billing">Upgrade Now</Link>
          </Button>
        )}
      </div>
    )
  }

  return null
}
