"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isTrialExpired } from "@/lib/trial"

type AuthUser = {
  id: string
  role: string
  orgId: string | null
  isSuperAdmin: boolean
}

type OrgAuthUser = {
  id: string
  role: string
  orgId: string
  isSuperAdmin: boolean
}

type AuthResult = {
  user: AuthUser
}

type OrgAuthResult = {
  user: OrgAuthUser
}

/**
 * Requires authentication but does NOT require an orgId.
 * Use this for actions that super admins (who may not have an org) can access.
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  const user = session.user as { id?: string; role?: string; orgId?: string | null; isSuperAdmin?: boolean }
  if (!user.id) {
    throw new Error("Unauthorized")
  }
  return {
    user: {
      id: user.id,
      role: user.role || "MEMBER",
      orgId: user.orgId ?? null,
      isSuperAdmin: user.isSuperAdmin ?? false,
    },
  }
}

/**
 * Requires authentication AND a valid orgId.
 * Use this for all org-scoped actions (the default for most existing actions).
 */
export async function requireOrgAuth(): Promise<OrgAuthResult> {
  const result = await requireAuth()
  if (!result.user.orgId) {
    throw new Error("Unauthorized")
  }
  return {
    user: {
      id: result.user.id,
      role: result.user.role,
      orgId: result.user.orgId,
      isSuperAdmin: result.user.isSuperAdmin,
    },
  }
}

export async function requireAdmin(): Promise<OrgAuthResult> {
  const result = await requireOrgAuth()
  if (result.user.role !== "ADMIN" && result.user.role !== "OWNER") {
    throw new Error("Forbidden")
  }
  return result
}

/**
 * Requires admin role AND checks that the org's trial is not expired.
 * Use for admin create/update/delete operations.
 */
export async function requireAdminWriteAccess(): Promise<OrgAuthResult> {
  const result = await requireAdmin()

  const org = await prisma.organization.findUnique({
    where: { id: result.user.orgId },
    select: { trialEndsAt: true },
  })

  if (org && isTrialExpired(org)) {
    throw new Error("Your trial has expired. Upgrade to continue editing.")
  }

  return result
}

export async function requireOwner(): Promise<OrgAuthResult> {
  const result = await requireOrgAuth()
  if (result.user.role !== "OWNER") {
    throw new Error("Forbidden")
  }
  return result
}

/**
 * Requires the user to be a super admin (platform-level).
 * Does NOT require an orgId.
 */
export async function requireSuperAdmin(): Promise<AuthResult> {
  const result = await requireAuth()
  if (!result.user.isSuperAdmin) {
    throw new Error("Forbidden")
  }
  return result
}

/**
 * Requires org auth AND checks that the org's trial is not expired.
 * Use this for all create/update/delete operations.
 */
export async function requireWriteAccess(): Promise<OrgAuthResult> {
  const result = await requireOrgAuth()

  const org = await prisma.organization.findUnique({
    where: { id: result.user.orgId },
    select: { trialEndsAt: true },
  })

  if (org && isTrialExpired(org)) {
    throw new Error("Your trial has expired. Upgrade to continue editing.")
  }

  return result
}
