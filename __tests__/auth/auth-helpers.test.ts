import { describe, it, expect, beforeEach } from 'vitest'
import { mockAuth, mockSession } from '../helpers/auth-mock'

// These imports will fail until we create the file
import { requireAuth, requireAdmin, requireOwner } from '@/app/actions/_auth-helpers'

describe('requireAuth', () => {
  beforeEach(() => {
    mockAuth(mockSession({ orgId: 'org-1', role: 'MEMBER' }))
  })

  it('should return user with orgId when authenticated', async () => {
    const result = await requireAuth()
    expect(result.user.id).toBe('user-1')
    expect(result.user.orgId).toBe('org-1')
    expect(result.user.role).toBe('MEMBER')
  })

  it('should throw Unauthorized when no session', async () => {
    mockAuth(null)
    await expect(requireAuth()).rejects.toThrow('Unauthorized')
  })

  it('should throw Unauthorized when session has no orgId', async () => {
    mockAuth(mockSession({ orgId: undefined }))
    await expect(requireAuth()).rejects.toThrow('Unauthorized')
  })
})

describe('requireAdmin', () => {
  it('should succeed for ADMIN role', async () => {
    mockAuth(mockSession({ role: 'ADMIN', orgId: 'org-1' }))
    const result = await requireAdmin()
    expect(result.user.role).toBe('ADMIN')
    expect(result.user.orgId).toBe('org-1')
  })

  it('should succeed for OWNER role', async () => {
    mockAuth(mockSession({ role: 'OWNER', orgId: 'org-1' }))
    const result = await requireAdmin()
    expect(result.user.role).toBe('OWNER')
  })

  it('should throw Forbidden for MEMBER role', async () => {
    mockAuth(mockSession({ role: 'MEMBER', orgId: 'org-1' }))
    await expect(requireAdmin()).rejects.toThrow('Forbidden')
  })

  it('should throw Unauthorized when no session', async () => {
    mockAuth(null)
    await expect(requireAdmin()).rejects.toThrow('Unauthorized')
  })
})

describe('requireOwner', () => {
  it('should succeed for OWNER role', async () => {
    mockAuth(mockSession({ role: 'OWNER', orgId: 'org-1' }))
    const result = await requireOwner()
    expect(result.user.role).toBe('OWNER')
    expect(result.user.orgId).toBe('org-1')
  })

  it('should throw Forbidden for ADMIN role', async () => {
    mockAuth(mockSession({ role: 'ADMIN', orgId: 'org-1' }))
    await expect(requireOwner()).rejects.toThrow('Forbidden')
  })

  it('should throw Forbidden for MEMBER role', async () => {
    mockAuth(mockSession({ role: 'MEMBER', orgId: 'org-1' }))
    await expect(requireOwner()).rejects.toThrow('Forbidden')
  })
})
