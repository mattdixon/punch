"use server"

import { requireSuperAdmin } from "@/app/actions/_auth-helpers"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logAdminAction } from "@/lib/audit"
import type { OrgStatus } from "@prisma/client"

export async function listOrganizations(filters?: {
  search?: string
  status?: OrgStatus
}) {
  await requireSuperAdmin()

  const where: Record<string, unknown> = {}

  if (filters?.search) {
    where.companyName = { contains: filters.search, mode: "insensitive" }
  }
  if (filters?.status) {
    where.status = filters.status
  }

  const orgs = await prisma.organization.findMany({
    where,
    include: {
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return orgs.map((org) => ({
    id: org.id,
    companyName: org.companyName,
    slug: org.slug,
    status: org.status,
    userCount: org._count.users,
    createdAt: org.createdAt.toISOString(),
  }))
}

export async function getOrganizationDetail(orgId: string) {
  await requireSuperAdmin()

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          archivedAt: true,
          createdAt: true,
        },
        orderBy: { name: "asc" },
      },
      _count: {
        select: { clients: true, projects: true },
      },
    },
  })

  if (!org) {
    throw new Error("Organization not found")
  }

  return {
    id: org.id,
    companyName: org.companyName,
    slug: org.slug,
    status: org.status,
    defaultPaymentTerms: org.defaultPaymentTerms,
    defaultBillCents: org.defaultBillCents,
    defaultPayCents: org.defaultPayCents,
    defaultCurrency: org.defaultCurrency,
    trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
    clientCount: org._count.clients,
    projectCount: org._count.projects,
    users: org.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isArchived: !!u.archivedAt,
      createdAt: u.createdAt.toISOString(),
    })),
  }
}

export async function updateOrganizationStatus(
  orgId: string,
  status: OrgStatus
) {
  const { user } = await requireSuperAdmin()

  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  if (!org) {
    throw new Error("Organization not found")
  }

  const previousStatus = org.status

  await prisma.organization.update({
    where: { id: orgId },
    data: { status },
  })

  await logAdminAction(user.id, `${status}_ORG`, "Organization", orgId, {
    orgName: org.companyName,
    previousStatus,
  })

  revalidatePath("/admin/tenants")
  revalidatePath(`/admin/tenants/${orgId}`)
}

export async function updateOrganization(
  orgId: string,
  data: { companyName: string }
) {
  const { user } = await requireSuperAdmin()

  if (!data.companyName.trim()) {
    throw new Error("Company name is required")
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  if (!org) {
    throw new Error("Organization not found")
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: { companyName: data.companyName.trim() },
  })

  await logAdminAction(user.id, "UPDATE_ORG", "Organization", orgId, {
    orgName: data.companyName.trim(),
    previousName: org.companyName,
  })

  revalidatePath("/admin/tenants")
  revalidatePath(`/admin/tenants/${orgId}`)
}

export async function updateTrialEndDate(
  orgId: string,
  trialEndsAt: string | null
) {
  const { user } = await requireSuperAdmin()

  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  if (!org) {
    throw new Error("Organization not found")
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: { trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null },
  })

  await logAdminAction(user.id, "UPDATE_TRIAL", "Organization", orgId, {
    orgName: org.companyName,
    trialEndsAt: trialEndsAt ?? "removed",
  })

  revalidatePath("/admin/tenants")
  revalidatePath(`/admin/tenants/${orgId}`)
}
