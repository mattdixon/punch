import { describe, it, expect } from 'vitest'
import { Prisma } from '@prisma/client'

describe('Tenant model orgId fields', () => {
  it('User model should have orgId in create input', () => {
    const input: Prisma.UserCreateInput = {
      email: 'test@test.com',
      name: 'Test',
      organization: { connect: { id: 'org-1' } },
    }
    expect(input.organization).toBeDefined()
  })

  it('Client model should have orgId in create input', () => {
    const input: Prisma.ClientCreateInput = {
      name: 'Test Client',
      organization: { connect: { id: 'org-1' } },
    }
    expect(input.organization).toBeDefined()
  })

  it('Project model should have orgId in create input', () => {
    const input: Prisma.ProjectCreateInput = {
      name: 'Test Project',
      client: { connect: { id: 'client-1' } },
      organization: { connect: { id: 'org-1' } },
    }
    expect(input.organization).toBeDefined()
  })

  it('User where input should support orgId filtering', () => {
    const where: Prisma.UserWhereInput = {
      orgId: 'org-1',
    }
    expect(where.orgId).toBe('org-1')
  })

  it('Client where input should support orgId filtering', () => {
    const where: Prisma.ClientWhereInput = {
      orgId: 'org-1',
    }
    expect(where.orgId).toBe('org-1')
  })

  it('Project where input should support orgId filtering', () => {
    const where: Prisma.ProjectWhereInput = {
      orgId: 'org-1',
    }
    expect(where.orgId).toBe('org-1')
  })
})
