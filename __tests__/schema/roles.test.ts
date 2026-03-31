import { describe, it, expect } from 'vitest'
import { Role } from '@prisma/client'

describe('Role enum', () => {
  it('should have OWNER role', () => {
    expect(Object.values(Role)).toContain('OWNER')
  })

  it('should have ADMIN role', () => {
    expect(Object.values(Role)).toContain('ADMIN')
  })

  it('should have MEMBER role', () => {
    expect(Object.values(Role)).toContain('MEMBER')
  })

  it('should have exactly 3 roles', () => {
    expect(Object.values(Role)).toHaveLength(3)
  })
})
