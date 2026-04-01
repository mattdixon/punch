"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createBillingPortalSession } from "@/app/actions/billing"
import { toast } from "sonner"
import { CreditCard } from "lucide-react"

interface BillingStatusProps {
  planName: string
  subscriptionStatus: string | null
  planUserLimit: number
  isOwner: boolean
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null
  switch (status) {
    case "active":
      return <Badge className="bg-green-600">Active</Badge>
    case "past_due":
      return <Badge variant="destructive">Past Due</Badge>
    case "canceled":
      return <Badge variant="secondary">Canceled</Badge>
    case "trialing":
      return <Badge variant="outline">Trialing</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function BillingStatus({
  planName,
  subscriptionStatus,
  planUserLimit,
  isOwner,
}: BillingStatusProps) {
  const [loading, setLoading] = useState(false)

  async function handleManageBilling() {
    setLoading(true)
    try {
      const { url } = await createBillingPortalSession()
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open billing portal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Current Plan</CardTitle>
        <CreditCard className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold">{planName}</span>
          <StatusBadge status={subscriptionStatus} />
        </div>
        <p className="text-sm text-muted-foreground">
          Up to {planUserLimit} users
        </p>
        {subscriptionStatus === "active" && isOwner && (
          <Button
            variant="outline"
            onClick={handleManageBilling}
            disabled={loading}
          >
            {loading ? "Opening..." : "Manage Subscription"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
