# Corporate AI Agent — Roles, Workflows & Connected Pages

---

## How All 3 Roles Are Connected

```
                    ┌─────────────────────────────────────┐
                    │              ADMIN                   │
                    │       (System Controller)            │
                    │                                     │
                    │  - Create / deactivate users        │
                    │  - Change roles (employee->manager) │
                    │  - View audit log (who did what)    │
                    │  - System health check              │
                    │  - Cleanup old data                 │
                    │  - Has ALL manager features too     │
                    └────────┬────────────────┬───────────┘
                             │                │
                    manages  │                │  monitors
                    users    │                │  system
                             ▼                ▼
┌────────────────────────────────────┐  ┌────────────────────────┐
│            MANAGER                 │  │     ADMIN PANEL        │
│        (Team Leader)               │  │                        │
│                                    │  │  - User management     │
│  Assigns tasks to employees ──────►│  │  - Audit trail         │
│  Schedules calls for employees ───►│  │  - System health       │
│  Sends messages to employees ─────►│  │  - Data cleanup        │
│  Creates meetings with team ──────►│  └────────────────────────┘
│  Approves or rejects leaves ──────►│
│  Views team reports ──────────────►│
│  Views team analytics ────────────►│
│                                    │
└────────────────┬───────────────────┘
                 │
                 │  assigns work
                 │  approves/rejects
                 ▼
┌────────────────────────────────────┐
│            EMPLOYEE                │
│        (Does the Work)             │
│                                    │
│  Completes tasks ─────────────────►│──► Manager gets notified
│  Applies for leave ───────────────►│──► Manager approves/rejects
│  Clocks in / clocks out ──────────►│──► Attendance recorded
│  Submits EOD update ──────────────►│──► Manager gets notified
│  Chats with AI ───────────────────►│──► Personal assistant
│  Uploads documents ───────────────►│──► AI answers questions
│  Attends meetings ────────────────►│──► Sees assigned meetings
│                                    │
└────────────────────────────────────┘
```

### Simple Summary

- **Admin** controls the system — creates users, changes roles, views audit logs, monitors health. Also has all Manager abilities.
- **Manager** runs the team — assigns tasks, schedules calls/messages/meetings, approves leaves, views reports and analytics.
- **Employee** does the work — completes tasks, applies for leave, clocks attendance, chats with AI, submits daily updates.

### How They Talk to Each Other

```
Admin ──creates──► Manager ──assigns task──► Employee
                   Manager ◄──completes task── Employee
                   Manager ──approves leave──► Employee
                   Manager ◄──applies leave─── Employee
                   Manager ──schedules call──► Employee
                   Manager ──sends message──►  Employee
                   Manager ──creates meeting─► Employee
                   Manager ◄──submits EOD──── Employee
Admin  ◄──audit log tracks all actions──────── Everyone
```

---

## 10 Connected Workflows (All Verified Working)

### Workflow 1: Admin Manages Users
```
Admin opens Admin Panel
    │
    ├── Views all users with roles
    ├── Changes role: employee → manager (or vice versa)
    ├── Deactivates a user (soft delete, can reactivate)
    ├── Activates a deactivated user
    │
    └── Every action is logged in Audit Trail
         └── Admin can view/export audit log anytime
```
**Files involved:** Admin page → admin.controller.js → User model + ActivityLog model

---

### Workflow 2: Manager Assigns Task to Employee
```
Manager opens Tasks page
    │
    ├── Clicks "Create Task"
    ├── Fills: title, description, assign to (employee), priority, due date
    ├── Submits
    │
    └── Backend:
         ├── Task created in database (status: pending)
         ├── Employee gets IN-APP notification (real-time via Socket.io)
         ├── Employee gets EMAIL notification
         ├── If due date set → deadline job scheduled in BullMQ
         └── Task appears in Employee's task queue
```
**Files involved:** Tasks page → tasks.controller.js → Task model + notification.service.js + email.service.js

---

### Workflow 3: Employee Completes Task → Manager Notified
```
Employee opens Tasks page
    │
    ├── Sees their task queue (sorted by priority)
    ├── Clicks "Start" on a pending task → status: in progress
    ├── Works on it...
    ├── Clicks "Done" → status: done
    │
    └── Backend:
         ├── Task marked as completed with timestamp
         ├── Old deadline job cancelled
         ├── NEXT pending task auto-starts (auto-chain!)
         ├── Employee notified: "Next task: [title]"
         ├── MANAGER notified: "[Employee] completed [task]"
         └── If next task has due date → new deadline job scheduled
```
**Files involved:** Tasks page → tasks.controller.js → Task model + notification.service.js

---

### Workflow 4: Manager Schedules Call for Employee
```
Manager opens Calls page
    │
    ├── Selects employee recipient
    ├── Sets scheduled date/time
    ├── Writes message
    ├── Submits
    │
    └── Backend:
         ├── CallLog created (status: pending)
         ├── BullMQ job queued with delay = (scheduled time - now)
         │
         └── At scheduled time, BullMQ fires:
              ├── Employee gets IN-APP notification
              ├── Employee gets EMAIL: "[Call Reminder] from [Manager]"
              ├── CallLog status → "notified"
              └── Socket.io broadcasts call_status update to dashboard
```
**Files involved:** Calls page → calls.controller.js → CallLog model → call.worker.js → notification.service.js + email.service.js

---

### Workflow 5: Employee Applies for Leave → Manager Sees It
```
Employee opens HR page
    │
    ├── Clicks "Apply Leave"
    ├── Selects type (casual/sick/annual/unpaid)
    ├── Sets from-date, to-date, reason
    ├── Submits
    │
    └── Backend:
         ├── LeaveRequest created (status: pending)
         ├── Manager gets IN-APP notification
         ├── Manager gets EMAIL notification
         └── Leave appears in Manager's "Team Leaves" tab
```
**Files involved:** HR page → hr.controller.js → LeaveRequest model + notification.service.js + email.service.js

---

### Workflow 6: Manager Approves/Rejects Leave → Employee Notified
```
Manager opens HR page → "Team Leaves" tab
    │
    ├── Sees all pending leave requests from team
    ├── Clicks "Approve" or "Reject" (with reason if rejected)
    │
    └── Backend:
         ├── LeaveRequest status → approved/rejected
         ├── If approved:
         │    ├── Attendance records created as "leave" for those dates
         │    └── Leave balance deducted
         ├── Employee gets IN-APP notification: "Leave approved/rejected"
         └── If rejected: rejection reason included in notification
```
**Files involved:** HR page → hr.controller.js → LeaveRequest model + Attendance model + notification.service.js

---

### Workflow 7: Employee Submits EOD → Report Generated for Manager
```
6:00 PM (weekday) — Cron job fires
    │
    ├── Socket.io broadcasts "eod_reminder" to ALL employees
    └── Employees see notification: "Please submit your daily update"

Employee opens Reports/Dashboard
    │
    ├── Writes EOD update text
    ├── Submits
    │
    └── Backend:
         ├── Update saved in today's Report document
         ├── Manager gets IN-APP notification: "[Employee] submitted EOD"
         └── Shows task completion count for today

7:00 PM (weekday) — Cron job fires
    │
    └── Report Worker:
         ├── Collects ALL employee submissions for today
         ├── Sends to Gemini AI → generates summary
         ├── Builds HTML report with highlights + blockers
         ├── Emails report to ALL managers
         └── Saves AI summary in database
```
**Files involved:** dailyReport.cron.js → reports.controller.js → report.worker.js → gemini.service.js + email.service.js + notification.service.js

---

### Workflow 8: Manager Creates Meeting with Employees
```
Manager opens Meetings page
    │
    ├── Clicks "Create Meeting"
    ├── Fills: title, attendees (select employees), date/time, duration, agenda
    ├── Submits
    │
    └── Backend:
         ├── Meeting created in database
         ├── Google Calendar event created (if configured)
         │    └── Returns Google Meet link
         ├── EACH attendee gets IN-APP notification
         ├── EACH attendee gets EMAIL with meeting details + Meet link
         └── Meeting appears in everyone's Meetings page

Later:
    ├── Manager can reschedule → all attendees re-notified
    ├── Manager can cancel → all attendees notified + calendar event deleted
    ├── Anyone can add post-meeting notes
    └── Manager can generate AI summary of notes (via Gemini)
```
**Files involved:** Meetings page → meetings.controller.js → Meeting model + calendar.service.js + notification.service.js + email.service.js

---

### Workflow 9: Admin Views Audit Log
```
Admin opens Admin Panel
    │
    ├── "Audit Log" tab
    ├── Sees: who did what, when, from which module
    ├── Can filter by: user, module, action, date range
    ├── Can export as CSV
    │
    └── What gets logged:
         ├── Role changes (admin changed user X to manager)
         ├── User activation/deactivation
         ├── Data cleanup operations
         └── All sensitive admin operations
```
**Files involved:** Admin page → admin.controller.js → ActivityLog model

---

### Workflow 10: Manager Sends Message to Employee
```
Manager opens Messages page
    │
    ├── Option A: Schedule Message
    │    ├── Select recipients (one or many employees)
    │    ├── Choose channel: email / in-app / whatsapp / slack
    │    ├── Write message + set scheduled time
    │    ├── Submit
    │    │
    │    └── Backend:
    │         ├── Message stored in database
    │         ├── BullMQ job queued with delay = (scheduled time - now)
    │         └── At scheduled time:
    │              ├── email → Nodemailer sends Gmail
    │              ├── in-app → Socket.io notification
    │              ├── whatsapp → whatsapp-web.js (if configured)
    │              └── slack → Slack API (if configured)
    │
    └── Option B: Broadcast (Admin only)
         ├── Write message
         ├── Send immediately to ALL employees
         └── Delivered via email + in-app notification
```
**Files involved:** Messages page → messages.controller.js → Message model → message.worker.js → email.service.js + notification.service.js

---

## What Each Role Sees (Pages)

### Admin — Full Access (15 pages)

| Page | What Admin Sees |
|------|----------------|
| **Dashboard** | 6 stat cards: Total Users, Team Tasks, Completed, Overdue, Leave Requests, Meetings Today. 3-column layout with AI Insights widget. |
| **Tasks** | ALL tasks from ALL employees. Can create + assign tasks to anyone. Stats bar with total/pending/in-progress/done/overdue/critical counts. Export CSV. |
| **AI Chat** | Full AI assistant. Chat in English/Hindi/Gujarati. Voice input. Conversation history. Draft emails. |
| **Employees** | ALL users list. Search, filter by role/department. View details. |
| **Calls** | Schedule call reminders for any employee. View all call history. Cancel pending calls. |
| **Messages** | Schedule messages for anyone. Broadcast to ALL employees. View message history. Cancel pending. |
| **Meetings** | ALL meetings. Create meetings with any employees. Reschedule, cancel, add notes, AI summary. |
| **Reports** | ALL daily reports. Generate AI summary on demand. View employee submissions. |
| **Analytics** | Full analytics: task completion trends, call volume, team productivity, individual employee performance. |
| **HR** | ALL leave requests (approve/reject). ALL attendance records. Export CSVs. Salary slips. |
| **Documents** | Upload files. AI Q&A on document content. AI summarization. |
| **Admin Panel** | System stats, user management (change roles, activate/deactivate), audit log (view/export), data cleanup, system health check. |
| **Notifications** | All notifications received. Mark read, delete. |
| **Profile** | Edit name, phone, department, language. Change password. Setup/disable 2FA. |
| **Settings** | Theme, notification preferences. |

### Manager — Team Access (13 pages)

| Page | What Manager Sees |
|------|-------------------|
| **Dashboard** | 5 stat cards: Team Members, Team Tasks, Overdue, Leave Requests, Meetings Today. 2-column layout with AI Insights widget. |
| **Tasks** | TEAM tasks only (employees under this manager). Can create + assign tasks. Stats bar. Export CSV. Kanban board. |
| **AI Chat** | Full AI assistant. Same as admin. |
| **Employees** | TEAM members only (employees assigned to this manager). Search, view details. |
| **Calls** | Schedule call reminders for team. View own scheduled calls. Cancel pending. |
| **Messages** | Schedule messages for team members. View sent messages. Cancel pending. |
| **Meetings** | Own meetings + meetings where manager is attendee. Create, reschedule, cancel, notes, AI summary. |
| **Reports** | Team reports only. Generate AI summary. View team submissions. |
| **Analytics** | Team analytics: task trends, call volume, team productivity, individual employee stats. |
| **HR** | TEAM leave requests (approve/reject). Team attendance. Own leave apply + balance. Own clock in/out. |
| **Documents** | Upload files. AI Q&A. AI summarization. |
| **Notifications** | All notifications. Mark read, delete. |
| **Profile** | Edit profile, change password, 2FA. |

### Employee — Personal Access (9 pages)

| Page | What Employee Sees |
|------|-------------------|
| **Dashboard** | 3 stat cards: My Tasks, Pending, Meetings Today. 2-column layout. No AI Insights. |
| **Tasks** | OWN task queue only. Sorted by queue order. Can "Start" pending tasks, "Complete" in-progress tasks. Add comments. No create button. |
| **AI Chat** | Full AI assistant. Chat, voice input, conversation history. |
| **Meetings** | Only meetings where employee is attendee. Can add notes. No create/cancel/reschedule. |
| **HR** | OWN leaves only (apply, view history, check balance). OWN attendance (clock in/out). Download salary slip. No team view. No approve/reject. |
| **Documents** | Upload own files. AI Q&A on own documents. |
| **Notifications** | Own notifications. Mark read, delete. |
| **Profile** | Edit profile, change password, 2FA, language preference. |
| **Settings** | Theme, notification preferences. |

### Pages NOT Visible Per Role

| Page | Admin | Manager | Employee |
|------|-------|---------|----------|
| Dashboard | Yes | Yes | Yes |
| Tasks | Yes | Yes | Yes (own only) |
| AI Chat | Yes | Yes | Yes |
| **Employees** | Yes | Yes | **No** |
| **Calls** | Yes | Yes | **No** |
| **Messages** | Yes | Yes | **No** |
| **Reports** | Yes | Yes | **No** |
| **Analytics** | Yes | Yes | **No** |
| **Admin Panel** | Yes | **No** | **No** |
| Documents | Yes | Yes | Yes |
| Meetings | Yes | Yes | Yes |
| HR | Yes | Yes | Yes (own only) |
| Notifications | Yes | Yes | Yes |
| Profile | Yes | Yes | Yes |
| Settings | Yes | Yes | Yes |

---

## Notification Flow Summary

### Who Notifies Who

```
ACTION                          NOTIFICATION SENT TO
─────────────────────────────────────────────────────
Manager creates task         →  Employee (in-app + email)
Employee completes task      →  Manager (in-app)
Employee starts next task    →  Employee (in-app, auto-chain)
Task overdue 30 min          →  Employee (in-app, level 1)
Task overdue 2 hours         →  Manager (push, level 2)
Task overdue 24 hours        →  Admin (email + push, level 3)
Manager schedules call       →  Employee (in-app + email, at scheduled time)
Employee applies leave       →  Manager (in-app + email)
Manager approves leave       →  Employee (in-app)
Manager rejects leave        →  Employee (in-app, with reason)
Manager creates meeting      →  All attendees (in-app + email)
Manager reschedules meeting  →  All attendees (in-app + email)
Manager cancels meeting      →  All attendees (in-app)
Manager sends message        →  Recipients (via chosen channel, at scheduled time)
Employee submits EOD         →  Manager (in-app)
7PM daily cron               →  All managers (email, AI summary report)
6PM daily cron               →  All employees (socket.io, EOD reminder)
1st of month cron            →  All employees (email, salary slip)
Friday 6PM cron              →  All managers (email, weekly summary)
Admin changes role           →  Logged in audit trail
```

---

## Real-Time Updates (Socket.io Events)

| Event | When | Who Receives |
|-------|------|-------------|
| `notification` | Any notification created | Target user |
| `task_updated` | Task started/completed/created | All connected clients |
| `call_status` | Call reminder sent/failed | All connected clients |
| `message_delivered` | Scheduled message sent | All connected clients |
| `meeting_reminder` | Meeting starting in 1 hour | Meeting attendees |
| `ai_stream` | AI generating response | User who asked |
| `ai_stream_end` | AI response complete | User who asked |
| `eod_reminder` | 6PM weekdays | All employees |
| `leave_approved` | Manager approves leave | Employee |
| `leave_rejected` | Manager rejects leave | Employee |
| `alert_fired` | Task escalation triggered | Assigned user/manager/admin |

---

## Quick Actions Per Role

### Admin Quick Actions
- Manage Users → Admin Panel
- Audit Log → Admin Panel
- Create Task → Tasks page
- View Team → Employees page
- Schedule Call → Calls page
- Send Message → Messages page

### Manager Quick Actions
- Create Task → Tasks page
- View Team → Employees page
- Schedule Call → Calls page
- Send Message → Messages page
- Schedule Meeting → Meetings page
- AI Chat → AI Chat page

### Employee Quick Actions
- Schedule Meeting → Meetings page
- AI Chat → AI Chat page
- Apply Leave → HR page
- My Documents → Documents page
