# Punch - Claude Code Instructions

## Project Overview

Punch is a simple time tracking application for small agencies (5-20 people). It replaces Harvest with a focused feature set: time entry, weekly approvals, and CSV export for external invoicing.

**Read these files before starting:**
- `PRD.md` - Full product requirements
- `TECHNICAL.md` - Architecture and tech decisions
- `DATA-MODEL.md` - Database schema (Prisma)
- `USER-STORIES.md` - Features with acceptance criteria

## Tech Stack (Use These)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js (Auth.js v5) |
| Deployment | Docker |

## Development Commands

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Seed demo data
npx prisma db seed

# Run dev server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## Project Structure

```
punch/
├── app/
│   ├── (auth)/           # Auth pages (login, etc.)
│   ├── (dashboard)/      # Protected pages
│   │   ├── timesheet/
│   │   ├── approvals/
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── team/
│   │   └── export/
│   ├── api/
│   │   └── export/       # CSV export endpoint
│   └── actions/          # Server actions
├── components/
│   ├── ui/               # shadcn components
│   └── [feature]/        # Feature-specific components
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # Auth config
│   └── utils.ts          # Helpers
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── .env.example          # Environment template (commit this)
├── .env                  # Local secrets (DO NOT commit)
├── .gitignore            # Node template + additions
├── docker-compose.yml
├── CLAUDE.md             # This file - development guide
├── PRD.md                # Product requirements
├── TECHNICAL.md          # Architecture decisions
├── DATA-MODEL.md         # Database schema
├── USER-STORIES.md       # Features & acceptance criteria
└── README.md             # Quick start for devs
```

## Critical Implementation Rules

### 1. Money as Integers
Store ALL money values as **cents (integers)**, never as decimals.

```typescript
// Correct
payRateCents: 7500  // $75.00

// Wrong
payRate: 75.00
```

Format for display only:
```typescript
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`
```

### 2. Week Identification
Use ISO week format: `YYYY-Www` (e.g., `2024-W03`). Weeks start on Monday.

```typescript
import { getISOWeek, getISOWeekYear } from 'date-fns'

function getWeekString(date: Date): string {
  const year = getISOWeekYear(date)
  const week = getISOWeek(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}
```

### 3. Timecard Locking
Before ANY time entry mutation, check if the timecard is locked:

```typescript
async function canEditTimeEntry(userId: string, week: string): Promise<boolean> {
  const timecard = await prisma.timecard.findUnique({
    where: { userId_week: { userId, week } }
  })
  // Open or no timecard yet = can edit
  return !timecard || timecard.status === 'OPEN'
}
```

### 4. Soft Deletes
Never hard-delete clients, projects, or users. Use `archivedAt` timestamp.

```typescript
// Archive (not delete)
await prisma.client.update({
  where: { id },
  data: { archivedAt: new Date() }
})

// Restore
await prisma.client.update({
  where: { id },
  data: { archivedAt: null }
})

// Query active only
const clients = await prisma.client.findMany({
  where: { archivedAt: null }
})
```

### 5. Rate Hierarchy
When calculating amounts, follow this precedence:

**Pay Rate:**
1. ProjectAssignment.payRateCents (if set)
2. User.defaultPayCents (fallback)

**Bill Rate:**
1. ProjectAssignment.billRateCents (if set)
2. Project.defaultBillCents (fallback)

```typescript
function getEffectivePayRate(assignment: ProjectAssignment | null, user: User): number {
  return assignment?.payRateCents ?? user.defaultPayCents
}

function getEffectiveBillRate(assignment: ProjectAssignment | null, project: Project): number {
  return assignment?.billRateCents ?? project.defaultBillCents
}
```

### 6. Authorization Checks

**Every server action must:**
1. Verify user is authenticated
2. Check role for admin-only operations
3. Verify user can access the resource (their own data or admin)

```typescript
'use server'

import { auth } from '@/lib/auth'

export async function approveTimecard(timecardId: string) {
  const session = await auth()

  // Must be logged in
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  // Must be admin
  if (session.user.role !== 'ADMIN') {
    throw new Error('Forbidden')
  }

  // ... proceed with approval
}
```

### 7. Unique Constraint: One Entry Per User/Project/Day

The schema has `@@unique([userId, projectId, date])` on TimeEntry. Handle upserts:

```typescript
await prisma.timeEntry.upsert({
  where: {
    userId_projectId_date: { userId, projectId, date }
  },
  update: { hours, notes, updatedById: currentUserId },
  create: { userId, projectId, date, hours, notes, week, createdById: currentUserId, updatedById: currentUserId }
})
```

## UI/UX Guidelines

### Timesheet Grid
- Rows: Projects (grouped by client)
- Columns: Mon, Tue, Wed, Thu, Fri, Sat, Sun
- Click cell to edit (inline)
- Tab moves to next cell
- Auto-save on blur
- Show totals: per row, per column, grand total

### Visual States
- **Open timecard:** Normal editing
- **Submitted:** Gray background, read-only, "Submitted" badge
- **Approved:** Green tint, read-only, "Approved" badge
- **Invoiced:** Blue tint, read-only, "Invoiced" badge

### Admin Indicators
Team members should NOT see:
- Pay rates (their own or others')
- Bill rates
- Other users' time entries
- Approvals page, Clients, Projects, Team, Export pages

## API Design

### Prefer Server Actions
Use Next.js server actions for mutations. Simpler, type-safe.

```typescript
// app/actions/time-entries.ts
'use server'

export async function saveTimeEntry(data: {
  projectId: string
  date: string
  hours: number
  notes?: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const week = getWeekString(new Date(data.date))

  // Check if locked
  if (!(await canEditTimeEntry(session.user.id, week))) {
    throw new Error('Timecard is locked')
  }

  // Upsert entry
  return prisma.timeEntry.upsert({
    where: {
      userId_projectId_date: {
        userId: session.user.id,
        projectId: data.projectId,
        date: new Date(data.date)
      }
    },
    update: {
      hours: data.hours,
      notes: data.notes,
      updatedById: session.user.id
    },
    create: {
      userId: session.user.id,
      projectId: data.projectId,
      date: new Date(data.date),
      hours: data.hours,
      notes: data.notes,
      week,
      createdById: session.user.id,
      updatedById: session.user.id
    }
  })
}
```

### API Routes for Downloads
CSV export needs a proper HTTP response:

```typescript
// app/api/export/route.ts
export async function GET(request: Request) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 })
  }

  // ... generate CSV

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="punch-export-${Date.now()}.csv"`
    }
  })
}
```

## Testing Strategy

### Manual Testing Checklist
Before considering a feature complete:

- [ ] Works for team member (limited permissions)
- [ ] Works for admin (full permissions)
- [ ] Cannot access other users' data (as member)
- [ ] Cannot edit locked timecards
- [ ] Error states handled gracefully
- [ ] Loading states shown during async ops

### Key Scenarios to Test
1. New user can log time to assigned project
2. User cannot log time to unassigned project
3. Submitted timecard cannot be edited
4. Admin can approve/reject timecards
5. Invoiced timecard is permanently locked
6. Export includes correct calculated amounts
7. Archived entities don't appear in dropdowns

## Common Pitfalls to Avoid

1. **Floating point math with money** - Always use integers (cents)
2. **Forgetting auth checks** - Every server action needs them
3. **Exposing rates to members** - Double-check what's returned to the client
4. **Hard deleting data** - Use soft delete (archivedAt)
5. **Allowing edits to locked timecards** - Check status before mutations
6. **Not handling timezone** - Use UTC for storage, local for display
7. **Missing loading states** - Show spinner during server actions

## Repository Setup

### .gitignore

The repo uses GitHub's **Node.js template**. After cloning, add these lines to `.gitignore`:

```gitignore
# === ADD THESE TO THE NODE TEMPLATE ===

# Next.js
.next/
out/

# Prisma
prisma/*.db
prisma/*.db-journal

# Environment (may already be in template, but ensure these exist)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
```

### .env.example

Create this file so developers know what env vars are needed:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/punch"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Optional: If using external email service for password reset
# RESEND_API_KEY="re_xxxxx"
```

**Never commit `.env` files. Only commit `.env.example` with placeholder values.**

### README.md

Keep it minimal. Link to the detailed docs:

```markdown
# Punch

Simple time tracking for agencies. Track hours, approve timecards, export for invoicing.

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Run dev server
npm run dev
\`\`\`

## Documentation

- [Product Requirements](PRD.md)
- [Technical Architecture](TECHNICAL.md)
- [Data Model](DATA-MODEL.md)
- [User Stories](USER-STORIES.md)
- [Development Guide](CLAUDE.md)
```

---

## Environment Variables

```env
# .env.example
DATABASE_URL="postgresql://user:password@localhost:5432/punch"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Getting Started

### First-Time Setup (After Cloning)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL and generate NEXTAUTH_SECRET:
   openssl rand -base64 32
   ```

3. **Start PostgreSQL** (if not running):
   ```bash
   # Using Docker:
   docker run --name punch-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=punch -p 5432:5432 -d postgres:16-alpine

   # Or use your local PostgreSQL
   ```

4. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

5. **Seed demo data (optional):**
   ```bash
   npx prisma db seed
   ```

6. **Start dev server:**
   ```bash
   npm run dev
   ```

### Creating the Project from Scratch

If starting fresh (not cloning existing repo):

1. **Create Next.js app:**
   ```bash
   npx create-next-app@latest punch --typescript --tailwind --eslint --app --src-dir=false
   cd punch
   ```

2. **Add dependencies:**
   ```bash
   npm install prisma @prisma/client next-auth@beta
   npm install date-fns bcrypt
   npm install -D @types/bcrypt
   npx shadcn@latest init
   ```

3. **Initialize Prisma:**
   ```bash
   npx prisma init
   ```

4. **Copy the schema** from `DATA-MODEL.md` into `prisma/schema.prisma`

5. **Create and run migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Update .gitignore** with additions listed above

7. **Create .env.example** for other developers

### Implementation Order

Build features in this sequence:

1. **Auth** - Login page + NextAuth config + middleware
2. **Users CRUD** - Need at least one admin to test
3. **Clients CRUD** - Simple entity, good warm-up
4. **Projects CRUD** - Includes client relationship
5. **Project Assignments** - Assign users to projects with rates
6. **Timesheet View** - Weekly grid, read-only first
7. **Time Entry** - Add/edit hours in the grid
8. **Timecard Submit** - Team members submit their week
9. **Approvals** - Admin approves/rejects timecards
10. **Mark Invoiced** - Lock timecards permanently
11. **Export** - CSV download with filters

## Questions? Check These Files

- **What are we building?** → `PRD.md`
- **How should it be built?** → `TECHNICAL.md`
- **What's the data structure?** → `DATA-MODEL.md`
- **What are the specific requirements?** → `USER-STORIES.md`
