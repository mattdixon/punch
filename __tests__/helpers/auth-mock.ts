import { vi } from 'vitest'

export interface MockUser {
  id: string
  email: string
  name: string
  role: string
  orgId?: string
}

export interface MockSession {
  user: MockUser
  expires: string
}

const defaultUser: MockUser = {
  id: 'user-1',
  email: 'test@test.com',
  name: 'Test User',
  role: 'ADMIN',
  orgId: 'org-1',
}

/**
 * Create a mock session with optional overrides.
 */
export function mockSession(overrides?: Partial<MockUser>): MockSession {
  return {
    user: { ...defaultUser, ...overrides },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

// Mutable reference so tests can change the session via mockAuth()
let _currentSession: MockSession | null = mockSession()

// Top-level vi.mock so Vitest can hoist it properly
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() => Promise.resolve(_currentSession)),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

/**
 * Set the session that auth() will return for subsequent calls.
 * Pass null to simulate an unauthenticated request.
 */
export function mockAuth(session: MockSession | null = mockSession()) {
  _currentSession = session
}
