# Punch - Data Model

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │       │   Client     │       │   Project    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │       │ id           │       │ id           │
│ email        │       │ name         │       │ name         │
│ name         │       │ archivedAt   │       │ clientId     │──┐
│ role         │       │ createdAt    │       │ defaultBill  │  │
│ defaultPay   │       │ updatedAt    │       │ archivedAt   │  │
│ archivedAt   │       └──────────────┘       │ createdAt    │  │
│ createdAt    │              │               │ updatedAt    │  │
│ updatedAt    │              │               └──────────────┘  │
└──────────────┘              │ 1:many              │           │
       │                      ▼                     │           │
       │               ┌──────────────┐             │           │
       │               │              │◄────────────┘           │
       │               │              │         many:1          │
       │               └──────────────┘                         │
       │                                                        │
       │ many:many (through ProjectAssignment)                  │
       │                                                        │
       ▼                                                        │
┌──────────────────────┐                                        │
│  ProjectAssignment   │                                        │
├──────────────────────┤                                        │
│ id                   │                                        │
│ userId               │────────────────────────────────────────┤
│ projectId            │◄───────────────────────────────────────┘
│ payRateCents         │  (overrides user default)
│ billRateCents        │  (overrides project default)
│ createdAt            │
└──────────────────────┘
       │
       │ User can log time to assigned projects
       ▼
┌──────────────────────┐       ┌──────────────────────┐
│     TimeEntry        │       │      Timecard        │
├──────────────────────┤       ├──────────────────────┤
│ id                   │       │ id                   │
│ userId               │       │ userId               │
│ projectId            │       │ week (YYYY-Www)      │
│ date                 │       │ status               │
│ hours                │       │ submittedAt          │
│ notes                │       │ approvedAt           │
│ week (derived)       │       │ approvedById         │
│ createdAt            │       │ invoicedAt           │
│ updatedAt            │       │ invoicedById         │
│ createdById          │       │ createdAt            │
│ updatedById          │       │ updatedAt            │
└──────────────────────┘       └──────────────────────┘
         │                              │
         │         Timecard controls    │
         │         edit permissions     │
         └──────────────────────────────┘
           (via userId + week match)
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USERS
// ============================================

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String?   // null if using OAuth/magic link
  name            String
  role            Role      @default(MEMBER)
  defaultPayCents Int       @default(0)  // default pay rate in cents
  archivedAt      DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  assignments     ProjectAssignment[]
  timeEntries     TimeEntry[]         @relation("UserTimeEntries")
  timecards       Timecard[]

  // Audit relations
  createdEntries  TimeEntry[]         @relation("CreatedByUser")
  updatedEntries  TimeEntry[]         @relation("UpdatedByUser")
  approvedCards   Timecard[]          @relation("ApprovedByUser")
  invoicedCards   Timecard[]          @relation("InvoicedByUser")

  @@index([email])
  @@index([archivedAt])
}

enum Role {
  ADMIN
  MEMBER
}

// ============================================
// CLIENTS & PROJECTS
// ============================================

model Client {
  id          String    @id @default(cuid())
  name        String
  archivedAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  projects    Project[]

  @@index([archivedAt])
}

model Project {
  id               String    @id @default(cuid())
  name             String
  clientId         String
  defaultBillCents Int       @default(0)  // default bill rate in cents
  archivedAt       DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // Relations
  client           Client              @relation(fields: [clientId], references: [id])
  assignments      ProjectAssignment[]
  timeEntries      TimeEntry[]

  @@index([clientId])
  @@index([archivedAt])
}

// ============================================
// PROJECT ASSIGNMENTS (User <-> Project)
// ============================================

model ProjectAssignment {
  id            String   @id @default(cuid())
  userId        String
  projectId     String
  payRateCents  Int?     // null = use user default
  billRateCents Int?     // null = use project default
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  user          User     @relation(fields: [userId], references: [id])
  project       Project  @relation(fields: [projectId], references: [id])

  @@unique([userId, projectId])
  @@index([userId])
  @@index([projectId])
}

// ============================================
// TIME ENTRIES
// ============================================

model TimeEntry {
  id          String   @id @default(cuid())
  userId      String
  projectId   String
  date        DateTime @db.Date  // just the date, no time
  hours       Decimal  @db.Decimal(5, 2)  // e.g., 7.50
  notes       String?
  week        String   // "2024-W03" - denormalized for easy querying
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String
  updatedById String

  // Relations
  user        User     @relation("UserTimeEntries", fields: [userId], references: [id])
  project     Project  @relation(fields: [projectId], references: [id])
  createdBy   User     @relation("CreatedByUser", fields: [createdById], references: [id])
  updatedBy   User     @relation("UpdatedByUser", fields: [updatedById], references: [id])

  @@unique([userId, projectId, date])  // one entry per user/project/day
  @@index([userId, week])
  @@index([projectId])
  @@index([date])
}

// ============================================
// TIMECARDS (Weekly approval state)
// ============================================

model Timecard {
  id           String          @id @default(cuid())
  userId       String
  week         String          // "2024-W03"
  status       TimecardStatus  @default(OPEN)
  submittedAt  DateTime?
  approvedAt   DateTime?
  approvedById String?
  invoicedAt   DateTime?
  invoicedById String?
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  // Relations
  user         User            @relation(fields: [userId], references: [id])
  approvedBy   User?           @relation("ApprovedByUser", fields: [approvedById], references: [id])
  invoicedBy   User?           @relation("InvoicedByUser", fields: [invoicedById], references: [id])

  @@unique([userId, week])
  @@index([status])
  @@index([week])
}

enum TimecardStatus {
  OPEN       // Can edit
  SUBMITTED  // Awaiting approval, cannot edit
  APPROVED   // Approved, locked
  INVOICED   // Invoiced, permanently locked
}
```

---

## Computed Values

These are NOT stored in the database. Calculate at query time or in application code.

### Effective Pay Rate

```typescript
function getEffectivePayRate(assignment: ProjectAssignment, user: User): number {
  return assignment.payRateCents ?? user.defaultPayCents
}
```

### Effective Bill Rate

```typescript
function getEffectiveBillRate(assignment: ProjectAssignment, project: Project): number {
  return assignment.billRateCents ?? project.defaultBillCents
}
```

### Pay Amount for Time Entry

```typescript
function getPayAmount(entry: TimeEntry, assignment: ProjectAssignment, user: User): number {
  const rate = getEffectivePayRate(assignment, user)
  return Math.round(Number(entry.hours) * rate)  // cents
}
```

### Bill Amount for Time Entry

```typescript
function getBillAmount(entry: TimeEntry, assignment: ProjectAssignment, project: Project): number {
  const rate = getEffectiveBillRate(assignment, project)
  return Math.round(Number(entry.hours) * rate)  // cents
}
```

---

## Sample Queries

### Get timesheet for user/week

```typescript
const entries = await prisma.timeEntry.findMany({
  where: {
    userId: userId,
    week: '2024-W03'
  },
  include: {
    project: {
      include: {
        client: true
      }
    }
  },
  orderBy: [
    { project: { client: { name: 'asc' } } },
    { project: { name: 'asc' } },
    { date: 'asc' }
  ]
})
```

### Get pending approvals (Admin)

```typescript
const pending = await prisma.timecard.findMany({
  where: {
    status: 'SUBMITTED'
  },
  include: {
    user: true,
    _count: {
      select: { /* would need a relation to count entries */ }
    }
  },
  orderBy: {
    submittedAt: 'asc'
  }
})

// To get hours, need separate query
const hours = await prisma.timeEntry.groupBy({
  by: ['userId', 'week'],
  where: {
    week: { in: pending.map(p => p.week) },
    userId: { in: pending.map(p => p.userId) }
  },
  _sum: {
    hours: true
  }
})
```

### Export data with computed amounts

```typescript
const data = await prisma.timeEntry.findMany({
  where: {
    date: { gte: startDate, lte: endDate },
    // ... other filters
  },
  include: {
    user: true,
    project: {
      include: {
        client: true
      }
    }
  }
})

// Get assignments for rate lookup
const assignments = await prisma.projectAssignment.findMany({
  where: {
    userId: { in: [...new Set(data.map(e => e.userId))] },
    projectId: { in: [...new Set(data.map(e => e.projectId))] }
  }
})

// Build lookup map
const assignmentMap = new Map(
  assignments.map(a => [`${a.userId}-${a.projectId}`, a])
)

// Compute amounts
const exportData = data.map(entry => {
  const assignment = assignmentMap.get(`${entry.userId}-${entry.projectId}`)
  const payRate = assignment?.payRateCents ?? entry.user.defaultPayCents
  const billRate = assignment?.billRateCents ?? entry.project.defaultBillCents

  return {
    date: entry.date,
    client: entry.project.client.name,
    project: entry.project.name,
    user: entry.user.name,
    hours: Number(entry.hours),
    payRate: payRate / 100,
    billRate: billRate / 100,
    payAmount: (Number(entry.hours) * payRate) / 100,
    billAmount: (Number(entry.hours) * billRate) / 100,
    notes: entry.notes
  }
})
```

---

## Migration Notes

### Initial Setup

```bash
npx prisma migrate dev --name init
```

### Seeding Demo Data

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: await hash('password', 10),
      name: 'Admin User',
      role: 'ADMIN',
      defaultPayCents: 0
    }
  })

  // Create a team member
  const member = await prisma.user.create({
    data: {
      email: 'member@example.com',
      passwordHash: await hash('password', 10),
      name: 'Team Member',
      role: 'MEMBER',
      defaultPayCents: 5000  // $50/hr default
    }
  })

  // Create a client
  const client = await prisma.client.create({
    data: {
      name: 'Acme Corp'
    }
  })

  // Create a project
  const project = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      clientId: client.id,
      defaultBillCents: 15000  // $150/hr default
    }
  })

  // Assign member to project
  await prisma.projectAssignment.create({
    data: {
      userId: member.id,
      projectId: project.id,
      payRateCents: 7500,   // $75/hr for this project
      billRateCents: 17500  // $175/hr for this project
    }
  })

  console.log('Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```
