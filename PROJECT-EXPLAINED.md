# Corporate AI Agent - Complete Project Explanation

## What Is This Project?

A full-stack **Corporate AI Agent Platform** built with the MERN stack. A manager gives plain-language instructions, and the AI handles tasks, calls, messages, meetings, HR, and reports — all automated.

**Three user roles:**
- **Admin** — full system control, user management, audit logs
- **Manager** — manages their team, assigns tasks, schedules calls/meetings
- **Employee** — completes tasks, chats with AI, applies for leave, clocks in/out

---

## Tech Stack (All Free Tier)

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS + Framer Motion |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (free M0) |
| AI | Google Gemini 1.5 Flash (free tier) |
| Real-time | Socket.io |
| Job Queue | BullMQ + Upstash Redis (optional, free tier) |
| Email | Nodemailer (Gmail) |
| Calendar | Google Calendar API (free) |
| Auth | JWT + 2FA (TOTP with QR codes) |
| Charts | Recharts |
| State | Zustand |
| i18n | English, Hindi, Gujarati |
| Mobile | React Native + Expo |
| Deploy | Vercel (frontend) + Railway (backend) |

---

## How It Works — The Big Picture

```
Manager/Admin (Browser)
       |
       v
  React Frontend (Vite, port 3000)
       |  Axios + Socket.io
       v
  Express Backend (port 5000)
       |
       +---> MongoDB (data storage)
       +---> Gemini API (AI responses)
       +---> Gmail (email notifications)
       +---> Google Calendar (meetings)
       +---> BullMQ + Redis (scheduled jobs)
       +---> Socket.io (real-time updates)
       |
       v
  Employee (Browser / Mobile App)
```

---

## Directory Structure

```
corporate-ai-agent/
|
+-- server/src/
|   +-- app.js                  # Entry point — starts Express + Socket.io + DB + Cron
|   +-- config/
|   |   +-- db.js               # MongoDB connection
|   |   +-- redis.js            # BullMQ queues (optional)
|   |   +-- socket.js           # Socket.io setup
|   +-- models/                 # 14 MongoDB schemas
|   |   +-- User.js             # Users with roles + 2FA
|   |   +-- Task.js             # Tasks with auto-chaining
|   |   +-- CallLog.js          # Scheduled call reminders
|   |   +-- Meeting.js          # Meetings + Google Calendar
|   |   +-- Message.js          # Scheduled messages (email/whatsapp/in-app)
|   |   +-- Report.js           # Daily EOD reports
|   |   +-- Conversation.js     # AI chat history
|   |   +-- LeaveRequest.js     # Leave applications
|   |   +-- Document.js         # Uploaded documents + extracted text
|   |   +-- Notification.js     # In-app notifications (auto-delete 30 days)
|   |   +-- Alert.js            # Escalation alerts (3 levels)
|   |   +-- Attendance.js       # Clock-in/out records
|   |   +-- ActivityLog.js      # Audit trail
|   |   +-- BlacklistedToken.js # Revoked JWTs
|   +-- routes/                 # 14 route files (API endpoints)
|   +-- controllers/            # 14 controller files (business logic)
|   +-- middleware/
|   |   +-- auth.js             # JWT verification
|   |   +-- roleGuard.js        # Role-based access control
|   |   +-- validate.js         # Input validation
|   |   +-- rateLimiter.js      # Rate limiting per endpoint
|   +-- services/
|   |   +-- gemini.service.js   # AI chat, streaming, summarization
|   |   +-- email.service.js    # Gmail email templates
|   |   +-- calendar.service.js # Google Calendar CRUD
|   |   +-- notification.service.js # Socket.io + DB notifications
|   |   +-- salary.service.js   # PDF salary slip generation
|   +-- workers/
|   |   +-- deadline.worker.js  # Task escalation (3 levels)
|   |   +-- message.worker.js   # Send scheduled messages
|   |   +-- call.worker.js      # Send call reminders
|   |   +-- report.worker.js    # Generate AI report summaries
|   +-- cron/
|       +-- dailyReport.cron.js # 6pm EOD reminder, 7pm report generation
|       +-- salaryCron.js       # 1st of month salary slips
|       +-- weeklySummary.cron.js # Friday 6pm weekly summary
|
+-- client/src/
|   +-- App.jsx                 # Route definitions + auth guards
|   +-- pages/                  # 18 pages (see below)
|   +-- components/
|   |   +-- Layout.jsx          # Sidebar + Header + Content
|   |   +-- Header.jsx          # Top bar with search + notifications
|   |   +-- Sidebar.jsx         # Navigation menu
|   |   +-- ProtectedRoute.jsx  # Auth + role guard wrapper
|   |   +-- ui/                 # GlassCard, GlowButton, Modal, Skeleton, etc.
|   |   +-- charts/             # AnimatedAreaChart, BarChart, PieChart, LineChart
|   |   +-- widgets/            # Dashboard widgets (Tasks, Meetings, Activity, AI)
|   |   +-- effects/            # ParticleBackground, AuroraBackground, 3D Scene
|   +-- store/
|   |   +-- authStore.js        # Zustand: user, login, logout, 2FA
|   |   +-- themeStore.js       # Zustand: dark mode, accent color
|   |   +-- notificationStore.js # Zustand: notification list + unread count
|   +-- services/
|   |   +-- api.js              # Axios instance + token refresh interceptor
|   |   +-- i18n.js             # Multi-language setup
|   +-- hooks/
|   |   +-- useSocket.js        # Socket.io connection + event listeners
|   +-- locales/
|       +-- en.json, hi.json, gu.json  # Translations
|
+-- mobile/                     # React Native + Expo (optional)
    +-- src/screens/            # Dashboard, Tasks, AI Chat, HR, Profile
    +-- src/navigation/         # Bottom tabs + Auth stack
    +-- src/services/           # API + AsyncStorage
```

---

## Feature-by-Feature Breakdown

### 1. Authentication & Security

**How login works:**
```
User enters email + password
        |
        v
  POST /api/auth/login
        |
        +-- Password correct?
        |       |
        |       No --> 401 error
        |       |
        |       Yes --> 2FA enabled?
        |               |
        |               Yes --> Return tempToken (5 min)
        |               |       User enters 6-digit code
        |               |       POST /api/auth/2fa/validate
        |               |       Code correct? --> Full JWT tokens
        |               |
        |               No --> Return JWT tokens directly
        v
  Client stores tokens in localStorage
  Every API call sends: Authorization: Bearer <token>
```

**Security layers:**
- Passwords hashed with bcryptjs (12 rounds)
- JWT access token (24h) + refresh token
- 2FA via TOTP (Google Authenticator / any authenticator app)
- Token blacklisting on logout (stored in MongoDB with TTL)
- Rate limiting: auth=20/15min, API=100/min, AI=12/min
- Role-based access on every endpoint

---

### 2. Task Management (The Core Feature)

**How tasks flow:**
```
Manager creates task --> assigned to Employee
        |
        v
  Task enters employee's queue (sorted by queueOrder)
  Status: PENDING
        |
        v
  Employee clicks "Start" --> status: IN PROGRESS
  (BullMQ schedules deadline check)
        |
        v
  Employee clicks "Complete" --> status: DONE
        |
        +-- AUTO-CHAIN: Next pending task auto-starts!
        +-- Socket.io notifies manager in real-time
        +-- Old deadline job cancelled, new one created
```

**Escalation system (if task overdue):**
- **30 min overdue (Level 1):** In-app notification to employee
- **2 hours overdue (Level 2):** Push notification + alert to manager
- **24 hours overdue (Level 3):** Email to admin/boss

**API Endpoints:**
| Method | Endpoint | Who | What |
|--------|----------|-----|------|
| POST | /api/tasks | Manager/Admin | Create + assign task |
| GET | /api/tasks/my | Employee | My task queue |
| GET | /api/tasks/team | Manager/Admin | All team tasks |
| GET | /api/tasks/dashboard | Manager/Admin | Stats (by status, priority, employee) |
| GET | /api/tasks/overdue | Manager/Admin | All overdue tasks |
| GET | /api/tasks/export | Manager/Admin | CSV export |
| PATCH | /api/tasks/:id/start | Employee | Start a task |
| PATCH | /api/tasks/:id/complete | Employee | Complete + auto-chain |
| POST | /api/tasks/:id/comment | Anyone | Add progress comment |

**Frontend:** Kanban board with 4 columns (Pending, In Progress, Done, Overdue) + stats bar.

---

### 3. AI Chat (Gemini Integration)

**How it works:**
```
User types message (or uses voice input)
        |
        v
  POST /api/ai/chat { message, conversationId, language }
        |
        v
  Server loads conversation history from MongoDB
  Builds system prompt:
    "You are a corporate AI assistant. Detect language, respond in same.
     Support English, Hindi, Gujarati."
        |
        v
  Gemini 1.5 Flash (streaming mode)
        |
        v
  Token-by-token via Socket.io:
    emit('ai_stream', { token: "Hello" })
    emit('ai_stream', { token: " there" })
    emit('ai_stream', { token: "!" })
    emit('ai_stream_end', { fullResponse })
        |
        v
  Saved to Conversation model in MongoDB
```

**AI capabilities:**
- Chat in English, Hindi, or Gujarati (auto-detects)
- Draft professional emails from rough notes
- Summarize documents (PDF, DOCX, TXT, CSV)
- Answer questions about uploaded documents
- Generate meeting summaries
- Create daily report summaries
- Voice input via Web Speech API (browser)

**API Endpoints:**
| Method | Endpoint | What |
|--------|----------|------|
| POST | /api/ai/chat | Send message (streams response) |
| GET | /api/ai/conversations | List all conversations |
| GET | /api/ai/conversations/:id | Full conversation |
| DELETE | /api/ai/conversations/:id | Delete conversation |
| POST | /api/ai/draft-email | Generate email from notes |

---

### 4. Call Reminders (Notification-Based)

**Note:** This is NOT actual phone calling. It's a scheduled notification system (free alternative to Twilio).

**How it works:**
```
Manager schedules "call" for employee at 3pm
        |
        v
  POST /api/calls/schedule
  --> CallLog created in MongoDB
  --> BullMQ job queued with delay = (3pm - now)
        |
        v
  At 3pm, BullMQ fires:
  --> In-app notification via Socket.io
  --> Email via Gmail: "[Call Reminder] from Manager Name"
  --> CallLog status: "notified"
  --> Socket.io emits 'call_status' to dashboard
```

---

### 5. Messages (Multi-Channel Scheduling)

**Channels:** Email, WhatsApp, In-app, Slack

**How it works:**
```
Manager schedules message for tomorrow 9am
        |
        v
  POST /api/messages/schedule
  --> Message stored in MongoDB
  --> BullMQ job with delay = (9am tomorrow - now)
        |
        v
  At 9am, message.worker fires:
  --> Channel = email? --> Nodemailer sends Gmail
  --> Channel = in-app? --> Socket.io notification
  --> Channel = whatsapp? --> whatsapp-web.js (if configured)
  --> Channel = slack? --> Slack API (if configured)
  --> deliveryLog updated per recipient
```

**Broadcast:** Admin can send message to ALL employees instantly.

---

### 6. Meetings + Google Calendar

**How it works:**
```
Manager creates meeting with attendees
        |
        v
  POST /api/meetings/create
  --> Meeting saved in MongoDB
  --> Google Calendar API creates event (if configured)
  --> Returns Google Meet link
  --> Email invites sent to all attendees
  --> Socket.io: 'meeting_created' notification
```

**Features:**
- Reschedule (updates calendar + notifies attendees)
- Cancel (deletes calendar event)
- Add post-meeting notes
- AI-generated meeting summary (Gemini)
- Works without Google Calendar (just no auto-sync)

---

### 7. HR Module

#### Leave Management
```
Employee applies for leave
        |
        v
  POST /api/hr/leave/apply
  --> LeaveRequest created (status: pending)
  --> Manager notified via Socket.io
        |
        v
  Manager approves/rejects
  --> PATCH /api/hr/leave/:id/approve (or /reject)
  --> Employee notified
  --> Leave balance updated
```

**Leave balances per year:** Casual: 12, Sick: 10, Annual: 15, Unpaid: unlimited

#### Attendance
```
Employee clicks "Clock In"  --> POST /api/hr/attendance/clock-in
Employee clicks "Clock Out" --> POST /api/hr/attendance/clock-out
                                 (auto-calculates hoursWorked)
```

#### Salary Slips
- Generated as PDF (pdfkit library)
- Auto-generated on 1st of every month (cron job)
- Emailed to employees
- Downloadable from HR page

---

### 8. Daily Reports (Automated EOD Flow)

```
6:00 PM (weekdays) - Cron job fires
        |
        v
  Socket.io broadcasts 'eod_reminder' to all employees
  "Please submit your end-of-day update"
        |
        v
  Employees submit via POST /api/reports/eod-submit
  Each submission added to today's Report document
        |
        v
7:00 PM (weekdays) - Cron job fires
        |
        v
  report.worker collects all submissions
  --> Sends to Gemini: "Summarize these employee updates"
  --> Generates HTML report with highlights + blockers
  --> Emails to all managers
  --> Saves AI summary + reportHtml to MongoDB
```

---

### 9. Documents (Upload + AI Q&A)

```
User uploads PDF/DOCX/TXT/CSV (max 10MB)
        |
        v
  POST /api/documents/upload (multer)
  --> File saved to disk
  --> Text extracted:
      PDF  --> pdf-parse
      DOCX --> mammoth
      TXT  --> direct read
      CSV  --> direct read
  --> extractedText stored in MongoDB (max 100KB)
        |
        v
  User asks: "What does section 3 say?"
  POST /api/documents/:id/ask { question }
  --> Gemini receives: extractedText + question
  --> Returns answer
```

---

### 10. Analytics Dashboard

**Endpoints** (all accept `?days=30` parameter):

| Endpoint | Data |
|----------|------|
| /api/analytics/tasks | Tasks by status, priority, daily completion trend |
| /api/analytics/calls | Call volume by status, daily trend |
| /api/analytics/team | Top performers, department stats, meetings, leaves |
| /api/analytics/employee/:id | Individual: tasks, meetings, leaves, attendance |

**Frontend:** Animated charts (Area, Bar, Pie, Line) using Recharts + Framer Motion.

---

### 11. Admin Panel

| Feature | What It Does |
|---------|-------------|
| System Stats | Total users, tasks, meetings, reports |
| User Management | Change roles, activate/deactivate users |
| Audit Log | Who did what, when (ActivityLog model) |
| Audit Export | Download audit log as CSV |
| Data Cleanup | Delete old data (tasks, reports, logs) older than N days |
| Health Check | DB status, Redis status, API uptime |

---

### 12. Real-Time Updates (Socket.io)

Every user auto-joins a Socket.io room = their userId. Events flow like this:

```
Backend action occurs (task completed, leave approved, etc.)
        |
        v
  notification.service.js:
    io.to(userId).emit('notification', { title, body, type })
    --> Stores in Notification model (MongoDB)
    --> Client's useSocket hook receives it
    --> Toast popup appears
    --> Notification bell count updates (Zustand store)
```

**Key events:**
- `notification` — any in-app notification
- `task_updated` — task status changed
- `ai_stream` / `ai_stream_end` — AI chat tokens
- `call_status` — call reminder sent
- `eod_reminder` — time to submit daily update
- `leave_approved` / `leave_rejected` — leave decision

---

### 13. Multi-Language Support

**Backend:** Gemini auto-detects language from user message and responds in the same language (English, Hindi, Gujarati).

**Frontend:** i18next library with translation files:
- `client/src/locales/en.json` — English
- `client/src/locales/hi.json` — Hindi
- `client/src/locales/gu.json` — Gujarati

User sets preferred language in their profile.

---

### 14. Visual Effects (UI Polish)

The frontend includes premium visual effects:
- **Particle Background** — animated floating particles (tsparticles)
- **Aurora Background** — northern lights effect (CSS + SVG)
- **3D Scene** — interactive 3D objects (Three.js + React Three Fiber)
- **Cursor Glow** — mouse-following glow effect (Framer Motion)
- **Glass Cards** — frosted glass UI components
- **Animated Charts** — charts with entrance animations (React Spring)
- **Count-up Animations** — stat numbers that count up on load

---

## Cron Jobs Summary

| Schedule | Job | What Happens |
|----------|-----|-------------|
| Weekdays 6:00 PM | EOD Reminder | Socket.io ping to all employees |
| Weekdays 7:00 PM | Report Generation | AI summarizes submissions, emails managers |
| 1st of month 9:00 AM | Salary Slips | Generate PDFs, email to employees |
| Fridays 6:00 PM | Weekly Summary | Aggregate week's data, send to managers |

---

## How to Run

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas free tier)
- Gemini API key (free from aistudio.google.com)

### Start the Server
```bash
cd corporate-ai-agent/server
npm install
# Edit .env: set MONGODB_URI and GEMINI_API_KEY
node src/app.js
```

### Start the Client
```bash
cd corporate-ai-agent/client
npm install
npm run dev
# Opens at http://localhost:3000
```

### Seed Test Data
```bash
cd corporate-ai-agent/server
npm run seed
```

### Test Logins
| Email | Password | Role |
|-------|----------|------|
| admin@company.com | admin123 | Admin |
| manager@company.com | manager123 | Manager |
| priya@company.com | employee123 | Employee |

---

## Optional Setups

| Feature | What to Do |
|---------|-----------|
| Redis (job queues) | Sign up at upstash.com, add REDIS_URL to .env |
| Google Calendar | Create OAuth app in Google Cloud Console, add credentials |
| Gmail emails | Enable 2-step verification on Gmail, generate App Password |
| WhatsApp | Configure whatsapp-web.js with phone QR auth |
| Slack | Create Slack app, add SLACK_BOT_TOKEN |
| Firebase Push | Create Firebase project, add service account credentials |
| Cloudflare R2 | Create R2 bucket, add access keys |

---

## API Route Summary (All 60+ Endpoints)

### Auth (`/api/auth`)
- POST `/register` — create account
- POST `/login` — login (returns JWT or 2FA prompt)
- POST `/refresh` — refresh access token
- POST `/logout` — logout + blacklist token
- POST `/change-password` — change password
- GET `/me` — current user profile
- POST `/2fa/setup` — generate QR code
- POST `/2fa/verify` — enable 2FA
- POST `/2fa/validate` — validate 2FA code
- POST `/2fa/disable` — disable 2FA

### Users (`/api/users`)
- GET `/` — list users (admin/manager)
- GET `/:id` — get user
- PATCH `/:id` — update user (admin)
- DELETE `/:id` — deactivate user (admin)

### Tasks (`/api/tasks`)
- POST `/` — create task
- GET `/my` — my task queue
- GET `/team` — team tasks
- GET `/dashboard` — task stats
- GET `/overdue` — overdue tasks
- GET `/export` — CSV export
- PATCH `/:id/start` — start task
- PATCH `/:id/complete` — complete + auto-chain
- POST `/:id/comment` — add comment

### Calls (`/api/calls`)
- POST `/schedule` — schedule call reminder
- GET `/` — list calls
- GET `/:id` — get call
- PATCH `/:id/cancel` — cancel call
- GET `/employee/:userId` — calls for employee

### Messages (`/api/messages`)
- POST `/schedule` — schedule message
- GET `/` — list messages
- DELETE `/:id` — cancel message
- POST `/broadcast` — send to all employees

### Meetings (`/api/meetings`)
- POST `/create` — create meeting
- GET `/` — list meetings
- PATCH `/:id/reschedule` — reschedule
- DELETE `/:id` — cancel
- POST `/:id/notes` — add notes
- GET `/:id/summary` — AI summary

### AI (`/api/ai`)
- POST `/chat` — send message (streaming)
- GET `/conversations` — list conversations
- GET `/conversations/:id` — full conversation
- DELETE `/conversations/:id` — delete conversation
- POST `/draft-email` — AI draft email

### Documents (`/api/documents`)
- POST `/upload` — upload file
- GET `/` — list documents
- POST `/:id/ask` — ask AI about document
- GET `/:id/summary` — AI summary

### Reports (`/api/reports`)
- POST `/eod-submit` — submit EOD update
- POST `/generate` — generate AI report
- GET `/` — list reports
- GET `/:id` — get report

### HR (`/api/hr`)
- POST `/leave/apply` — apply for leave
- GET `/leave/my` — my leaves
- GET `/leave/team` — team leaves
- PATCH `/leave/:id/approve` — approve
- PATCH `/leave/:id/reject` — reject
- GET `/leave/balance/:userId` — leave balance
- GET `/leave/export` — CSV export
- POST `/attendance/clock-in` — clock in
- POST `/attendance/clock-out` — clock out
- GET `/attendance/:userId` — attendance records
- GET `/attendance/export` — CSV export
- GET `/salary/:userId/:month` — salary slip PDF

### Analytics (`/api/analytics`)
- GET `/tasks` — task analytics
- GET `/calls` — call analytics
- GET `/team` — team productivity
- GET `/employee/:userId` — individual analytics

### Admin (`/api/admin`)
- GET `/stats` — system stats
- GET `/users` — all users
- PATCH `/users/:id/role` — change role
- PATCH `/users/:id/deactivate` — deactivate
- PATCH `/users/:id/activate` — activate
- GET `/audit-log` — audit trail
- GET `/audit-log/export` — CSV export
- DELETE `/data/cleanup` — delete old data
- GET `/system/health` — health check

### Other
- GET `/api/notifications` — get notifications
- PATCH `/api/notifications/:id/read` — mark read
- DELETE `/api/notifications/:id` — delete
- GET `/api/search` — global search
