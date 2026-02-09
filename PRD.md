# Punch - Product Requirements Document

## Overview

**Product Name:** Punch (working name)
**Version:** 1.0
**Target Users:** Small agencies (5-20 people)
**Problem:** Harvest is $100+/month, clunky UI, poor QuickBooks integration
**Solution:** Simple, fast time tracking with clean export for external invoicing

## Goals

1. Replace Harvest for agency time tracking
2. Cost under $20/month (or free if self-hosted)
3. Clean, fast UI that doesn't get in the way
4. Reliable data export for invoicing in QuickBooks or other systems
5. Simple approval workflow to lock timecards

## Non-Goals (Explicitly Out of Scope for v1)

- Mobile apps (web only)
- In-app invoicing or payments
- Expense tracking
- Complex reporting or analytics
- SSO/SAML enterprise features
- Real-time collaboration features
- Integrations beyond CSV export (QuickBooks API is stretch goal)

---

## User Roles

### Admin
- Full access to all features
- Create/manage clients, projects, team members
- Set pay rates and bill rates
- Approve timecards
- Mark timecards as invoiced
- Export data
- View all time entries

### Team Member
- Log time to assigned projects
- View own time entries
- Submit week for approval
- Cannot see other team members' time
- Cannot see pay/bill rates (only their assignments)

---

## Core Features

### 1. Time Entry

**Weekly Timesheet View (Primary)**
- Grid: rows = projects, columns = days of the week
- Click cell to enter hours (decimal: 1.5, 2.25, etc.)
- Tab between cells for fast entry
- Auto-save on blur
- Show weekly total per project
- Show daily total across all projects
- Week picker to navigate between weeks

**Requirements:**
- Only show projects user is assigned to
- Cannot edit time for locked (approved or invoiced) weeks
- Visual indicator for locked weeks
- Notes field per entry (optional)

### 2. Clients & Projects

**Clients**
- Name (required)
- Active/inactive status
- Has many projects

**Projects**
- Name (required)
- Belongs to one client
- Active/inactive status
- Default bill rate (optional, can override per person)

**Requirements:**
- Inactive clients/projects hidden from time entry by default
- Cannot delete clients/projects with time entries (archive instead)
- Search/filter on client and project lists

### 3. Team Members

**User Fields:**
- Name
- Email (login)
- Role (Admin or Team Member)
- Default pay rate (can override per project)
- Active/inactive status

**Project Assignments**
- Assign users to projects
- Set pay rate per user per project (overrides user default)
- Set bill rate per user per project (overrides project default)

**Requirements:**
- Users only see projects they're assigned to
- Inactive users cannot log in
- Cannot delete users with time entries (archive instead)

### 4. Rates

**Two Rate Types:**
1. **Pay Rate** - What you pay the team member (internal cost)
2. **Bill Rate** - What you charge the client (revenue)

**Rate Hierarchy:**
- Bill rate: Project default → User/Project override
- Pay rate: User default → User/Project override

**Requirements:**
- Rates stored as cents (integer) to avoid floating point issues
- Team members cannot see rates (Admins only)
- $0 rates allowed (for internal/non-billable projects)

### 5. Timecard Workflow

**States:**
1. **Open** - Can edit time entries
2. **Submitted** - User submitted for approval, cannot edit
3. **Approved** - Admin approved, locked
4. **Invoiced** - Admin marked as invoiced, locked

**State Transitions:**
- Open → Submitted (by Team Member or Admin)
- Submitted → Open (Admin can reject/reopen)
- Submitted → Approved (by Admin)
- Approved → Invoiced (by Admin)
- Invoiced → (terminal, cannot change)

**Weekly Basis:**
- Timecard = one user + one week (Mon-Sun)
- All time entries for that user in that week share the timecard state

**Requirements:**
- Visual indicator of timecard state on timesheet view
- Admin dashboard showing pending approvals
- Bulk approve multiple timecards
- Cannot edit time entries once Approved or Invoiced

### 6. Export

**CSV Export**
- Filter by: date range, client, project, user, timecard status
- Columns: Date, Client, Project, User, Hours, Pay Rate, Bill Rate, Pay Amount, Bill Amount, Notes, Status
- Download as .csv file

**Export for Invoicing Workflow:**
1. Filter to Approved timecards for a client/date range
2. Export CSV
3. Import into QuickBooks/invoicing system
4. Return to Punch and mark those timecards as Invoiced

**Stretch Goal: QuickBooks API**
- Direct sync to QuickBooks time tracking
- Would skip CSV step
- Defer to v1.1 unless trivially easy

---

## UI/UX Requirements

### Design Principles
1. **Speed** - Time entry should be fast (keyboard-driven)
2. **Clarity** - Obvious what state things are in (locked, submitted, etc.)
3. **Simplicity** - No feature bloat, hide complexity

### Key Screens

1. **Timesheet** (default view for Team Members)
   - Weekly grid
   - Week navigation
   - Submit button
   - Status indicator

2. **Approvals** (Admin)
   - List of submitted timecards
   - Bulk select/approve
   - Quick view of hours per card

3. **Clients** (Admin)
   - List with search
   - Add/edit modal
   - Show project count

4. **Projects** (Admin)
   - List with search/filter by client
   - Add/edit with assignments
   - Show active user count

5. **Team** (Admin)
   - User list
   - Add/edit with default rate
   - Show active project count

6. **Reports/Export** (Admin)
   - Date range picker
   - Filters (client, project, user, status)
   - Preview table
   - Export button

### Responsive
- Must work on desktop (1024px+)
- Tablet nice-to-have
- Mobile not required

---

## Technical Constraints

- Web application (no mobile apps)
- Must support 20 concurrent users
- Data must be exportable (no vendor lock-in)
- Simple deployment (Docker or single binary preferred)
- PostgreSQL for data storage

---

## Success Metrics

1. Time to enter a full week of time: < 2 minutes
2. Time to approve all pending timecards: < 30 seconds
3. Time to export a month of data: < 10 seconds
4. System handles 20 users without performance issues
5. Matt's team actually uses it and cancels Harvest

---

## Open Questions

1. **Naming** - Punch? HourLog? Something else?
2. **Hosting** - Self-hosted only? Or offer hosted SaaS?
3. **Auth** - Email/password? Magic link? Google OAuth?
4. **Week start** - Monday or Sunday? (Configurable?)

---

## Appendix: Harvest Features We're Killing

| Harvest Feature | Why We're Cutting It |
|-----------------|---------------------|
| Invoicing | Use QuickBooks/external tool |
| Payments (Stripe/PayPal) | Use QuickBooks/external tool |
| Expense tracking | Not needed |
| Mobile apps | Web is enough |
| Timer/stopwatch | Manual entry is sufficient |
| Budget tracking | Export and analyze externally |
| Profitability reports | Export and analyze externally |
| 70+ integrations | CSV export covers most needs |
| SSO/SAML | Overkill for 20 users |
| Forecast/scheduling | Different tool |
