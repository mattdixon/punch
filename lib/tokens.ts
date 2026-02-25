import { randomBytes, createHash } from "crypto"
import { prisma } from "@/lib/prisma"
import type { TokenType } from "@prisma/client"

const EXPIRY_HOURS: Record<TokenType, number> = {
  INVITE: 72,
  PASSWORD_RESET: 24,
}

export function generateToken(): string {
  return randomBytes(32).toString("base64url")
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function createToken(
  userId: string,
  type: TokenType
): Promise<string> {
  // Invalidate any existing unused tokens of the same type for this user
  await prisma.token.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  })

  const rawToken = generateToken()
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + EXPIRY_HOURS[type] * 60 * 60 * 1000)

  await prisma.token.create({
    data: { type, tokenHash, userId, expiresAt },
  })

  return rawToken
}

export async function validateToken(rawToken: string, expectedType: TokenType) {
  const tokenHash = hashToken(rawToken)

  const token = await prisma.token.findUnique({
    where: { tokenHash },
    include: {
      user: { select: { id: true, name: true, email: true, archivedAt: true } },
    },
  })

  if (!token || token.type !== expectedType) {
    return { valid: false as const, error: "Invalid or expired link" }
  }

  if (token.usedAt) {
    return { valid: false as const, error: "This link has already been used" }
  }

  if (token.expiresAt < new Date()) {
    return { valid: false as const, error: "This link has expired" }
  }

  if (token.user.archivedAt) {
    return { valid: false as const, error: "This account has been deactivated" }
  }

  return { valid: true as const, token, user: token.user }
}

export async function consumeToken(tokenHash: string) {
  await prisma.token.update({
    where: { tokenHash },
    data: { usedAt: new Date() },
  })
}
