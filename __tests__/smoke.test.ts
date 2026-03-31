import { describe, it, expect } from 'vitest'
import { mockPrisma } from './helpers/prisma-mock'
import { mockSession } from './helpers/auth-mock'

describe('Test setup', () => {
  it('should pass a basic assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have a working prisma mock', () => {
    const prisma = mockPrisma()
    expect(prisma.user.findMany).toBeDefined()
    expect(prisma.timeEntry.upsert).toBeDefined()
    expect(prisma.organization.findUnique).toBeDefined()
  })

  it('should create a mock session with defaults', () => {
    const session = mockSession()
    expect(session.user.id).toBe('user-1')
    expect(session.user.email).toBe('test@test.com')
    expect(session.user.role).toBe('ADMIN')
  })

  it('should create a mock session with overrides', () => {
    const session = mockSession({ role: 'MEMBER', name: 'Jane Doe' })
    expect(session.user.role).toBe('MEMBER')
    expect(session.user.name).toBe('Jane Doe')
    expect(session.user.email).toBe('test@test.com') // default preserved
  })
})
