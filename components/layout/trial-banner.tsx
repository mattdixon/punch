"use client"

import { AlertTriangle, Clock } from "lucide-react"

interface TrialBannerProps {
  daysRemaining: number | null
  isExpired: boolean
}

export function TrialBanner({ daysRemaining, isExpired }: TrialBannerProps) {
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
      </div>
    )
  }

  if (daysRemaining <= 7) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-4 py-2 flex items-center gap-2 text-sm border-b border-yellow-200 dark:border-yellow-800">
        <Clock className="h-4 w-4" />
        <span>
          {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left in your trial.
        </span>
      </div>
    )
  }

  return null // more than 7 days remaining, don't show banner
}
