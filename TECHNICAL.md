# Punch - Technical Architecture

## Tech Stack

### Recommended Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 14+ (App Router) | React, SSR, API routes in one package |
| **Styling** | Tailwind CSS + shadcn/ui | Fast development, consistent UI |
| **Database** | PostgreSQL | Reliable, good for relational data |
| **ORM** | Prisma | Type-safe, great DX, easy migrations |
| **Auth** | NextAuth.js (Auth.js) | Simple, supports multiple providers |
| **Deployment** | Docker + any host | Portable, self-hostable |

### Alternative Stacks (if preferred)

**Simpler (less features):**
- SQLite instead of Postgres (single-file DB, easier deploy)
- No ORM, raw SQL with better-sqlite3

**More traditional:**
- Separate backend (Express/Fastify) + React SPA
- REST API instead of Next.js server actions

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Next.js App                       │
├─────────────────────────────────────────────────────┤
│  Pages/Routes          │  API Routes / Server Actions│
│  - /timesheet          │  - /api/time-entries       │
│  - /approvals          │  - /api/timecards          │
│  - /clients            │  - /api/clients            │
│  - /projects           │  - /api/projects           │
│  - /team               │  - /api/users              │
│  - /export             │  - /api/export             │
├─────────────────────────────────────────────────────┤
│                   Prisma ORM                         │
├─────────────────────────────────────────────────────┤
│                   PostgreSQL                         │
└─────────────────────────────────────────────────────┘
```

---

## Authentication

### Recommended: NextAuth.js

**Providers (pick one or more):**
1. **Email/Password** - Simple, no external dependencies
2. **Magic Link** - Better UX, requires email service (Resend/SendGrid)
3. **Google OAuth** - Easy if team uses Google Workspace

**Session Strategy:** JWT (stateless, simpler)

**Authorization:**
- Middleware checks session on protected routes
- Role stored in JWT (`admin` or `member`)
- API routes verify role before sensitive operations

---

## Key Technical Decisions

### 1. Money as Integers

Store all money values as **cents (integers)**, not decimals.

```typescript
// Good
payRateCents: 7500  // $75.00

// Bad
payRate: 75.00  // Floating point issues
```

Display formatting happens in the UI layer.

### 2. Week Identification

Use **ISO week** format: `YYYY-Www` (e.g., `2024-W03`)

```typescript
// Get ISO week for a date
import { getISOWeek, getISOWeekYear } from 'date-fns'

const week = `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`
```

Week starts on **Monday** (ISO standard).

### 3. Timecard as Implicit Entity

Don't create timecard records upfront. Derive state from time entries.

```typescript
// Timecard state for user + week
type TimecardState = 'open' | 'submitted' | 'approved' | 'invoiced'

// Store state in a separate table, created on first submission
model Timecard {
  id        String   @id @default(cuid())
  userId    String
  week      String   // "2024-W03"
  status    String   @default("open")
  // ...
}
```

### 4. Soft Deletes

Never hard-delete clients, projects, or users with associated time entries.

```typescript
model Client {
  // ...
  archivedAt DateTime?  // null = active, set = archived
}
```

### 5. Audit Trail (Minimal)

Track who/when for important changes:

```typescript
model TimeEntry {
  // ...
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String
  updatedById String
}
```

Full audit log is out of scope for v1.

---

## API Design

### Use Server Actions (Next.js 14+)

Prefer server actions over API routes for mutations. Simpler, type-safe.

```typescript
// app/actions/time-entries.ts
'use server'

export async function createTimeEntry(data: TimeEntryInput) {
  const session = await getServerSession()
  if (!session) throw new Error('Unauthorized')

  // Validate timecard is not locked
  const timecard = await getTimecard(session.user.id, data.week)
  if (timecard?.status !== 'open') {
    throw new Error('Timecard is locked')
  }

  return prisma.timeEntry.create({ data })
}
```

### API Routes for Export

CSV export needs to return a file, so use API route:

```typescript
// app/api/export/route.ts
export async function GET(request: Request) {
  const session = await getServerSession()
  if (session?.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 })
  }

  const data = await getExportData(/* filters from searchParams */)
  const csv = generateCSV(data)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="punch-export.csv"'
    }
  })
}
```

---

## Performance Considerations

### Indexes

```sql
-- Time entries: fast lookup by user+week
CREATE INDEX idx_time_entries_user_week ON time_entries(user_id, week);

-- Time entries: fast lookup by project
CREATE INDEX idx_time_entries_project ON time_entries(project_id);

-- Timecards: fast lookup by status (for approvals dashboard)
CREATE INDEX idx_timecards_status ON timecards(status) WHERE status = 'submitted';
```

### Pagination

Export should handle large datasets:
- Stream CSV rows instead of loading all into memory
- Or paginate with cursor-based pagination

For 20 users, this likely won't matter, but good to build correctly.

---

## Deployment Options

### Option 1: Docker (Recommended)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/punch
    depends_on:
      - db
  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=punch

volumes:
  pgdata:
```

### Option 2: Vercel + Supabase

- Deploy Next.js to Vercel (free tier works for 20 users)
- Use Supabase for Postgres (free tier: 500MB)
- Zero ops, but less control

### Option 3: Self-Hosted VPS

- DigitalOcean/Linode $5-10/month droplet
- Docker Compose for app + Postgres
- Caddy or nginx for HTTPS

---

## Security Checklist

- [ ] All routes require authentication (middleware)
- [ ] Admin-only routes check role
- [ ] Users can only access their own time entries
- [ ] SQL injection prevented (Prisma parameterizes queries)
- [ ] CSRF protection (Next.js server actions handle this)
- [ ] Rate limiting on auth endpoints
- [ ] Passwords hashed with bcrypt (if using email/password)
- [ ] HTTPS in production
- [ ] Environment variables for secrets (never commit)

---

## Development Setup

```bash
# Clone repo
git clone <repo-url>
cd punch

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Setup database
npx prisma migrate dev

# Seed demo data (optional)
npx prisma db seed

# Run dev server
npm run dev
```

---

## File Structure

```
punch/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── timesheet/
│   │   ├── approvals/
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── team/
│   │   ├── export/
│   │   └── layout.tsx
│   ├── api/
│   │   └── export/
│   ├── actions/
│   │   ├── time-entries.ts
│   │   ├── timecards.ts
│   │   ├── clients.ts
│   │   ├── projects.ts
│   │   └── users.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/           # shadcn components
│   ├── timesheet/
│   ├── approvals/
│   └── ...
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── csv.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── package.json
```
