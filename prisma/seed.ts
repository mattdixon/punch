import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "Punch",
      defaultPaymentTerms: "Net 15",
      defaultBillCents: 15000,
      defaultPayCents: 5000,
      defaultCurrency: "USD",
      fiscalYearStartMonth: 1,
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: "admin@punch.local" },
    update: {},
    create: {
      email: "admin@punch.local",
      passwordHash: await hash("password123", 12),
      name: "Admin User",
      role: "ADMIN",
      defaultPayCents: 0,
    },
  })

  const member = await prisma.user.upsert({
    where: { email: "member@punch.local" },
    update: {},
    create: {
      email: "member@punch.local",
      passwordHash: await hash("password123", 12),
      name: "Jane Smith",
      role: "MEMBER",
      defaultPayCents: 5000,
    },
  })

  const client = await prisma.client.create({
    data: { name: "Acme Corp" },
  })

  const project = await prisma.project.create({
    data: {
      name: "Website Redesign",
      clientId: client.id,
      defaultBillCents: 15000,
    },
  })

  await prisma.projectAssignment.create({
    data: {
      userId: admin.id,
      projectId: project.id,
    },
  })

  await prisma.projectAssignment.create({
    data: {
      userId: member.id,
      projectId: project.id,
      payRateCents: 7500,
      billRateCents: 17500,
    },
  })

  console.log("Seed complete:", { admin: admin.email, member: member.email })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
