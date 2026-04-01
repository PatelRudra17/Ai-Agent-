# Plan 5 — REBUILT (Based on Actual Project State)

> Generated: 2026-04-01
> Project: Corporate AI Agent — MERN Stack
> Status: ~85% core features built, needs hardening + polish + missing pages before launch

---

## ACTUAL Project State — Verified by Code Review

### FULLY WORKING (Verified in Code)
| # | Feature | Files | Status |
|---|---------|-------|--------|
| 1 | JWT Auth + Refresh + Logout + Blacklist | auth.controller.js, auth.js middleware | WORKING |
| 2 | TOTP 2FA (QR Code setup + verify) | auth.controller.js (otplib + qrcode) | WORKING |
| 3 | RBAC: admin / manager / employee | roleGuard.js middleware | WORKING |
| 4 | 14 MongoDB Models with indexes | models/*.js (14 files) | WORKING |
| 5 | 60+ REST API endpoints | routes/*.js (13 files), controllers/*.js (16 files) | WORKING |
| 6 | Gemini AI Chat with streaming | gemini.service.js + ai.controller.js + Socket.io | WORKING |
| 7 | Multi-language AI (EN/HI/GU) | System prompt in gemini.service.js | WORKING |
| 8 | AI Conversation History | Conversation model + ai.controller.js | WORKING |
| 9 | AI Email Drafting | ai.controller.js → gemini.draftEmail() | WORKING |
| 10 | Document Upload + AI Q&A + Summary | documents.controller.js (PDF/DOCX/CSV parsing) | WORKING |
| 11 | Task CRUD + Auto-Chaining | tasks.controller.js (complete → auto-start next) | WORKING |
| 12 | 3-Level Escalation System | deadline.worker.js (30min/2hr/24hr alerts) | WORKING |
| 13 | Email Notifications | email.service.js (Nodemailer + Gmail) | WORKING |
| 14 | Socket.io Real-time | socket.js (notifications, task updates, AI stream) | WORKING |
| 15 | 3 Cron Jobs | dailyReport, weeklySummary, salaryCron | WORKING |
| 16 | HR: Leave Apply/Approve/Reject/Balance | hr.controller.js | WORKING |
| 17 | HR: Attendance Clock-in/Out | hr.controller.js | WORKING |
| 18 | HR: Salary Slip PDF Generation | salary.service.js (pdfkit) | WORKING |
| 19 | CSV Export (tasks, leaves, attendance, audit) | export.service.js | WORKING |
| 20 | Admin Panel (stats, user mgmt, audit log) | admin.controller.js | WORKING |
| 21 | React Frontend — 17 Pages | pages/*.jsx (17 files) | WORKING |
| 22 | Dashboard with 6 Widgets | widgets/*.jsx (6 files) | WORKING |
| 23 | 6 Chart Components (Recharts) | charts/*.jsx (6 files) | WORKING |
| 24 | 8 UI Components (Glass/Glow/Modal etc) | ui/*.jsx (8 files) | WORKING |
| 25 | 4 Visual Effects (Particles/Aurora/3D) | effects/*.jsx (4 files) | WORKING |
| 26 | Zustand State (auth, notifications, theme) | store/*.js (3 files) | WORKING |
| 27 | i18n with 3 locale files | locales/en.json, hi.json, gu.json | WORKING |
| 28 | Role-based Sidebar + Routing | Sidebar.jsx, App.jsx, ProtectedRoute.jsx | WORKING |
| 29 | GitHub Actions CI/CD Pipeline | .github/workflows/deploy.yml | WORKING |
| 30 | Mobile App — 7 Screens | mobile/src/screens/*.js (7 files) | PARTIAL |

### INSTALLED BUT NOT ENABLED (Code exists but middleware not applied)
| # | Package | Issue | Impact |
|---|---------|-------|--------|
| 1 | helmet | Installed in package.json, NOT used in app.js | No security headers |
| 2 | express-mongo-sanitize | NOT installed at all | NoSQL injection vulnerable |
| 3 | compression | NOT installed at all | Uncompressed API responses |
| 4 | express-rate-limit | Middleware file exists but only generic limiter | Auth endpoints unprotected from brute force |

### BUILT BUT DISABLED (Infrastructure ready, needs config)
| # | Feature | Reason Disabled |
|---|---------|-----------------|
| 1 | BullMQ Job Queues (4 workers) | Redis not configured (REDIS_URL empty) — all queues are null |
| 2 | WhatsApp Integration | whatsapp-web.js needs phone setup + QR scan |
| 3 | Slack Integration | @slack/web-api needs SLACK_BOT_TOKEN |
| 4 | Firebase Push Notifications | firebase-admin needs project credentials |
| 5 | Google Calendar Sync | googleapis needs OAuth2 flow completion |

### COMPLETELY MISSING (Not built at all)
| # | Feature | Impact |
|---|---------|--------|
| 1 | GET /api/tasks/:id endpoint | Cannot view single task details via API |
| 2 | TaskDetail.jsx page | No task detail view in frontend |
| 3 | EmployeeDetail.jsx page | No employee profile detail view |
| 4 | ReportDetail.jsx page | No report detail view |
| 5 | 404 Not Found page | Invalid URLs show blank screen |
| 6 | ErrorBoundary component | JS errors crash entire app (white screen) |
| 7 | Automated tests (0 tests) | No test framework, no tests, no coverage |
| 8 | README.md | No project documentation |
| 9 | .env.example | No setup guide for new developers |
| 10 | API documentation | No endpoint reference |
| 11 | Docker setup | No containerization |
| 12 | Mobile components/ (empty) | No shared mobile UI components |
| 13 | Mobile store/ (empty) | No mobile state management |
| 14 | Empty state UI | Blank pages when no data exists |
| 15 | Breadcrumb navigation | No way to know current location in detail pages |
| 16 | Structured logging | All logging is console.log |
| 17 | Graceful shutdown | Server doesn't clean up on SIGTERM |

---

## PLAN 5 — PHASE BREAKDOWN

```
PHASE 5A ► Security Hardening .............. CRITICAL  (protect the app)
PHASE 5B ► Missing API + Detail Pages ...... CRITICAL  (core UX gaps)
PHASE 5C ► Error Handling + UX Safety ...... CRITICAL  (prevent crashes)
PHASE 5D ► Testing Framework ............... HIGH      (catch bugs)
PHASE 5E ► Documentation ................... HIGH      (enable others)
PHASE 5F ► Docker + Dev Setup .............. HIGH      (one-command setup)
PHASE 5G ► Backend Improvements ............ MEDIUM    (logging + pagination)
PHASE 5H ► UX Polish ....................... MEDIUM    (empty states, skeletons)
PHASE 5I ► Mobile App Completion ........... MEDIUM    (stores + components)
PHASE 5J ► WebRTC Browser Calling .......... MEDIUM    (real voice calls)
PHASE 5K ► Final Launch .................... LOW       (deploy + verify)
```

---

## PHASE 5A — Security Hardening (CRITICAL)

> helmet is installed but NOT called in app.js. No NoSQL injection prevention. No compression. Auth endpoints have only a generic rate limiter.

### 5A-1. Enable Helmet Security Headers

```
File: server/src/app.js

WHY: Helmet adds 11 security headers (X-Content-Type-Options, X-Frame-Options,
     Strict-Transport-Security, Content-Security-Policy, etc.)
     It's already installed — just not used.

ACTION:
  At the top (with other requires):
    const helmet = require('helmet');

  BEFORE all route definitions:
    app.use(helmet());
```

### 5A-2. Install + Apply express-mongo-sanitize

```
INSTALL:
  cd corporate-ai-agent/server && npm install express-mongo-sanitize

File: server/src/app.js

WHY: Without this, attackers can send { "email": { "$gt": "" } } as login input
     and bypass authentication. This sanitizes all req.body/req.query/req.params.

ACTION:
  const mongoSanitize = require('express-mongo-sanitize');
  app.use(mongoSanitize());  // BEFORE all routes
```

### 5A-3. Install + Apply compression

```
INSTALL:
  cd corporate-ai-agent/server && npm install compression

File: server/src/app.js

WHY: All API responses are currently sent uncompressed.
     compression gzips responses > 1KB → ~60% smaller → faster loads.

ACTION:
  const compression = require('compression');
  app.use(compression());  // BEFORE all routes
```

### 5A-4. Auth-Specific Rate Limiters

```
File: server/src/middleware/rateLimiter.js

WHY: Current rate limiter is generic (100 req/15min for all routes).
     Auth endpoints need stricter limits to prevent brute-force attacks.

ADD these specific limiters:
  authLimiter:       max 5 attempts per 15 minutes per IP (login)
  registerLimiter:   max 3 per hour per IP (register)
  twoFALimiter:      max 5 per 5 minutes per IP (2FA validate)
  passwordLimiter:   max 3 per 15 minutes per IP (change password)

File: server/src/routes/auth.routes.js
  Apply authLimiter to POST /login
  Apply registerLimiter to POST /register
  Apply twoFALimiter to POST /2fa/validate
  Apply passwordLimiter to POST /change-password
```

### 5A-5. CORS Tightening

```
File: server/src/app.js

WHY: Current CORS allows CLIENT_URL but doesn't restrict state-changing methods.

ACTION:
  Update CORS config to:
    - Only allow specific origin(s) from CLIENT_URL env var
    - Allow credentials: true
    - Restrict methods to GET, POST, PATCH, DELETE
    - Set proper headers list
```

### 5A Summary
| File | Action |
|------|--------|
| server/src/app.js | Add helmet(), mongoSanitize(), compression(), tighten CORS |
| server/src/middleware/rateLimiter.js | Add 4 auth-specific rate limiters |
| server/src/routes/auth.routes.js | Apply specific rate limiters per route |
| **Install** | `npm install express-mongo-sanitize compression` |

---

## PHASE 5B — Missing API Endpoint + Detail Pages (CRITICAL)

> You can list tasks/employees/reports but CANNOT click to see details. GET /api/tasks/:id doesn't exist. No detail pages in frontend.

### 5B-1. Add GET /api/tasks/:id Endpoint

```
File: server/src/controllers/tasks.controller.js

ADD getTaskById function:
  - Find task by _id
  - Populate assignedTo (name, email, role, department)
  - Populate assignedBy (name, email)
  - Populate comments.userId (name, email)
  - Return 404 if task not found
  - Role check:
    - admin → sees any task
    - manager → sees own team's tasks
    - employee → sees only own tasks

File: server/src/routes/tasks.routes.js

ADD route:
  router.get('/:id', authMiddleware, tasksController.getTaskById)
  
  IMPORTANT: Place this AFTER all named routes (/my, /team, /dashboard, /overdue)
  Otherwise Express matches /:id before /my (treating "my" as an ID)
```

### 5B-2. TaskDetail.jsx Page

```
File: client/src/pages/TaskDetail.jsx (NEW)

LAYOUT:
  ┌──────────────────────────────────────────────┐
  │ ← Back to Tasks                              │
  │                                              │
  │ [CRITICAL] Fix Payment Gateway Bug    [DONE] │
  │                                              │
  │ ┌─────────────────┐  ┌────────────────────┐  │
  │ │ Description      │  │ Details            │  │
  │ │ Full task text   │  │ Assigned to: John  │  │
  │ │                  │  │ Assigned by: Admin │  │
  │ │                  │  │ Due: 2026-04-05    │  │
  │ │                  │  │ Priority: Critical │  │
  │ │                  │  │ Queue: #3          │  │
  │ │                  │  │ Tags: payment, bug │  │
  │ └─────────────────┘  └────────────────────┘  │
  │                                              │
  │ ┌─────────────────────────────────────────┐  │
  │ │ Status Timeline                         │  │
  │ │ ● Created (Mar 28) → ● Started (Mar 29)│  │
  │ │ → ● Completed (Mar 30)                  │  │
  │ └─────────────────────────────────────────┘  │
  │                                              │
  │ ┌─────────────────────────────────────────┐  │
  │ │ Comments (3)                            │  │
  │ │ John: Working on this now (Mar 29)      │  │
  │ │ Admin: Priority bump (Mar 29)           │  │
  │ │ John: Fixed and deployed (Mar 30)       │  │
  │ │                                         │  │
  │ │ [Add Comment Input] [Post]              │  │
  │ └─────────────────────────────────────────┘  │
  │                                              │
  │ [Start Task]  [Complete Task]  [Cancel Task] │
  │ (show based on task status + user role)       │
  └──────────────────────────────────────────────┘

FEATURES:
  - Fetch task from GET /api/tasks/:id
  - Color-coded status badge (pending=yellow, inprogress=blue, done=green, overdue=red)
  - Color-coded priority badge (critical=red, high=orange, medium=yellow, low=gray)
  - Status timeline with timestamps
  - Comments list with author names + relative timestamps
  - Add comment form (POST /api/tasks/:id/comment)
  - Action buttons based on role + status:
    - Employee + pending → "Start Task" button
    - Employee + inprogress → "Complete Task" button
    - Manager/Admin → "Cancel Task" button
  - Back button to /tasks
  - Use existing GlassCard, GlowButton components for dark theme consistency
```

### 5B-3. EmployeeDetail.jsx Page

```
File: client/src/pages/EmployeeDetail.jsx (NEW)

LAYOUT:
  ┌──────────────────────────────────────────────┐
  │ ← Back to Employees                         │
  │                                              │
  │ ┌──────┐  John Doe          [MANAGER]        │
  │ │  JD  │  john@company.com                   │
  │ └──────┘  Engineering · +91-9876543210       │
  │           Joined: Jan 2025                   │
  │                                              │
  │ ┌────────┬───────────┬────────┬───────────┐  │
  │ │ Tasks  │ Attendance│ Leaves │Performance│  │
  │ ├────────┴───────────┴────────┴───────────┤  │
  │ │                                          │  │
  │ │ [Tab content changes based on selection]  │  │
  │ │                                          │  │
  │ │ Tasks Tab:                               │  │
  │ │   - List of assigned tasks with status    │  │
  │ │   - GET /api/tasks/team?assignee=userId   │  │
  │ │                                          │  │
  │ │ Attendance Tab:                          │  │
  │ │   - This month's clock-in/out records     │  │
  │ │   - Total hours worked                    │  │
  │ │   - GET /api/hr/attendance/:userId        │  │
  │ │                                          │  │
  │ │ Leaves Tab:                              │  │
  │ │   - Leave history with status badges      │  │
  │ │   - Leave balance card                    │  │
  │ │   - GET /api/hr/leave/balance/:userId     │  │
  │ │                                          │  │
  │ │ Performance Tab:                         │  │
  │ │   - Tasks completed per week (line chart) │  │
  │ │   - Completion rate percentage            │  │
  │ │   - GET /api/analytics/employee/:userId   │  │
  │ └──────────────────────────────────────────┘  │
  │                                              │
  │ Admin Actions: [Change Role ▼] [Deactivate]  │
  │ Manager Actions: [Assign Task] [Schedule Call]│
  └──────────────────────────────────────────────┘

PROTECTED: roles=['admin', 'manager'] only
APIs USED:
  - GET /api/users/:id (already exists)
  - GET /api/tasks/team (filter by assignee)
  - GET /api/hr/attendance/:userId
  - GET /api/hr/leave/balance/:userId
  - GET /api/analytics/employee/:userId
```

### 5B-4. ReportDetail.jsx Page

```
File: client/src/pages/ReportDetail.jsx (NEW)

LAYOUT:
  ┌──────────────────────────────────────────────┐
  │ ← Back to Reports                           │
  │                                              │
  │ Daily Report — March 30, 2026        [PDF ↓] │
  │                                              │
  │ ┌─────────────────────────────────────────┐  │
  │ │ AI Summary                              │  │
  │ │ "Team completed 12 tasks today.         │  │
  │ │  Payment gateway fix was the key         │  │
  │ │  blocker resolved. 2 tasks remain        │  │
  │ │  overdue in the analytics module."       │  │
  │ └─────────────────────────────────────────┘  │
  │                                              │
  │ ┌─────────────────────────────────────────┐  │
  │ │ Highlights                              │  │
  │ │ • Payment gateway bug fixed (John)       │  │
  │ │ • New onboarding flow deployed (Sarah)   │  │
  │ │ • API documentation 80% complete (Mike)  │  │
  │ └─────────────────────────────────────────┘  │
  │                                              │
  │ ┌─────────────────────────────────────────┐  │
  │ │ Blockers                                │  │
  │ │ ⚠ Redis connection timeout (DevOps)      │  │
  │ │ ⚠ Waiting on design assets (Frontend)    │  │
  │ └─────────────────────────────────────────┘  │
  │                                              │
  │ ┌─────────────────────────────────────────┐  │
  │ │ Employee Updates (5 submitted)          │  │
  │ │ John: "Fixed payment gateway..."         │  │
  │ │ Sarah: "Completed onboarding flow..."    │  │
  │ │ Mike: "API docs for tasks module..."     │  │
  │ └─────────────────────────────────────────┘  │
  │                                              │
  │ Stats: 12 tasks done · 5/8 employees replied │
  └──────────────────────────────────────────────┘

PROTECTED: roles=['admin', 'manager'] only
API: GET /api/reports/:id (already exists)
```

### 5B-5. Register Routes in App.jsx

```
File: client/src/App.jsx (MODIFY)

ADD these routes inside the protected routes section:
  <Route path="/tasks/:id" element={<TaskDetail />} />
  <Route path="/employees/:id" element={<ProtectedRoute roles={['admin','manager']}><EmployeeDetail /></ProtectedRoute>} />
  <Route path="/reports/:id" element={<ProtectedRoute roles={['admin','manager']}><ReportDetail /></ProtectedRoute>} />
```

### 5B-6. Make List Pages Clickable → Detail Pages

```
File: client/src/pages/Tasks.jsx (MODIFY)
  - Task cards become clickable
  - onClick → navigate(`/tasks/${task._id}`)

File: client/src/pages/Employees.jsx (MODIFY)
  - Employee rows/cards become clickable
  - onClick → navigate(`/employees/${user._id}`)

File: client/src/pages/Reports.jsx (MODIFY)
  - Report rows become clickable
  - onClick → navigate(`/reports/${report._id}`)
```

### 5B Summary
| File | Action |
|------|--------|
| server/src/controllers/tasks.controller.js | Add getTaskById function |
| server/src/routes/tasks.routes.js | Add GET /:id route (AFTER named routes) |
| client/src/pages/TaskDetail.jsx | **NEW** — full task detail page |
| client/src/pages/EmployeeDetail.jsx | **NEW** — employee profile with tabs |
| client/src/pages/ReportDetail.jsx | **NEW** — report detail with AI summary |
| client/src/App.jsx | Add 3 detail routes |
| client/src/pages/Tasks.jsx | Make cards clickable → /tasks/:id |
| client/src/pages/Employees.jsx | Make rows clickable → /employees/:id |
| client/src/pages/Reports.jsx | Make rows clickable → /reports/:id |

---

## PHASE 5C — Error Handling + UX Safety (CRITICAL)

> Invalid URL → blank screen. JavaScript error → white screen of death. No recovery.

### 5C-1. 404 Not Found Page

```
File: client/src/pages/NotFound.jsx (NEW)

DESIGN:
  - Dark background matching app theme
  - Large "404" with gradient text (use existing GradientText component)
  - "Page not found" subtitle
  - "Go to Dashboard" button (GlowButton)
  - Subtle float animation (Framer Motion)
  - Consistent with app's dark glass aesthetic

File: client/src/App.jsx (MODIFY)
  Change catch-all route:
    BEFORE: <Route path="*" element={<Navigate to="/dashboard" />} />
    AFTER:  <Route path="*" element={isAuthenticated ? <NotFound /> : <Navigate to="/login" />} />
```

### 5C-2. Error Boundary Component

```
File: client/src/components/ErrorBoundary.jsx (NEW)

WHY: React class component (must be class for componentDidCatch lifecycle)
     Catches any unhandled JavaScript error in child component tree
     Shows friendly UI instead of white screen

DESIGN:
  - "Something went wrong" message in GlassCard
  - Error details (in dev mode only)
  - "Reload Page" button
  - "Go to Dashboard" link
  - Dark theme matching app
  - Logs error to console

File: client/src/App.jsx (MODIFY)
  Wrap the Router content:
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>...</Routes>
      </Suspense>
    </ErrorBoundary>
```

### 5C-3. API Error Interceptor Improvements

```
File: client/src/services/api.js (MODIFY)

WHY: Current Axios interceptor handles 401 (logout) but shows no user feedback
     for other errors like 500, 403, network failures.

ACTION:
  - On 403: show toast "You don't have permission for this action"
  - On 500: show toast "Server error. Please try again."
  - On network error: show toast "Network error. Check your connection."
  - Keep existing 401 → logout behavior
  - Use existing react-hot-toast (already installed)
```

### 5C Summary
| File | Action |
|------|--------|
| client/src/pages/NotFound.jsx | **NEW** — 404 page |
| client/src/components/ErrorBoundary.jsx | **NEW** — catches JS crashes |
| client/src/App.jsx | Add ErrorBoundary wrapper + NotFound route |
| client/src/services/api.js | Add error toasts for 403/500/network |

---

## PHASE 5D — Automated Testing (HIGH)

> Zero tests exist. No test framework. No CI test step.

### 5D-1. Server Test Setup

```
INSTALL:
  cd server && npm install -D jest supertest mongodb-memory-server

CREATE: server/jest.config.js
  - testEnvironment: 'node'
  - testMatch: ['**/__tests__/**/*.test.js']
  - testTimeout: 30000 (mongodb-memory-server needs time)

CREATE: server/src/__tests__/setup.js
  - Start MongoMemoryServer (in-memory MongoDB for tests)
  - beforeAll: connect mongoose to memory DB
  - afterAll: disconnect + stop memory server
  - afterEach: clear all collections

UPDATE: server/package.json
  "test": "jest --coverage --forceExit --detectOpenHandles"
  "test:watch": "jest --watch"
```

### 5D-2. Server Tests to Write

```
server/src/__tests__/auth.test.js (8 tests):
  ✓ Register new user → 201 + tokens returned
  ✓ Register with duplicate email → 400
  ✓ Login with correct credentials → 200 + JWT + refresh token
  ✓ Login with wrong password → 401
  ✓ Access protected route without token → 401
  ✓ Access protected route with valid token → 200
  ✓ Refresh token → new access token
  ✓ Logout → token blacklisted → subsequent use returns 401

server/src/__tests__/tasks.test.js (6 tests):
  ✓ Create task as manager → 201
  ✓ Create task as employee → 403 (forbidden)
  ✓ Get my tasks → returns only user's tasks
  ✓ Complete task → next task auto-starts (status inprogress)
  ✓ Get team tasks as manager → returns team's tasks
  ✓ Get task by ID → returns populated task with assignee

server/src/__tests__/hr.test.js (5 tests):
  ✓ Apply leave → 201 + pending status
  ✓ Approve leave as manager → status approved
  ✓ Reject leave with reason → status rejected
  ✓ Clock in → attendance record created with timestamp
  ✓ Clock out → hours worked calculated

server/src/__tests__/admin.test.js (4 tests):
  ✓ Get system stats as admin → returns user/task/report counts
  ✓ Change user role as admin → role updated
  ✓ Deactivate user as admin → isActive: false
  ✓ Access admin route as employee → 403
```

### 5D-3. Client Test Setup

```
INSTALL:
  cd client && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

CREATE: client/vitest.config.js
  - environment: 'jsdom'
  - globals: true
  - setupFiles: './src/__tests__/setup.js'

CREATE: client/src/__tests__/setup.js
  - import '@testing-library/jest-dom'

UPDATE: client/package.json
  "test": "vitest run"
  "test:watch": "vitest"
```

### 5D-4. Client Tests to Write

```
client/src/__tests__/authStore.test.js (3 tests):
  ✓ login() sets user + tokens in localStorage + isAuthenticated = true
  ✓ logout() clears user + tokens + isAuthenticated = false
  ✓ register() creates user + sets tokens

client/src/__tests__/ProtectedRoute.test.jsx (2 tests):
  ✓ Renders children when user is authenticated
  ✓ Redirects to /login when user is not authenticated

client/src/__tests__/Sidebar.test.jsx (3 tests):
  ✓ Admin user → all menu sections visible (Main, Team, Workspace, Admin, Account)
  ✓ Manager user → Team Management visible, Admin section hidden
  ✓ Employee user → only Main, Workspace, Account visible
```

### 5D-5. Add Tests to CI Pipeline

```
File: .github/workflows/deploy.yml (MODIFY)

ADD before deploy steps:
  - name: Run server tests
    run: cd corporate-ai-agent/server && npm ci && npm test

  - name: Run client tests
    run: cd corporate-ai-agent/client && npm ci && npm test
```

### 5D Summary
| File | Action |
|------|--------|
| server/jest.config.js | **NEW** — Jest configuration |
| server/src/__tests__/setup.js | **NEW** — MongoDB memory server setup |
| server/src/__tests__/auth.test.js | **NEW** — 8 auth tests |
| server/src/__tests__/tasks.test.js | **NEW** — 6 task tests |
| server/src/__tests__/hr.test.js | **NEW** — 5 HR tests |
| server/src/__tests__/admin.test.js | **NEW** — 4 admin tests |
| client/vitest.config.js | **NEW** — Vitest configuration |
| client/src/__tests__/setup.js | **NEW** — testing-library setup |
| client/src/__tests__/authStore.test.js | **NEW** — 3 store tests |
| client/src/__tests__/ProtectedRoute.test.jsx | **NEW** — 2 route tests |
| client/src/__tests__/Sidebar.test.jsx | **NEW** — 3 component tests |
| .github/workflows/deploy.yml | Add test steps before deploy |
| **Install (server)** | `npm install -D jest supertest mongodb-memory-server` |
| **Install (client)** | `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom` |

---

## PHASE 5E — Documentation (HIGH)

> No README. No setup guide. No API docs. A new developer cannot understand or set up the project.

### 5E-1. Root README.md

```
File: corporate-ai-agent/README.md (NEW)

SECTIONS:
  # Corporate AI Agent
  > MERN stack corporate AI platform with Gemini AI, real-time comms, task auto-chaining, HR module

  ## Features
  - AI Chat (Gemini streaming, multi-language EN/HI/GU)
  - Task Management (auto-chaining, 3-level escalation)
  - HR Module (leave, attendance, salary slips)
  - Document Q&A (upload PDF/DOCX, ask AI questions)
  - Real-time (Socket.io notifications, live task updates)
  - Analytics Dashboard (charts, team/employee stats)
  - Admin Panel (user mgmt, audit log, system health)
  - Role-based Access (admin, manager, employee)
  - Mobile App (React Native + Expo)

  ## Tech Stack
  (Table: Frontend/Backend/Database/AI/Mobile/Deployment)

  ## Quick Start
  1. Clone repo
  2. cp server/.env.example server/.env (fill in values)
  3. cd server && npm install && npm run dev
  4. cd client && npm install && npm run dev
  5. Open http://localhost:5173

  ## Demo Accounts (from seed script)
  - Admin: admin@company.com / Admin@123
  - Manager: manager@company.com / Manager@123
  - Employee: emp1@company.com / Employee@123

  ## Project Structure (directory tree)
  ## Environment Variables (table with descriptions)
  ## API Endpoints (link to API.md)
  ## Deployment (Railway + Vercel instructions)
```

### 5E-2. Server .env.example

```
File: server/.env.example (NEW)

# ========== REQUIRED ==========

# MongoDB (local or Atlas)
MONGODB_URI=mongodb://localhost:27017/corporate-ai

# Auth (CHANGE THESE — use random 32+ char strings)
JWT_SECRET=change-this-to-a-random-32-char-string
JWT_REFRESH_SECRET=change-this-to-another-random-string
JWT_EXPIRES_IN=24h

# Server
PORT=4000
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# ========== AI (Free) ==========

# Get free key at: https://aistudio.google.com/apikey
GEMINI_API_KEY=your-gemini-api-key

# ========== OPTIONAL ==========

# Email (Gmail with App Password)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Redis (enables BullMQ job queues)
REDIS_URL=

# Google Calendar OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback

# Slack
SLACK_BOT_TOKEN=

# Firebase Push Notifications
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Cloudflare R2 File Storage
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=
R2_ENDPOINT=
```

### 5E-3. Client .env.example

```
File: client/.env.example (NEW)

# Backend API URL (defaults to localhost:4000 if not set)
VITE_API_URL=http://localhost:4000
```

### 5E-4. API Documentation

```
File: server/API.md (NEW)

STRUCTURE:
  # API Reference

  Base URL: http://localhost:4000/api
  Auth: Bearer token in Authorization header

  ## Auth (10 endpoints)
  | Method | Path | Auth | Role | Description |
  | POST | /auth/register | No | — | Register new user |
  | POST | /auth/login | No | — | Login, returns JWT |
  ...

  ## Tasks (9+ endpoints)
  ## Calls (5 endpoints)
  ## Messages (4 endpoints)
  ## Meetings (6 endpoints)
  ## Reports (4 endpoints)
  ## AI (5 endpoints)
  ## Documents (4 endpoints)
  ## HR (12 endpoints)
  ## Analytics (4 endpoints)
  ## Admin (9 endpoints)
  ## Notifications (3 endpoints)
  ## Search (1 endpoint)

  Each endpoint includes:
  - Method + Path
  - Required role
  - Request body example
  - Response example
  - Error responses
```

### 5E Summary
| File | Action |
|------|--------|
| corporate-ai-agent/README.md | **NEW** — full project documentation |
| server/.env.example | **NEW** — env template with comments |
| client/.env.example | **NEW** — client env template |
| server/API.md | **NEW** — complete API reference |

---

## PHASE 5F — Docker Setup (HIGH)

> Cannot spin up the project with one command. No containerization.

### 5F-1. Server Dockerfile

```
File: server/Dockerfile (NEW)

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 4000
CMD ["node", "src/app.js"]
```

### 5F-2. Client Dockerfile

```
File: client/Dockerfile (NEW)

# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 5F-3. Nginx Config (SPA routing)

```
File: client/nginx.conf (NEW)

server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # SPA: all routes → index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Proxy API requests to backend
  location /api {
    proxy_pass http://server:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
  }

  # Socket.io
  location /socket.io {
    proxy_pass http://server:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
  }

  # Cache static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }

  gzip on;
  gzip_types text/plain application/json application/javascript text/css;
}
```

### 5F-4. docker-compose.yml

```
File: corporate-ai-agent/docker-compose.yml (NEW)

services:
  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: [mongo-data:/data/db]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  server:
    build: ./server
    ports: ["4000:4000"]
    env_file: ./server/.env
    depends_on: [mongodb, redis]
    environment:
      MONGODB_URI: mongodb://mongodb:27017/corporate-ai
      REDIS_URL: redis://redis:6379

  client:
    build: ./client
    ports: ["3000:80"]
    depends_on: [server]

volumes:
  mongo-data:
```

### 5F-5. .dockerignore

```
File: corporate-ai-agent/.dockerignore (NEW)

node_modules
.env
*.log
.git
uploads
dist
.github
mobile
```

### After this phase:
```bash
cd corporate-ai-agent
docker-compose up --build
# Opens at http://localhost:3000 — full stack running
```

### 5F Summary
| File | Action |
|------|--------|
| server/Dockerfile | **NEW** |
| client/Dockerfile | **NEW** |
| client/nginx.conf | **NEW** |
| corporate-ai-agent/docker-compose.yml | **NEW** |
| corporate-ai-agent/.dockerignore | **NEW** |

---

## PHASE 5G — Backend Improvements (MEDIUM)

> All logging is console.log. No graceful shutdown. Some endpoints missing pagination.

### 5G-1. Winston Structured Logging

```
INSTALL:
  cd server && npm install winston

CREATE: server/src/config/logger.js

  - Log levels: error, warn, info, debug
  - Console transport: colorized output (development)
  - File transport: logs/error.log + logs/combined.log (production)
  - Include timestamp + module name in every log

  Usage: logger.info('Task created', { taskId, userId })
         logger.error('DB connection failed', { error: err.message })

THEN: Replace console.log → logger.info and console.error → logger.error
      in ALL controllers (16 files) and services (7 files)
```

### 5G-2. Graceful Shutdown

```
File: server/src/app.js (MODIFY — add at bottom)

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await mongoose.connection.close();
  server.close(() => process.exit(0));
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received — shutting down');
  await mongoose.connection.close();
  server.close(() => process.exit(0));
});

WHY: Without this, killing the server (Ctrl+C, Docker stop, Railway restart)
     leaves open MongoDB connections and incomplete requests.
```

### 5G-3. Improved Health Check

```
File: server/src/app.js (MODIFY existing /api/health)

Return detailed status:
{
  status: 'ok',
  uptime: process.uptime(),
  mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  redis: redisClient ? 'connected' : 'not configured',
  memory: process.memoryUsage(),
  timestamp: new Date().toISOString()
}
```

### 5G-4. Add Pagination to Unpaginated Endpoints

```
These endpoints currently return ALL records:
  - GET /api/tasks/my → add ?page=1&limit=20
  - GET /api/documents → add ?page=1&limit=20

Follow the same pattern already used in GET /api/tasks/team and GET /api/hr/leave/team
```

### 5G Summary
| File | Action |
|------|--------|
| server/src/config/logger.js | **NEW** — Winston config |
| server/src/app.js | Add graceful shutdown + improve health check |
| server/src/controllers/*.js (16 files) | Replace console.log → logger |
| server/src/services/*.js (7 files) | Replace console.log → logger |
| server/src/controllers/tasks.controller.js | Add pagination to /my |
| server/src/controllers/documents.controller.js | Add pagination |
| **Install** | `npm install winston` |

---

## PHASE 5H — UX Polish (MEDIUM)

> Pages show nothing when data is empty. No loading skeletons. No breadcrumbs on detail pages.

### 5H-1. Empty State Component

```
File: client/src/components/ui/EmptyState.jsx (NEW)

PROPS: icon, title, description, actionLabel, onAction

DESIGN:
  - Large muted icon (from lucide-react)
  - "No tasks yet" style title
  - "Create your first task to get started" description
  - Optional action button

APPLY TO:
  - Tasks.jsx → "No tasks found" + "Create Task" button
  - Meetings.jsx → "No meetings scheduled"
  - Documents.jsx → "No documents uploaded" + "Upload" button
  - Reports.jsx → "No reports generated"
  - Notifications.jsx → "All caught up!"
```

### 5H-2. Breadcrumb Component

```
File: client/src/components/ui/Breadcrumbs.jsx (NEW)

USAGE:
  <Breadcrumbs items={[
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Tasks', path: '/tasks' },
    { label: 'Fix Payment Bug' }  // current page, no link
  ]} />

DESIGN:
  Dashboard > Tasks > Fix Payment Bug
  - Clickable parent links
  - Current page in accent color
  - Uses react-router-dom Link

APPLY TO: TaskDetail, EmployeeDetail, ReportDetail pages
```

### 5H-3. Skeleton Loading on All Pages

```
WHY: Pages currently show blank white space while API calls load.
     Skeleton.jsx component already exists but isn't used on most pages.

APPLY TO:
  - Dashboard.jsx → skeleton for stat cards + widgets
  - Tasks.jsx → skeleton for kanban columns
  - HR.jsx → skeleton for leave cards + attendance
  - Meetings.jsx → skeleton for meeting list
  - Analytics.jsx → skeleton for chart areas
  - Documents.jsx → skeleton for document list

PATTERN: 
  if (loading) return <SkeletonLayout />
  if (data.length === 0) return <EmptyState />
  return <ActualContent />
```

### 5H-4. Drag-and-Drop Task Reordering (Optional Enhancement)

```
INSTALL:
  cd client && npm install @hello-pangea/dnd

File: client/src/pages/Tasks.jsx (MODIFY)

WHY: Currently tasks are in static columns. Drag-and-drop lets managers
     move tasks between status columns visually.

  - Wrap Kanban columns with DragDropContext
  - Each status column is a Droppable
  - Each task card is a Draggable
  - onDragEnd: PATCH /api/tasks/:id to update status
  - Only enabled for admin/manager (employees see read-only board)
```

### 5H Summary
| File | Action |
|------|--------|
| client/src/components/ui/EmptyState.jsx | **NEW** |
| client/src/components/ui/Breadcrumbs.jsx | **NEW** |
| client/src/pages/Tasks.jsx | Add empty state + skeletons + drag-drop |
| client/src/pages/Meetings.jsx | Add empty state + skeletons |
| client/src/pages/Documents.jsx | Add empty state + skeletons |
| client/src/pages/Reports.jsx | Add empty state + skeletons |
| client/src/pages/Notifications.jsx | Add empty state |
| client/src/pages/Dashboard.jsx | Add skeleton loaders |
| client/src/pages/HR.jsx | Add skeleton loaders |
| client/src/pages/Analytics.jsx | Add skeleton loaders |
| **Install** | `npm install @hello-pangea/dnd` |

---

## PHASE 5I — Mobile App Completion (MEDIUM)

> 7 screens built but components/ and store/ folders are completely empty. No shared UI. No state management.

### 5I-1. Mobile Zustand Stores

```
File: mobile/src/store/authStore.js (NEW)
  - Same logic as web authStore
  - Uses AsyncStorage instead of localStorage
  - login(), register(), logout(), fetchUser()
  - Persists tokens in AsyncStorage

File: mobile/src/store/notificationStore.js (NEW)
  - Notification list + unread count
  - markRead(), deleteNotification()
  - Socket.io listener for real-time updates
```

### 5I-2. Shared Mobile Components

```
File: mobile/src/components/Card.js (NEW)
  - Dark themed card (matching web GlassCard aesthetic)
  - Props: children, style

File: mobile/src/components/Button.js (NEW)
  - Gradient button with loading state
  - Props: title, onPress, loading, variant

File: mobile/src/components/Badge.js (NEW)
  - Status/priority badge with color coding
  - Props: label, type (status/priority), value

File: mobile/src/components/Header.js (NEW)
  - Screen header with back button + notification bell
  - Props: title, showBack, showNotifications

File: mobile/src/components/LoadingScreen.js (NEW)
  - Full screen loading spinner
  - Dark background matching app theme
```

### 5I-3. NotificationsScreen

```
File: mobile/src/screens/NotificationsScreen.js (NEW)
  - FlatList of notifications
  - Pull-to-refresh
  - Swipe to mark read
  - Uses notification store
  - Add to bottom tab navigator
```

### 5I-4. Refactor Existing Screens to Use Shared Components

```
Update all 7 existing screens to use:
  - Card component instead of inline View styles
  - Button component instead of inline TouchableOpacity
  - Badge component for status/priority
  - Header component for screen headers
  - LoadingScreen during API calls
  - authStore for auth state (replacing local state)
```

### 5I Summary
| File | Action |
|------|--------|
| mobile/src/store/authStore.js | **NEW** |
| mobile/src/store/notificationStore.js | **NEW** |
| mobile/src/components/Card.js | **NEW** |
| mobile/src/components/Button.js | **NEW** |
| mobile/src/components/Badge.js | **NEW** |
| mobile/src/components/Header.js | **NEW** |
| mobile/src/components/LoadingScreen.js | **NEW** |
| mobile/src/screens/NotificationsScreen.js | **NEW** |
| mobile/src/screens/*.js (7 existing) | Refactor to use shared components |
| mobile/src/navigation/MainNavigator.js | Add NotificationsScreen tab |

---

## PHASE 5J — WebRTC Browser Calling (MEDIUM)

> Current "calls" are just scheduled notifications/reminders. No actual voice/video calling between users.

### 5J-1. Server-Side Signaling via Socket.io

```
File: server/src/config/socket.js (MODIFY)

ADD WebRTC signaling events:
  - 'call:initiate'      → forward SDP offer to recipient
  - 'call:answer'        → forward SDP answer to caller
  - 'call:ice-candidate' → exchange ICE candidates between peers
  - 'call:reject'        → notify caller that recipient rejected
  - 'call:end'           → notify both parties call ended

ADD Online presence tracking:
  - Map<userId, socketId> for active users
  - Emit 'user:online' when user connects
  - Emit 'user:offline' when user disconnects
  - API endpoint GET /api/users/online → list of online user IDs
```

### 5J-2. WebRTC Hook

```
File: client/src/hooks/useWebRTC.js (NEW)

EXPORTS:
  - startCall(targetUserId) → initiates peer connection
  - answerCall(offer) → accepts incoming call
  - endCall() → closes connection
  - toggleMute() → mute/unmute microphone
  - toggleVideo() → on/off camera
  - callState: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'
  - remoteStream: MediaStream | null
  - localStream: MediaStream | null

IMPLEMENTATION:
  - RTCPeerConnection with free Google STUN servers:
    stun:stun.l.google.com:19302
    stun:stun1.l.google.com:19302
  - getUserMedia for microphone + camera
  - createOffer / createAnswer / addIceCandidate
  - ontrack handler for remote audio/video stream
  - Cleanup all streams on unmount
```

### 5J-3. Call UI Components

```
File: client/src/components/IncomingCall.jsx (NEW)
  - Full-screen overlay when receiving a call
  - Shows caller name + avatar
  - Accept (green) + Reject (red) buttons
  - Ringing animation
  - Auto-dismiss after 30 seconds

File: client/src/components/ActiveCall.jsx (NEW)
  - Connected call interface
  - Call duration timer
  - Caller/callee info
  - Mute / Video / End Call buttons
  - Minimizable to bottom-right corner (picture-in-picture style)
  - Remote video display (if video enabled)
```

### 5J-4. Update Calls Page

```
File: client/src/pages/Calls.jsx (MODIFY)

ADD:
  - Green dot = online, gray dot = offline (next to each employee)
  - "Call Now" button (if employee is online) → triggers WebRTC call
  - "Schedule Reminder" button (if offline) → existing notification system
  - Both systems coexist
```

### 5J Summary
| File | Action |
|------|--------|
| server/src/config/socket.js | Add signaling events + online presence |
| client/src/hooks/useWebRTC.js | **NEW** — WebRTC peer connection hook |
| client/src/components/IncomingCall.jsx | **NEW** — incoming call overlay |
| client/src/components/ActiveCall.jsx | **NEW** — active call UI |
| client/src/pages/Calls.jsx | Add online status + "Call Now" button |

---

## PHASE 5K — Final Launch Prep (LOW)

> Last steps before deploying to production.

### 5K-1. Clean Up Console Logs

```
Server: All console.log replaced by Winston logger (Phase 5G)
Client: Remove all debug console.log from React components
Keep console.error for actual error catching
```

### 5K-2. Favicon + Meta Tags

```
File: client/index.html (MODIFY)
  - Proper favicon set (16x16, 32x32, 180x180, 512x512)
  - Open Graph meta tags for social sharing:
    og:title, og:description, og:image, og:url
  - Dynamic page title per route (already using document.title or useEffect)
```

### 5K-3. Pre-Launch Security Checklist

```
[ ] .env in .gitignore (already done ✅)
[ ] No hardcoded secrets in code
[ ] Helmet enabled (Phase 5A)
[ ] express-mongo-sanitize enabled (Phase 5A)
[ ] Compression enabled (Phase 5A)
[ ] Auth-specific rate limiting (Phase 5A)
[ ] CORS restricted to production domain
[ ] File upload restricted to safe types (already done ✅)
[ ] JWT secrets are strong 32+ chars
[ ] MongoDB Atlas with authentication
[ ] HTTPS enforced in production (Railway/Vercel do this automatically)
[ ] Error boundary catches crashes (Phase 5C)
[ ] All tests passing (Phase 5D)
```

### 5K-4. Seed Production Data

```
Run seed script on production MongoDB:
  node server/src/seed.js

Creates:
  - Admin account: admin@company.com / Admin@123
  - Manager account: manager@company.com / Manager@123
  - 3 Employee accounts with test credentials
  - Sample tasks, meetings for demo
```

### 5K-5. Deploy

```
1. Push to GitHub (main branch)

2. Server → Railway (free $5 credit/month)
   - Connect GitHub repo
   - Set all env vars in Railway dashboard
   - Deploy command: node src/app.js
   - Auto-deploys on git push via GitHub Actions

3. Client → Vercel (free tier)
   - Connect GitHub repo → client/ directory
   - Set VITE_API_URL to Railway server URL
   - Auto-deploys on git push

4. Database → MongoDB Atlas M0 (free forever 512MB)
   - Create cluster
   - Whitelist Railway IP (or 0.0.0.0/0 for free tier)
   - Get connection string → set MONGODB_URI

5. Mobile → EAS Build (free, 30 builds/month)
   - eas build --platform android
   - Download APK → share for testing

6. Verify all 3 roles work in production
7. Share demo links
```

---

## BUILD ORDER (Recommended Sequence)

```
┌─────────────────────────────────────────────────────────────┐
│ WEEK 1 — CRITICAL FIXES                                    │
│                                                             │
│  5A Security Hardening    ████████████████  (half day)      │
│  5B Detail Pages + API    ████████████████  (2-3 days)      │
│  5C Error Handling        ████████████████  (half day)      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ WEEK 2 — QUALITY                                            │
│                                                             │
│  5D Testing Framework     ████████████████  (2-3 days)      │
│  5E Documentation         ████████████████  (1-2 days)      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ WEEK 3 — INFRASTRUCTURE                                     │
│                                                             │
│  5F Docker Setup          ████████████░░░░  (1 day)         │
│  5G Backend Improvements  ████████████░░░░  (1-2 days)      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ WEEK 4 — POLISH                                             │
│                                                             │
│  5H UX Polish             ████████░░░░░░░░  (2-3 days)      │
│  5I Mobile Completion     ████████░░░░░░░░  (2-3 days)      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ WEEK 5 — ADVANCED + LAUNCH                                  │
│                                                             │
│  5J WebRTC Calling        ██████░░░░░░░░░░  (2-3 days)      │
│  5K Final Launch          ████░░░░░░░░░░░░  (1 day)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Graph

```
5A (Security) ──────→ 5B (Detail Pages) ──→ 5H (UX Polish)
                            ↓
5C (Error Handling) ───────→ 5K (Launch)
                              ↑
5D (Testing) ────────────────┘
5E (Docs) ──→ 5F (Docker) ──┘
5G (Backend) ────────────────┘

INDEPENDENT (can run in parallel):
  5I (Mobile) — parallel with anything
  5J (WebRTC) — parallel with 5H, 5I
```

---

## PACKAGE INSTALLATIONS SUMMARY

### Server
```bash
cd corporate-ai-agent/server

# Phase 5A — Security
npm install express-mongo-sanitize compression

# Phase 5D — Testing
npm install -D jest supertest mongodb-memory-server

# Phase 5G — Logging
npm install winston
```

### Client
```bash
cd corporate-ai-agent/client

# Phase 5D — Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Phase 5H — Drag and Drop
npm install @hello-pangea/dnd
```

---

## FILE COUNT SUMMARY

| Phase | New Files | Modified Files | Total |
|-------|-----------|----------------|-------|
| 5A Security | 0 | 3 | 3 |
| 5B Detail Pages | 3 pages | 6 | 9 |
| 5C Error Handling | 2 | 2 | 4 |
| 5D Testing | 11 | 3 | 14 |
| 5E Documentation | 4 | 0 | 4 |
| 5F Docker | 5 | 0 | 5 |
| 5G Backend | 1 | ~24 | ~25 |
| 5H UX Polish | 2 | 8 | 10 |
| 5I Mobile | 8 | 8 | 16 |
| 5J WebRTC | 3 | 2 | 5 |
| 5K Launch | 0 | 2 | 2 |
| **TOTAL** | **~39 new** | **~58 modified** | **~97 changes** |

---

## TOTAL COST: $0/month (Free Tier Everything)

| Service | Free Tier Limit |
|---------|-----------------|
| MongoDB Atlas M0 | 512 MB storage, forever free |
| Railway (server) | 500 hrs/month (with $5 credit) |
| Vercel (client) | 100 GB bandwidth/month |
| Upstash Redis | 10K commands/day |
| Gemini AI (Google) | 60 requests/min, free tier |
| Google STUN servers | Unlimited (for WebRTC) |
| Expo EAS Build | 30 builds/month |
| GitHub Actions | 2000 minutes/month |
| Docker | Free (local development) |
| Gmail SMTP | 500 emails/day |

---

## SUCCESS CRITERIA — Plan 5 Complete When:

```
✅ 1.  All API responses secured (Helmet + sanitization + compression)
✅ 2.  Auth endpoints protected from brute force (specific rate limits)
✅ 3.  Click any task → full detail page with comments + actions
✅ 4.  Click any employee → profile with tasks/attendance/leaves/performance tabs
✅ 5.  Click any report → AI summary + highlights + blockers + submissions
✅ 6.  Invalid URL → styled 404 page (not blank screen)
✅ 7.  JavaScript crash → error boundary with recovery (not white screen)
✅ 8.  30+ automated tests passing (23 server + 8 client)
✅ 9.  Tests run in CI pipeline before deploy
✅ 10. docker-compose up → full stack running in one command
✅ 11. New developer reads README → sets up in 15 minutes
✅ 12. All 60+ endpoints documented in API.md
✅ 13. Structured Winston logging in all server files
✅ 14. Empty data → friendly "no data" UI (not blank page)
✅ 15. Loading state → skeleton animations (not blank flash)
✅ 16. Mobile app has shared components + Zustand stores
✅ 17. "Call Now" button → real WebRTC voice call in browser
✅ 18. Production deployed: Railway + Vercel + MongoDB Atlas
✅ 19. All 3 roles tested in production (admin/manager/employee)
✅ 20. Total cost: $0/month
```
