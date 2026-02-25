"use server"

import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { createToken, validateToken, hashToken } from "@/lib/tokens"
import { sendEmail, isEmailConfigured } from "@/lib/email"
import { ResetEmail } from "@/components/emails/reset-email"

/**
 * Public action: user submits the "forgot password" form.
 * Always returns success to prevent email enumeration.
 */
export async function requestPasswordReset(email: string) {
  if (!isEmailConfigured()) {
    throw new Error(
      "Email is not configured. Please contact your administrator to reset your password."
    )
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, archivedAt: true },
  })

  // Silently succeed if user not found or archived (prevents enumeration)
  if (!user || user.archivedAt) {
    return { success: true }
  }

  const rawToken = await createToken(user.id, "PASSWORD_RESET")
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const resetUrl = `${baseUrl}/set-password?token=${rawToken}&type=reset`

  await sendEmail({
    to: user.email,
    subject: "Reset your Punch password",
    react: ResetEmail({ name: user.name, resetUrl }),
  })

  return { success: true }
}

/**
 * Public action: validate a token from a URL.
 * Returns minimal info for the set-password page to render.
 */
export async function validateSetPasswordToken(
  rawToken: string,
  type: "invite" | "reset"
) {
  const tokenType = type === "invite" ? "INVITE" : "PASSWORD_RESET"
  const result = await validateToken(rawToken, tokenType)

  if (!result.valid) {
    return { valid: false as const, error: result.error }
  }

  return { valid: true as const, userName: result.user.name }
}

/**
 * Public action: user submits a new password via the set-password page.
 */
export async function setPasswordWithToken(
  rawToken: string,
  newPassword: string
) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters")
  }

  // Try INVITE first, then PASSWORD_RESET
  let result = await validateToken(rawToken, "INVITE")
  if (!result.valid) {
    result = await validateToken(rawToken, "PASSWORD_RESET")
  }

  if (!result.valid) {
    throw new Error(result.error)
  }

  const passwordHash = await hash(newPassword, 12)
  const tokenHash = hashToken(rawToken)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: result.user.id },
      data: { passwordHash },
    }),
    prisma.token.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    }),
  ])

  return { success: true }
}
