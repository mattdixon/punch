import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getBillingStatus, getPlans } from "@/app/actions/billing"
import { BillingStatus } from "@/components/billing/billing-status"
import { PricingTable } from "@/components/billing/pricing-table"

export default async function BillingPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const status = await getBillingStatus()
  const plans = await getPlans()

  if (!status.isStripeEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-muted-foreground">
            Billing is managed by your system administrator.
          </p>
        </div>
      </div>
    )
  }

  const isOwner = session.user.role === "OWNER"

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      <BillingStatus
        planName={status.planName}
        subscriptionStatus={status.subscriptionStatus}
        planUserLimit={status.planUserLimit}
        isOwner={isOwner}
      />

      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <PricingTable
          plans={plans}
          currentPlan={status.planName}
          isOwner={isOwner}
        />
      </div>
    </div>
  )
}
