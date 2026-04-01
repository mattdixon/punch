import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { getPlanByPriceId } from "@/lib/plans"
import type Stripe from "stripe"

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const orgId = session.metadata?.orgId
      if (!orgId || !session.subscription) break

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      )
      const priceId = subscription.items.data[0]?.price.id
      const plan = priceId ? getPlanByPriceId(priceId) : undefined

      await prisma.organization.update({
        where: { id: orgId },
        data: {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          planName: plan?.name ?? "Pro",
          planUserLimit: plan?.userLimit ?? 10,
          subscriptionStatus: subscription.status,
          trialEndsAt: null, // Clear trial on subscription
        },
      })
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const priceId = subscription.items.data[0]?.price.id
      const plan = priceId ? getPlanByPriceId(priceId) : undefined

      const org = await prisma.organization.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      })
      if (!org) break

      await prisma.organization.update({
        where: { id: org.id },
        data: {
          stripePriceId: priceId,
          planName: plan?.name ?? org.planName,
          planUserLimit: plan?.userLimit ?? org.planUserLimit,
          subscriptionStatus: subscription.status,
        },
      })
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription

      const org = await prisma.organization.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      })
      if (!org) break

      await prisma.organization.update({
        where: { id: org.id },
        data: {
          subscriptionStatus: "canceled",
          planName: "Free",
          planUserLimit: 2,
          stripePriceId: null,
          stripeSubscriptionId: null,
        },
      })
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscriptionId = (invoice as any).subscription as string | null
      if (!subscriptionId) break

      const org = await prisma.organization.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
      })
      if (!org) break

      await prisma.organization.update({
        where: { id: org.id },
        data: { subscriptionStatus: "past_due" },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
