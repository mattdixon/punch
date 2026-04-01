"use server"

import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { createTrialEndDate } from "@/lib/trial"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function signUp(data: {
  orgName: string
  name: string
  email: string
  password: string
}) {
  const { orgName, name, email, password } = data

  // Validate inputs
  if (!orgName.trim()) {
    throw new Error("Organization name is required")
  }
  if (!name.trim()) {
    throw new Error("Name is required")
  }
  if (!email.trim()) {
    throw new Error("Email is required")
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters")
  }

  // Check email not taken
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })
  if (existing) {
    throw new Error("An account with this email already exists")
  }

  // Create slug from orgName
  let slug = slugify(orgName)
  if (!slug) {
    slug = "org"
  }

  // Ensure slug is unique
  const existingOrg = await prisma.organization.findUnique({
    where: { slug },
  })
  if (existingOrg) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  // Hash password
  const passwordHash = await hash(password, 12)

  // Create org and user in a transaction
  await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        companyName: orgName.trim(),
        slug,
        trialEndsAt: createTrialEndDate(),
      },
    })

    await tx.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash,
        role: "OWNER",
        orgId: org.id,
      },
    })
  })

  return { success: true }
}
