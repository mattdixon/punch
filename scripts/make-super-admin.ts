/**
 * Mark an existing user as a super admin.
 *
 * Usage:
 *   npx tsx scripts/make-super-admin.ts <email>
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.error("Usage: npx tsx scripts/make-super-admin.ts <email>")
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    console.error(`User not found: ${email}`)
    process.exit(1)
  }

  if (user.isSuperAdmin) {
    console.log(`${email} is already a super admin.`)
    return
  }

  await prisma.user.update({
    where: { email },
    data: { isSuperAdmin: true },
  })

  console.log(`${email} is now a super admin.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
