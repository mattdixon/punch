export const TRIAL_DURATION_DAYS = 30

export function isTrialExpired(org: { trialEndsAt: Date | null }): boolean {
  if (!org.trialEndsAt) return false // no trial restriction
  return new Date() > org.trialEndsAt
}

export function getTrialDaysRemaining(org: { trialEndsAt: Date | null }): number | null {
  if (!org.trialEndsAt) return null
  const diff = org.trialEndsAt.getTime() - Date.now()
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function createTrialEndDate(): Date {
  return new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000)
}
