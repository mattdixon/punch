import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export async function logAdminAction(
  adminUserId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, string | number | boolean>
) {
  await prisma.adminAuditLog.create({
    data: {
      adminUserId,
      action,
      targetType,
      targetId,
      metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  })
}
