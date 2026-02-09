# Punch - User Stories

## Priority Levels

- **P0** - Must have for MVP, app is useless without it
- **P1** - Should have for MVP, but could launch without
- **P2** - Nice to have, can add after launch

---

## Authentication

### AUTH-1: User Login (P0)
**As a** user
**I want to** log in with my email and password
**So that** I can access my timesheet

**Acceptance Criteria:**
- [ ] Login page with email and password fields
- [ ] Error message for invalid credentials
- [ ] Redirect to timesheet after successful login
- [ ] Session persists across page refreshes
- [ ] Logout button in header

### AUTH-2: Password Reset (P1)
**As a** user
**I want to** reset my password if I forget it
**So that** I can regain access to my account

**Acceptance Criteria:**
- [ ] "Forgot password" link on login page
- [ ] Email sent with reset link
- [ ] Reset link expires after 24 hours
- [ ] Can set new password from reset page

---

## Time Entry

### TIME-1: View Weekly Timesheet (P0)
**As a** team member
**I want to** see my timesheet in a weekly grid
**So that** I can enter my time efficiently

**Acceptance Criteria:**
- [ ] Grid with projects as rows, days as columns (Mon-Sun)
- [ ] Shows only projects I'm assigned to
- [ ] Current week displayed by default
- [ ] Week navigation (previous/next)
- [ ] Jump to specific week via date picker
- [ ] Shows total hours per project (row sum)
- [ ] Shows total hours per day (column sum)
- [ ] Shows grand total for the week

### TIME-2: Enter Time (P0)
**As a** team member
**I want to** enter hours for a project on a specific day
**So that** my time is tracked

**Acceptance Criteria:**
- [ ] Click cell to edit
- [ ] Enter decimal hours (1.5, 2.25, etc.)
- [ ] Tab to move between cells
- [ ] Auto-save on blur (no save button needed)
- [ ] Visual feedback when saving (subtle)
- [ ] Can enter 0 to clear an entry
- [ ] Cannot enter negative numbers
- [ ] Maximum 24 hours per day validation

### TIME-3: Add Notes to Time Entry (P1)
**As a** team member
**I want to** add notes to a time entry
**So that** I can explain what I worked on

**Acceptance Criteria:**
- [ ] Icon or indicator to add/view notes
- [ ] Modal or popover to enter notes
- [ ] Notes are optional
- [ ] Visual indicator when entry has notes
- [ ] Notes visible in export

### TIME-4: View Locked Timesheet (P0)
**As a** team member
**I want to** see when my timesheet is locked
**So that** I know I can't make changes

**Acceptance Criteria:**
- [ ] Visual indicator for locked weeks (Approved or Invoiced)
- [ ] Cells are read-only for locked weeks
- [ ] Status badge shows "Approved" or "Invoiced"
- [ ] Can still navigate to view locked weeks

---

## Timecard Workflow

### CARD-1: Submit Timecard (P0)
**As a** team member
**I want to** submit my weekly timecard for approval
**So that** my manager can review and approve it

**Acceptance Criteria:**
- [ ] "Submit for Approval" button on timesheet
- [ ] Confirmation dialog before submitting
- [ ] Status changes to "Submitted"
- [ ] Cannot edit time entries after submission
- [ ] Success message after submission

### CARD-2: View Pending Approvals (P0)
**As an** admin
**I want to** see all timecards awaiting approval
**So that** I can review and approve them

**Acceptance Criteria:**
- [ ] Approvals page showing submitted timecards
- [ ] Shows: user name, week, total hours
- [ ] Sorted by submission date (oldest first)
- [ ] Can click to view details

### CARD-3: Approve Timecard (P0)
**As an** admin
**I want to** approve a submitted timecard
**So that** the hours are locked and ready for invoicing

**Acceptance Criteria:**
- [ ] "Approve" button on timecard detail
- [ ] Bulk approve: select multiple and approve all
- [ ] Status changes to "Approved"
- [ ] Timestamp and approver recorded
- [ ] User's timesheet shows "Approved" status

### CARD-4: Reject Timecard (P1)
**As an** admin
**I want to** reject a submitted timecard
**So that** the user can make corrections

**Acceptance Criteria:**
- [ ] "Reject" or "Return" button on timecard detail
- [ ] Optional: add rejection reason
- [ ] Status changes back to "Open"
- [ ] User's timesheet becomes editable again
- [ ] User notified (or just sees status change)

### CARD-5: Mark Timecard as Invoiced (P0)
**As an** admin
**I want to** mark timecards as invoiced
**So that** I know which hours have been billed

**Acceptance Criteria:**
- [ ] "Mark as Invoiced" button (on approved timecards only)
- [ ] Bulk mark: select multiple and mark all
- [ ] Status changes to "Invoiced"
- [ ] Timestamp and invoicer recorded
- [ ] Invoiced timecards cannot be changed

---

## Clients

### CLIENT-1: View Clients (P0)
**As an** admin
**I want to** see a list of all clients
**So that** I can manage them

**Acceptance Criteria:**
- [ ] Clients page with list view
- [ ] Shows: name, project count, active/archived status
- [ ] Search by name
- [ ] Filter: active only (default) or all

### CLIENT-2: Create Client (P0)
**As an** admin
**I want to** add a new client
**So that** I can create projects for them

**Acceptance Criteria:**
- [ ] "Add Client" button
- [ ] Form with name field (required)
- [ ] Save creates client
- [ ] New client appears in list

### CLIENT-3: Edit Client (P0)
**As an** admin
**I want to** edit a client's name
**So that** I can fix typos or update it

**Acceptance Criteria:**
- [ ] Edit button on client row
- [ ] Form pre-filled with current name
- [ ] Save updates client

### CLIENT-4: Archive Client (P0)
**As an** admin
**I want to** archive a client
**So that** they don't appear in active lists but history is preserved

**Acceptance Criteria:**
- [ ] "Archive" action on client
- [ ] Confirmation dialog
- [ ] Archived clients hidden from project dropdown
- [ ] Archived clients visible with "show archived" filter
- [ ] Can restore archived client

---

## Projects

### PROJ-1: View Projects (P0)
**As an** admin
**I want to** see a list of all projects
**So that** I can manage them

**Acceptance Criteria:**
- [ ] Projects page with list view
- [ ] Shows: name, client, default bill rate, assigned users count, status
- [ ] Search by name
- [ ] Filter by client
- [ ] Filter: active only (default) or all

### PROJ-2: Create Project (P0)
**As an** admin
**I want to** create a new project
**So that** team members can log time to it

**Acceptance Criteria:**
- [ ] "Add Project" button
- [ ] Form with: name (required), client (required), default bill rate
- [ ] Save creates project
- [ ] New project appears in list

### PROJ-3: Edit Project (P0)
**As an** admin
**I want to** edit a project's details
**So that** I can update name, client, or rates

**Acceptance Criteria:**
- [ ] Edit button on project row
- [ ] Form pre-filled with current values
- [ ] Save updates project
- [ ] Changing default rate doesn't affect existing time entries

### PROJ-4: Archive Project (P0)
**As an** admin
**I want to** archive a project
**So that** it doesn't appear on timesheets but history is preserved

**Acceptance Criteria:**
- [ ] "Archive" action on project
- [ ] Confirmation dialog
- [ ] Archived projects hidden from timesheet
- [ ] Archived projects visible with "show archived" filter
- [ ] Can restore archived project

### PROJ-5: Assign Users to Project (P0)
**As an** admin
**I want to** assign users to a project
**So that** they can log time to it

**Acceptance Criteria:**
- [ ] Assignments section on project edit page
- [ ] Add user from dropdown (shows unassigned users)
- [ ] Set pay rate override (optional)
- [ ] Set bill rate override (optional)
- [ ] Remove assignment (if no time logged)

---

## Team (Users)

### USER-1: View Team (P0)
**As an** admin
**I want to** see a list of all team members
**So that** I can manage them

**Acceptance Criteria:**
- [ ] Team page with list view
- [ ] Shows: name, email, role, default pay rate, status
- [ ] Search by name or email
- [ ] Filter: active only (default) or all

### USER-2: Create User (P0)
**As an** admin
**I want to** add a new team member
**So that** they can log time

**Acceptance Criteria:**
- [ ] "Add User" button
- [ ] Form with: name, email, role (Admin/Member), default pay rate
- [ ] Auto-generate temporary password or send invite email
- [ ] Save creates user
- [ ] New user appears in list

### USER-3: Edit User (P0)
**As an** admin
**I want to** edit a user's details
**So that** I can update their info or rate

**Acceptance Criteria:**
- [ ] Edit button on user row
- [ ] Form pre-filled with current values
- [ ] Can change role (Admin/Member)
- [ ] Can change default pay rate
- [ ] Changing default rate doesn't affect existing time entries

### USER-4: Archive User (P0)
**As an** admin
**I want to** archive a user
**So that** they can't log in but their history is preserved

**Acceptance Criteria:**
- [ ] "Archive" action on user
- [ ] Confirmation dialog
- [ ] Archived users cannot log in
- [ ] Archived users visible with "show archived" filter
- [ ] Can restore archived user

### USER-5: Reset User Password (P1)
**As an** admin
**I want to** reset a user's password
**So that** I can help them if they're locked out

**Acceptance Criteria:**
- [ ] "Reset Password" action on user
- [ ] Sends password reset email to user
- [ ] Or: sets temporary password and shows it

---

## Export

### EXPORT-1: Export Time Data to CSV (P0)
**As an** admin
**I want to** export time data to CSV
**So that** I can import it into QuickBooks for invoicing

**Acceptance Criteria:**
- [ ] Export page with filters
- [ ] Filter by: date range, client, project, user, status
- [ ] Preview showing filtered data
- [ ] Shows: date, client, project, user, hours, pay rate, bill rate, pay amount, bill amount, notes
- [ ] "Download CSV" button
- [ ] CSV file downloads immediately

### EXPORT-2: Filter by Timecard Status (P0)
**As an** admin
**I want to** filter export by timecard status
**So that** I can export only approved (unbilled) time

**Acceptance Criteria:**
- [ ] Status filter: All, Approved, Invoiced
- [ ] "Approved" filter shows time ready to be billed
- [ ] "Invoiced" filter shows time already billed

---

## Navigation & UI

### UI-1: Dashboard/Home (P1)
**As a** user
**I want to** see a summary when I log in
**So that** I know what needs attention

**Acceptance Criteria:**
- Team member view:
  - [ ] This week's total hours
  - [ ] Timecard status
  - [ ] Quick link to timesheet
- Admin view:
  - [ ] Pending approvals count
  - [ ] This week's total hours (all users)
  - [ ] Quick links to approvals, export

### UI-2: Navigation (P0)
**As a** user
**I want to** easily navigate between sections
**So that** I can find what I need

**Acceptance Criteria:**
- [ ] Sidebar or top navigation
- Team member sees: Timesheet
- Admin sees: Timesheet, Approvals, Clients, Projects, Team, Export
- [ ] Current page highlighted
- [ ] User menu with logout

### UI-3: Responsive Layout (P2)
**As a** user
**I want to** use the app on my laptop or large monitor
**So that** it works on different screen sizes

**Acceptance Criteria:**
- [ ] Minimum supported width: 1024px
- [ ] No horizontal scroll on supported widths
- [ ] Tablet (768px+) nice to have but not required

---

## Settings (P2 - Future)

### SET-1: Company Settings
**As an** admin
**I want to** configure company-wide settings
**So that** the app works for our workflow

**Acceptance Criteria:**
- [ ] Company name (shown in header/export)
- [ ] Week start day (Monday default, configurable)
- [ ] Default currency

### SET-2: My Profile
**As a** user
**I want to** update my profile
**So that** my info is correct

**Acceptance Criteria:**
- [ ] Change name
- [ ] Change password
- [ ] View my role and rate (read-only for members)

---

## Implementation Order (Suggested)

### Phase 1: Core Time Tracking
1. AUTH-1 (Login)
2. USER-1, USER-2 (View/Create users - need at least one)
3. CLIENT-1, CLIENT-2 (View/Create clients)
4. PROJ-1, PROJ-2, PROJ-5 (View/Create projects, Assign users)
5. TIME-1, TIME-2 (View/Enter time)
6. UI-2 (Navigation)

### Phase 2: Approval Workflow
7. CARD-1 (Submit timecard)
8. CARD-2, CARD-3 (View/Approve timecards)
9. CARD-5 (Mark as invoiced)
10. TIME-4 (View locked timesheet)

### Phase 3: Export & Polish
11. EXPORT-1, EXPORT-2 (CSV export)
12. CLIENT-3, CLIENT-4 (Edit/Archive clients)
13. PROJ-3, PROJ-4 (Edit/Archive projects)
14. USER-3, USER-4 (Edit/Archive users)
15. TIME-3 (Notes)
16. CARD-4 (Reject timecard)

### Phase 4: Nice to Have
17. AUTH-2 (Password reset)
18. USER-5 (Admin reset password)
19. UI-1 (Dashboard)
20. UI-3 (Responsive)
21. SET-1, SET-2 (Settings)
