"use server"

import { auth, IMPERSONATION_COOKIE } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { logAdminAction } from "@/lib/audit"

export async function startImpersonation(targetUserId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // Check if the real user (not impersonated) is a super admin
  // If already impersonating, realAdminId holds the real admin
  const realAdminId = session.user.realAdminId ?? session.user.id

  // Verify the real admin is actually a super admin by checking the DB
  const admin = await prisma.user.findUnique({
    where: { id: realAdminId },
    select: { isSuperAdmin: true },
  })
  if (!admin?.isSuperAdmin) {
    throw new Error("Forbidden")
  }

  // Verify target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, email: true, orgId: true },
  })
  if (!targetUser) {
    throw new Error("User not found")
  }

  // Set the impersonation cookie
  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATION_COOKIE, targetUserId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour auto-expiry
  })

  await logAdminAction(realAdminId, "START_IMPERSONATION", "User", targetUserId, {
    userName: targetUser.name,
    userEmail: targetUser.email,
  })

  redirect("/")
}

export async function stopImpersonation() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const realAdminId = session.user.realAdminId
  if (!realAdminId) {
    throw new Error("Not currently impersonating")
  }

  const impersonatedUserId = session.user.id

  // Clear the impersonation cookie
  const cookieStore = await cookies()
  cookieStore.delete(IMPERSONATION_COOKIE)

  await logAdminAction(realAdminId, "STOP_IMPERSONATION", "User", impersonatedUserId, {})

  redirect("/admin")
}
