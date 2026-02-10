"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden")
  }
  return session
}

export async function getCompanySettings() {
  const settings = await prisma.companySettings.findUnique({
    where: { id: "default" },
  })

  if (!settings) {
    return prisma.companySettings.create({
      data: { id: "default" },
    })
  }

  return settings
}

export async function updateCompanySettings(data: {
  companyName: string
  defaultPaymentTerms: string
  defaultBillCents: number
  defaultPayCents: number
  defaultCurrency: string
  fiscalYearStartMonth: number
}) {
  await requireAdmin()

  if (!data.companyName.trim()) {
    throw new Error("Company name is required")
  }

  const validTerms = ["Due on receipt", "Net 15", "Net 30", "Net 60"]
  if (!validTerms.includes(data.defaultPaymentTerms)) {
    throw new Error("Invalid payment terms")
  }

  if (data.fiscalYearStartMonth < 1 || data.fiscalYearStartMonth > 12) {
    throw new Error("Fiscal year start month must be between 1 and 12")
  }

  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {
      companyName: data.companyName.trim(),
      defaultPaymentTerms: data.defaultPaymentTerms,
      defaultBillCents: data.defaultBillCents,
      defaultPayCents: data.defaultPayCents,
      defaultCurrency: data.defaultCurrency,
      fiscalYearStartMonth: data.fiscalYearStartMonth,
    },
    create: {
      id: "default",
      companyName: data.companyName.trim(),
      defaultPaymentTerms: data.defaultPaymentTerms,
      defaultBillCents: data.defaultBillCents,
      defaultPayCents: data.defaultPayCents,
      defaultCurrency: data.defaultCurrency,
      fiscalYearStartMonth: data.fiscalYearStartMonth,
    },
  })

  revalidatePath("/settings")
  revalidatePath("/", "layout")
}
