# SPIKE-2: Transactional Email

**Decision: USE RESEND (~3 days for critical path, $0/month)**

## Summary

Resend is the clear winner for our stack (Next.js + React + TypeScript). Free tier covers 15-60x our volume. Email templates are React components via the open-source `react-email` library. Minimal integration effort.

## Provider Comparison

| Provider | Free Tier | Monthly Cost | Next.js DX | Setup |
|----------|-----------|-------------|------------|-------|
| **Resend** | 3,000/mo (permanent) | **$0** | Excellent | Very Low |
| SendGrid | 100/day x 60 days only | $19.95/mo | Good | Low-Med |
| Postmark | 100/mo (permanent) | $15/mo | Good | Low |
| Amazon SES | 3,000/mo x 12 months | ~$0.02/mo | Poor | High |

## Why Resend

1. **$0/month** — 3,000/mo free tier, we use ~50-200
2. **React templates** — `react-email` lets us write email templates as JSX components in `components/emails/`
3. **One package, one env var** — `npm install resend`, set `RESEND_API_KEY`
4. **No lock-in** — `react-email` is MIT-licensed, renders to HTML, works with any provider

## Use Case Priority

| Priority | Use Case | Volume | Notes |
|----------|----------|--------|-------|
| P0 | User invitation | 1-5/mo | Admin creates user, they get a link to set password |
| P0 | Password reset | 5-10/mo | "Forgot password" on login page |
| P2 | Timecard notifications | 20-80/mo | Defer — small team uses Slack |

## Implementation Plan

### New Dependencies

```
npm install resend @react-email/components
```

### New Environment Variable

```env
RESEND_API_KEY="re_xxxxx"
```

### New Prisma Model

```prisma
model Token {
  id        String    @id @default(cuid())
  type      TokenType
  token     String    @unique  // hashed
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}

enum TokenType {
  INVITE
  PASSWORD_RESET
}
```

### Email Utility

```typescript
// lib/email.ts
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({ to, subject, react }) {
  return resend.emails.send({
    from: 'Punch <no-reply@yourdomain.com>',
    to,
    subject,
    react,
  })
}
```

### Email Templates

React components in `components/emails/`:
- `invite-email.tsx` — welcome message + set-password link
- `reset-email.tsx` — password reset link (expires in 24h)

### Pages

- `/set-password?token=xxx` — new user sets their initial password
- `/reset-password?token=xxx` — existing user resets password (can reuse same page)
- Add "Forgot password?" link to `/login`

### Effort Breakdown

| Task | Days |
|------|------|
| Token model + migration | 0.5 |
| Resend integration + email utility | 0.5 |
| User invitation flow (create user -> send email -> set password) | 1 |
| Password reset flow (forgot password -> email -> reset) | 1 |
| **Total** | **~3** |

## Domain Verification

Resend requires a verified sending domain for production. Add DNS records (SPF, DKIM, DMARC) to your domain. For development, Resend provides `onboarding@resend.dev` that works immediately.

## Interim Approach (Before Email Is Built)

Current approach works fine for a small team:
- Admin sets a temporary password when creating users
- Communicates it via Slack or in person
- Admin can reset passwords via the team management page
