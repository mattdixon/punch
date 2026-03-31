"use server"

import { requireAdmin, requireAuth } from "@/app/actions/_auth-helpers"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getCompanySettings() {
  const { user } = await requireAuth()

  const org = await prisma.organization.findUnique({
    where: { id: user.orgId },
  })

  if (!org) {
    throw new Error("Organization not found")
  }

  return org
}

export async function updateCompanySettings(data: {
  companyName: string
  defaultPaymentTerms: string
  defaultBillCents: number
  defaultPayCents: number
  defaultCurrency: string
  fiscalYearStartMonth: number
}) {
  const { user } = await requireAdmin()

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

  await prisma.organization.update({
    where: { id: user.orgId },
    data: {
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

const MAX_LOGO_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/svg+xml"]

export async function updateCompanyLogo(dataUrl: string | null) {
  const { user } = await requireAdmin()

  if (dataUrl !== null) {
    const match = dataUrl.match(/^data:(image\/(png|jpeg|svg\+xml));base64,/)
    if (!match) {
      throw new Error("Invalid image format. Use PNG, JPG, or SVG.")
    }

    const base64Data = dataUrl.slice(dataUrl.indexOf(",") + 1)
    const sizeInBytes = Math.ceil(base64Data.length * 0.75)
    if (sizeInBytes > MAX_LOGO_SIZE) {
      throw new Error("Logo must be under 2MB.")
    }
  }

  await prisma.organization.update({
    where: { id: user.orgId },
    data: { logoBase64: dataUrl },
  })

  revalidatePath("/settings")
  revalidatePath("/", "layout")
}
