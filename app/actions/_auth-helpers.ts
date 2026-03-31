"use server"

import { auth } from "@/lib/auth"

type AuthUser = {
  id: string
  role: string
  orgId: string
}

type AuthResult = {
  user: AuthUser
}

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  const user = session.user as { id?: string; role?: string; orgId?: string }
  if (!user.id || !user.orgId) {
    throw new Error("Unauthorized")
  }
  return {
    user: {
      id: user.id,
      role: user.role || "MEMBER",
      orgId: user.orgId,
    },
  }
}

export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireAuth()
  if (result.user.role !== "ADMIN" && result.user.role !== "OWNER") {
    throw new Error("Forbidden")
  }
  return result
}

export async function requireOwner(): Promise<AuthResult> {
  const result = await requireAuth()
  if (result.user.role !== "OWNER") {
    throw new Error("Forbidden")
  }
  return result
}
