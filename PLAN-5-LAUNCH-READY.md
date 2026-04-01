# Plan 5 — Launch-Ready (REBUILT)

## Current Project Status — What's Done

| Area | Status | Details |
|------|--------|---------|
| Auth + JWT + 2FA (TOTP + QR) | DONE | Register, login, refresh, logout, change-password, 2FA setup/verify/validate/disable |
| RBAC (Admin/Manager/Employee) | DONE | Role selector on login + register, role-specific sidebar, dashboard, quick actions |
| 17 Frontend Pages | DONE | Dashboard, Tasks, Calls, Messages, Meetings, Reports, AIChat, HR, Analytics, Documents, Employees, Admin, Profile, Settings, Notifications, Login, Register |
| 14 MongoDB Models | DONE | User, Task, CallLog, Meeting, Message, Report, Conversation, LeaveRequest, Document, Notification, Alert, Attendance, ActivityLog, BlacklistedToken |
| 60+ API Endpoints | DONE | Auth(10), Users(4), Tasks(9), Calls(5), Messages(4), Meetings(6), Reports(4), AI(5), Documents(4), HR(12), Analytics(4), Admin(9), Notifications(3), Search(1) |
| AI Chat (Gemini Streaming) | DONE | Token-by-token streaming, conversation history, multi-language (EN/HI/GU), voice input |
| Document Upload + AI Q&A | DONE | PDF/DOCX/TXT/CSV extraction, AI Q&A, AI summarization |
| Task Auto-Chaining | DONE | Complete task → next auto-starts → manager notified |
| 3-Level Escalation | DONE | 30min → employee, 2hr → manager, 24hr → admin |
| BullMQ Job Queue | DONE | Deadline, message, call, report workers (Redis optional) |
| Socket.io Real-time | DONE | Notifications, task updates, AI streaming, call status, EOD reminders |
| 3 Cron Jobs | DONE | Daily report (6pm+7pm), salary slips (1st of month), weekly summary (Friday 6pm) |
| 5 Services | DONE | Gemini, email, calendar, notification, salary |
| 4 Middleware | DONE | Auth (JWT), roleGuard, validate, rateLimiter |
| HR Module | DONE | Leave apply/approve/reject/balance, attendance clock-in/out, salary slip PDF |
| Analytics Dashboard | DONE | Task/call/team/employee analytics with charts |
| Admin Panel | DONE | Stats, user management, audit log, data cleanup, health check |
| 6 Chart Components | DONE | Area, bar, line, pie, sparkline, tooltip |
| 6 Dashboard Widgets | DONE | Tasks, meetings, activity, calendar, quick actions, AI insights |
| 8 UI Components | DONE | GlassCard, GlowButton, GradientText, Modal, Skeleton, AnimatedCounter, AnimatedInput, ExportButton |
| 4 Visual Effects | DONE | ParticleBackground, AuroraBackground, CursorGlow, Scene3D |
| i18n (3 Languages) | DONE | English, Hindi, Gujarati with locale files |
| PWA | DONE | Service worker, manifest.json, install prompt |
| CSV Export | DONE | Tasks, leaves, attendance, audit log |
| GitHub Actions CI/CD | DONE | Build + deploy pipeline for Railway + Vercel |
| Mobile App (React Native) | PARTIAL | 7 screens built, but components/ and store/ folders empty |
| Seed Script | DONE | Creates admin, manager, 3 employees with test credentials |

---

## What's Missing — Plan 5 Will Fix These

| Missing | Priority | Phase |
|---------|----------|-------|
| Helmet security headers (installed but NOT used in app.js) | CRITICAL | 5A |
| express-mongo-sanitize (NoSQL injection prevention) | CRITICAL | 5A |
| Compression middleware (gzip responses) | HIGH | 5A |
| Task Detail page (/tasks/:id) | CRITICAL | 5B |
| Employee Detail page (/employees/:id) | CRITICAL | 5B |
| Report Detail page (/reports/:id) | CRITICAL | 5B |
| 404 Not Found page | CRITICAL | 5B |
| Error Boundary component | CRITICAL | 5B |
| GET /api/tasks/:id route (doesn't exist) | CRITICAL | 5B |
| Automated tests (zero tests exist) | HIGH | 5C |
| Root README.md (no project documentation) | HIGH | 5D |
| .env.example files (no setup guide) | HIGH | 5D |
| API documentation (no Swagger/API.md) | HIGH | 5D |
| Docker setup (no Dockerfiles) | HIGH | 5E |
| Mobile components/ (empty folder) | MEDIUM | 5F |
| Mobile store/ (empty folder) | MEDIUM | 5F |
| Breadcrumb navigation | MEDIUM | 5G |
| Empty state illustrations | MEDIUM | 5G |
| Drag-and-drop task reordering | MEDIUM | 5G |
| Onboarding tour for first-time users | LOW | 5G |
| Winston structured logging | LOW | 5H |
| WebRTC browser calling | MEDIUM | 5I |

---

## Phase 5A — Security Hardening (CRITICAL)

> Helmet is installed but never called. No data sanitization. No compression.

### 5A-1. Enable Helmet in app.js

```
File: server/src/app.js

Add BEFORE all routes:
  const helmet = require('helmet');
  app.use(helmet());

This adds 11 security headers automatically:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection
  - Strict-Transport-Security
  - Content-Security-Policy
  - Referrer-Policy
  - And more
```

### 5A-2. Install and apply express-mongo-sanitize

```bash
cd server && npm install express-mongo-sanitize
```

```
File: server/src/app.js

Add BEFORE routes:
  const mongoSanitize = require('express-mongo-sanitize');
  app.use(mongoSanitize());

This prevents NoSQL injection attacks like:
  { "email": { "$gt": "" }, "password": { "$gt": "" } }
  → sanitized to: { "email": "", "password": "" }
```

### 5A-3. Install and apply compression

```bash
cd server && npm install compression
```

```
File: server/src/app.js

Add BEFORE routes:
  const compression = require('compression');
  app.use(compression());

This gzips all API responses > 1KB
  → Reduces response size by ~60%
  → Faster page loads for everyone
```

### 5A-4. Tighten rate limiting on auth endpoints

```
File: server/src/middleware/rateLimiter.js

Add specific limiters:
  - Login: max 5 attempts per 15 minutes per IP
  - Register: max 3 per hour per IP
  - 2FA validate: max 5 per 5 minutes
  - Password change: max 3 per 15 minutes

Apply in auth.routes.js before each handler
```

### 5A-5. Add Origin validation middleware

```
File: server/src/app.js

Add middleware that checks req.headers.origin against allowed domains:
  - Development: http://localhost:3000
  - Production: your-app.vercel.app
  - Reject requests from unknown origins on state-changing methods (POST, PATCH, DELETE)
```

### Files to modify:
| File | Action |
|------|--------|
| server/src/app.js | Add helmet, mongoSanitize, compression, origin check |
| server/src/middleware/rateLimiter.js | Add auth-specific rate limiters |
| server/src/routes/auth.routes.js | Apply auth rate limiters |
| server/package.json | Add express-mongo-sanitize, compression |

---

## Phase 5B — Detail Pages + Error Handling (CRITICAL)

> No way to click on a task, employee, or report to see full details. No 404 page. No error boundary.

### 5B-1. Add GET /api/tasks/:id endpoint

```
File: server/src/controllers/tasks.controller.js

Add getTaskById function:
  - Find task by ID
  - Populate assignedTo (name, email, role, department)
  - Populate assignedBy (name, email)
  - Populate comments.userId (name, email)
  - Return 404 if not found
  - Role check: admin sees all, manager sees team, employee sees own

File: server/src/routes/tasks.routes.js

Add route: router.get('/:id', authMiddleware, tasksController.getTaskById)
  - Place AFTER all other specific routes (/my, /team, /dashboard, etc.)
  - Otherwise /:id will catch /my as id="my"
```

### 5B-2. Task Detail Page

```
File: client/src/pages/TaskDetail.jsx

Sections:
  - Header: title, status badge (color-coded), priority badge, assigned to, due date
  - Status Timeline: created → started → completed (with timestamps, visual progress bar)
  - Description: full task description
  - Comments: list with author name + timestamp, add comment form at bottom
  - Action Buttons:
    - Employee: "Start Task" (if pending), "Complete Task" (if in progress)
    - Manager: "Edit Task", "Cancel Task"
  - Sidebar: assigned by, created date, tags, queue order
  - Back button → /tasks

Route in App.jsx: /tasks/:id → <TaskDetail />
Link from Tasks.jsx: click on task card → navigate to /tasks/:id
```

### 5B-3. Employee Detail Page

```
File: client/src/pages/EmployeeDetail.jsx

Backend: GET /api/users/:id already exists

Sections:
  - Profile Card: avatar (initial), name, email, role badge, department, phone, joined date
  - Tabs (4 tabs):
    - Tasks Tab: list of tasks assigned to this employee with status badges
      → API: GET /api/tasks/team?assignee=userId
    - Attendance Tab: this month's records, hours worked chart
      → API: GET /api/hr/attendance/userId
    - Leaves Tab: leave history with status, balance card
      → API: GET /api/hr/leave/balance/userId
    - Performance Tab: tasks completed per week (line chart), completion rate
      → API: GET /api/analytics/employee/userId
  - Admin Actions: change role dropdown, activate/deactivate button
  - Manager Actions: assign task button, schedule call button

Route in App.jsx: /employees/:id → <EmployeeDetail />
  - Protected: roles={['admin', 'manager']}
Link from Employees.jsx: click on employee row → navigate to /employees/:id
```

### 5B-4. Report Detail Page

```
File: client/src/pages/ReportDetail.jsx

Backend: GET /api/reports/:id already exists

Sections:
  - Header: date, type (daily/weekly), generated status
  - AI Summary: highlighted text block with Gemini-generated summary
  - Employee Updates: list of each employee's EOD submission with timestamp
  - Highlights: bulleted list of key achievements
  - Blockers: bulleted list with employee name + issue
  - Stats: tasks completed count, submission count
  - Actions: "Generate AI Summary" button (if not yet generated), export/download

Route in App.jsx: /reports/:id → <ReportDetail />
  - Protected: roles={['admin', 'manager']}
Link from Reports.jsx: click on report row → navigate to /reports/:id
```

### 5B-5. 404 Not Found Page

```
File: client/src/pages/NotFound.jsx

  - Dark background matching app theme
  - Large "404" with gradient text
  - "Page not found" message
  - "Go to Dashboard" button
  - Subtle animation (floating or fade)

Route in App.jsx: Change the catch-all route:
  Before: <Route path="*" element={<Navigate to={...} />} />
  After:  <Route path="*" element={isAuthenticated ? <NotFound /> : <Navigate to="/login" />} />
```

### 5B-6. Error Boundary Component

```
File: client/src/components/ErrorBoundary.jsx

  - React class component (must be class for componentDidCatch)
  - Catches any JavaScript error in child components
  - Shows friendly UI: "Something went wrong" card
  - "Reload Page" button
  - Logs error to console
  - Dark theme matching app

Wrap in App.jsx:
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <Routes>...</Routes>
    </Suspense>
  </ErrorBoundary>
```

### 5B-7. Make list pages link to detail pages

```
Files to modify:

client/src/pages/Tasks.jsx:
  - Task cards become clickable
  - onClick → navigate(`/tasks/${task._id}`)

client/src/pages/Employees.jsx:
  - Employee rows become clickable
  - onClick → navigate(`/employees/${user._id}`)

client/src/pages/Reports.jsx:
  - Report rows become clickable
  - onClick → navigate(`/reports/${report._id}`)
```

### New files to create:
| File | Type |
|------|------|
| client/src/pages/TaskDetail.jsx | New page |
| client/src/pages/EmployeeDetail.jsx | New page |
| client/src/pages/ReportDetail.jsx | New page |
| client/src/pages/NotFound.jsx | New page |
| client/src/components/ErrorBoundary.jsx | New component |

### Files to modify:
| File | Action |
|------|--------|
| server/src/controllers/tasks.controller.js | Add getTaskById |
| server/src/routes/tasks.routes.js | Add GET /:id route |
| client/src/App.jsx | Add detail routes + NotFound + ErrorBoundary |
| client/src/pages/Tasks.jsx | Make cards clickable |
| client/src/pages/Employees.jsx | Make rows clickable |
| client/src/pages/Reports.jsx | Make rows clickable |

---

## Phase 5C — Automated Testing (HIGH)

> Zero tests exist. No test framework configured.

### 5C-1. Server testing setup

```bash
cd server && npm install -D jest supertest mongodb-memory-server
```

```
Create: server/jest.config.js
  - testEnvironment: 'node'
  - testMatch: ['**/__tests__/**/*.test.js']

Create: server/src/__tests__/setup.js
  - MongoMemoryServer for in-memory database
  - beforeAll: connect to memory DB
  - afterAll: disconnect and stop
  - afterEach: clear all collections

Update: server/package.json
  "test": "jest --coverage --forceExit --detectOpenHandles",
  "test:watch": "jest --watch"
```

### 5C-2. Server tests to write

```
server/src/__tests__/auth.test.js (8 tests):
  - Register new user → 201
  - Register duplicate email → 400
  - Login with correct password → 200 + tokens
  - Login with wrong password → 401
  - Access protected route without token → 401
  - Access protected route with token → 200
  - Refresh token → new access token
  - Logout → token blacklisted

server/src/__tests__/tasks.test.js (6 tests):
  - Create task (as manager) → 201
  - Create task (as employee) → 403
  - Get my tasks → returns own tasks only
  - Complete task → next task auto-starts
  - Get team tasks (as manager) → returns team tasks
  - Get task by ID → returns populated task

server/src/__tests__/hr.test.js (5 tests):
  - Apply leave → 201 + manager notified
  - Approve leave → status updated + employee notified
  - Reject leave → status updated with reason
  - Clock in → attendance record created
  - Clock out → hours calculated

server/src/__tests__/admin.test.js (4 tests):
  - Get stats → returns counts
  - Change user role → role updated
  - Deactivate user → isActive false
  - Get audit log → returns activity records
```

### 5C-3. Client testing setup

```bash
cd client && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

```
Create: client/vitest.config.js
  - environment: 'jsdom'
  - globals: true
  - setupFiles: './src/__tests__/setup.js'

Create: client/src/__tests__/setup.js
  - Import @testing-library/jest-dom

Update: client/package.json
  "test": "vitest run",
  "test:watch": "vitest"
```

### 5C-4. Client tests to write

```
client/src/__tests__/authStore.test.js (3 tests):
  - login sets user + tokens in localStorage
  - logout clears user + tokens
  - register sets user + tokens

client/src/__tests__/ProtectedRoute.test.jsx (2 tests):
  - Renders children when authenticated
  - Redirects to /login when not authenticated

client/src/__tests__/Sidebar.test.jsx (3 tests):
  - Admin sees all menu sections
  - Manager sees Team Management but not Admin
  - Employee sees only Main + Workspace + Account
```

### 5C-5. Add tests to CI pipeline

```
File: .github/workflows/deploy.yml

Add before deploy steps:
  - name: Run server tests
    run: cd server && npm test
  - name: Run client tests
    run: cd client && npm test
```

### New files to create:
| File | Type |
|------|------|
| server/jest.config.js | Config |
| server/src/__tests__/setup.js | Test setup |
| server/src/__tests__/auth.test.js | Auth tests |
| server/src/__tests__/tasks.test.js | Task tests |
| server/src/__tests__/hr.test.js | HR tests |
| server/src/__tests__/admin.test.js | Admin tests |
| client/vitest.config.js | Config |
| client/src/__tests__/setup.js | Test setup |
| client/src/__tests__/authStore.test.js | Store tests |
| client/src/__tests__/ProtectedRoute.test.jsx | Component tests |
| client/src/__tests__/Sidebar.test.jsx | Component tests |

---

## Phase 5D — Documentation (HIGH)

> No README, no .env.example, no API docs. New person cannot set up or understand the project.

### 5D-1. Root README.md

```
File: corporate-ai-agent/README.md

Contents:
  # Corporate AI Agent
  One-line description

  ## Features (bulleted list with role breakdowns)
  ## Tech Stack (table)
  ## Quick Start (3 commands to run)
  ## Project Structure (directory tree)
  ## Environment Variables (table with descriptions)
  ## API Endpoints (summary table linking to API.md)
  ## Deployment (Railway + Vercel instructions)
  ## Demo Accounts (admin/manager/employee credentials)
  ## Screenshots (if available)
```

### 5D-2. Server .env.example

```
File: server/.env.example

Copy of .env with placeholder values and comments explaining each variable:
  # REQUIRED
  MONGODB_URI=mongodb://localhost:27017/corporate-ai
  JWT_SECRET=change-this-to-a-random-32-char-string
  JWT_REFRESH_SECRET=change-this-to-another-random-string
  JWT_EXPIRES_IN=24h

  # AI (get free key at https://aistudio.google.com/apikey)
  GEMINI_API_KEY=your-gemini-api-key

  # EMAIL (optional — enable Gmail sending)
  GMAIL_USER=your-gmail@gmail.com
  GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

  # REDIS (optional — enables job queue scheduling)
  REDIS_URL=

  # SERVER
  PORT=5000
  CLIENT_URL=http://localhost:3000
  NODE_ENV=development
```

### 5D-3. Client .env.example

```
File: client/.env.example

  # API URL (leave blank to use Vite proxy)
  VITE_API_URL=
```

### 5D-4. API Documentation

```
File: server/API.md

Full endpoint reference:
  - Each endpoint: method, path, auth required, role required, request body, response
  - Organized by module (Auth, Tasks, Calls, Messages, etc.)
  - Include example request/response for key endpoints
```

### New files to create:
| File | Type |
|------|------|
| README.md (project root) | Documentation |
| server/.env.example | Template |
| client/.env.example | Template |
| server/API.md | API reference |

---

## Phase 5E — Docker Setup (HIGH)

> No Docker files. Cannot spin up the entire project with one command.

### 5E-1. Server Dockerfile

```dockerfile
File: server/Dockerfile

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 5000
CMD ["node", "src/app.js"]
```

### 5E-2. Client Dockerfile

```dockerfile
File: client/Dockerfile

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 5E-3. Nginx config for SPA

```
File: client/nginx.conf

  - Serve /api requests → proxy to server:5000
  - Serve all other routes → index.html (SPA routing)
  - Enable gzip compression
  - Cache static assets (js, css, images)
```

### 5E-4. docker-compose.yml

```yaml
File: docker-compose.yml (project root)

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
    ports: ["5000:5000"]
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

### 5E-5. Dockerignore

```
File: .dockerignore (project root)

node_modules
.env
*.log
.git
uploads
dist
```

### New files to create:
| File | Type |
|------|------|
| server/Dockerfile | Docker |
| client/Dockerfile | Docker |
| client/nginx.conf | Nginx config |
| docker-compose.yml | Orchestration |
| .dockerignore | Docker ignore |

### After this, the entire project runs with:
```bash
docker-compose up --build
```
Opens at http://localhost:3000 — everything running.

---

## Phase 5F — Mobile App Completion (MEDIUM)

> 7 screens are built with content. But components/ and store/ folders are empty — no shared UI or state management.

### 5F-1. Mobile store (Zustand)

```
File: mobile/src/store/authStore.js
  - Same logic as web: login, register, logout, fetchUser
  - Use AsyncStorage instead of localStorage

File: mobile/src/store/notificationStore.js
  - Notification list + unread count
  - Socket.io listener
```

### 5F-2. Mobile shared components

```
File: mobile/src/components/Card.jsx
  - Dark themed card with border, matching web GlassCard style

File: mobile/src/components/Button.jsx
  - Gradient button with role-based colors

File: mobile/src/components/Badge.jsx
  - Status badge (pending=yellow, done=green, overdue=red)

File: mobile/src/components/Header.jsx
  - Screen header with title + notification bell

File: mobile/src/components/LoadingScreen.jsx
  - Centered spinner with dark background
```

### 5F-3. Missing screen: NotificationsScreen

```
File: mobile/src/screens/NotificationsScreen.js
  - List of notifications with mark-read
  - Pull-to-refresh
  - Uses notification store
```

### 5F-4. Add push notifications

```
  - Use expo-notifications (already installed)
  - Register push token on login → save to server
  - Server sends push via Expo Push API (free, no Firebase needed for Expo)
```

### New files to create:
| File | Type |
|------|------|
| mobile/src/store/authStore.js | Zustand store |
| mobile/src/store/notificationStore.js | Zustand store |
| mobile/src/components/Card.jsx | Shared component |
| mobile/src/components/Button.jsx | Shared component |
| mobile/src/components/Badge.jsx | Shared component |
| mobile/src/components/Header.jsx | Shared component |
| mobile/src/components/LoadingScreen.jsx | Shared component |
| mobile/src/screens/NotificationsScreen.js | New screen |

---

## Phase 5G — UX Polish (MEDIUM)

> No empty states, no breadcrumbs, no drag-and-drop, no onboarding.

### 5G-1. Empty State Component

```
File: client/src/components/ui/EmptyState.jsx

  - Reusable: accepts icon, title, description, action button
  - Used when: no tasks, no meetings, no documents, no notifications
  - Dark theme with subtle illustration/icon
```

Apply to: Tasks.jsx, Meetings.jsx, Documents.jsx, Reports.jsx, Notifications.jsx

### 5G-2. Breadcrumb Component

```
File: client/src/components/ui/Breadcrumbs.jsx

  - Shows path: Dashboard > Tasks > Task Detail
  - Auto-generates from current route
  - Clickable links to parent pages
```

Apply to: TaskDetail, EmployeeDetail, ReportDetail pages

### 5G-3. Drag-and-Drop Task Reordering

```bash
cd client && npm install @hello-pangea/dnd
```

```
File: client/src/pages/Tasks.jsx (modify)

  - Wrap Kanban columns with DragDropContext
  - Each column is a Droppable
  - Each task card is a Draggable
  - onDragEnd: PATCH /api/tasks/:id to update status when dropped in different column
  - Only for admin/manager view
```

### 5G-4. Skeleton Loaders on All Pages

```
Add loading skeletons to pages that currently show blank while loading:
  - Dashboard: skeleton for stat cards + widgets
  - Tasks: skeleton for kanban columns
  - HR: skeleton for leave cards + attendance
  - Meetings: skeleton for meeting list
  - Analytics: skeleton for chart areas

Use existing Skeleton component from client/src/components/ui/Skeleton.jsx
```

### 5G-5. Onboarding Tour (First-Time Users)

```bash
cd client && npm install driver.js
```

```
File: client/src/components/OnboardingTour.jsx

  - Triggers on first login (check localStorage 'tour_completed')
  - Highlights: sidebar menu, search bar, AI chat, task board, quick actions
  - 5-6 steps with descriptions
  - "Skip" and "Next" buttons
  - Marks tour_completed in localStorage when done
```

### New files to create:
| File | Type |
|------|------|
| client/src/components/ui/EmptyState.jsx | Component |
| client/src/components/ui/Breadcrumbs.jsx | Component |
| client/src/components/OnboardingTour.jsx | Component |

### Files to modify:
| File | Action |
|------|--------|
| client/src/pages/Tasks.jsx | Add drag-and-drop + empty state |
| client/src/pages/Meetings.jsx | Add empty state |
| client/src/pages/Documents.jsx | Add empty state |
| client/src/pages/Reports.jsx | Add empty state |
| client/src/pages/Dashboard.jsx | Add skeleton loaders |

### Packages to install:
```bash
cd client && npm install @hello-pangea/dnd driver.js
```

---

## Phase 5H — Backend Improvements (MEDIUM)

> No structured logging, no graceful shutdown, missing pagination.

### 5H-1. Winston Structured Logging

```bash
cd server && npm install winston
```

```
File: server/src/config/logger.js

  - Log levels: error, warn, info, debug
  - Console transport (colorized, for development)
  - File transport (production): logs/error.log + logs/combined.log
  - Include timestamp, module name, request ID

Replace console.log/console.error in all controllers with logger.info/logger.error
```

### 5H-2. Graceful Shutdown

```
File: server/src/app.js (add at bottom)

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await mongoose.connection.close();
    server.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down');
    await mongoose.connection.close();
    server.close();
    process.exit(0);
  });
```

### 5H-3. Add Pagination to Missing Endpoints

```
Add page/limit query params to:
  - GET /api/tasks/my (currently returns all)
  - GET /api/documents (currently returns all)

Follow same pattern as existing paginated endpoints (tasks/team, hr/leave/team)
```

### 5H-4. Improved Health Check

```
File: server/src/app.js (modify existing /api/health)

Return:
  {
    status: 'ok',
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisClient ? 'connected' : 'not configured',
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  }
```

### New files to create:
| File | Type |
|------|------|
| server/src/config/logger.js | Winston config |

### Files to modify:
| File | Action |
|------|--------|
| server/src/app.js | Add graceful shutdown, improve health check |
| server/src/controllers/*.js | Replace console.log with logger |

---

## Phase 5I — WebRTC Browser Calling (MEDIUM)

> Current "calls" are just email/notification reminders. No actual voice/video calling.

### 5I-1. Server-side signaling

```
File: server/src/config/socket.js (modify)

Add WebRTC signaling events:
  - 'call:initiate' → forward offer to recipient
  - 'call:answer' → forward answer to caller
  - 'call:ice-candidate' → exchange ICE candidates
  - 'call:reject' → notify caller of rejection
  - 'call:end' → notify both parties
  - Track online users in Map (userId → socketId)
  - Emit 'user:online' / 'user:offline' events
```

### 5I-2. WebRTC hook

```
File: client/src/hooks/useWebRTC.js

  - RTCPeerConnection setup with Google STUN servers
  - getUserMedia for microphone (+ optional camera)
  - createOffer / createAnswer / addIceCandidate
  - ontrack handler for remote audio/video
  - Cleanup on unmount
```

### 5I-3. Call UI Components

```
File: client/src/components/IncomingCall.jsx
  - Full-screen overlay with caller info
  - Accept / Reject buttons
  - Ringing animation + sound

File: client/src/components/ActiveCall.jsx
  - Connected state: timer, caller info
  - Mute / Video / End Call buttons
  - Minimizable to corner
```

### 5I-4. Integrate with Calls page

```
File: client/src/pages/Calls.jsx (modify)

  - Show online/offline status next to each employee (green/red dot)
  - "Call Now" button (if online) → initiates WebRTC call
  - "Schedule Reminder" button (if offline) → existing notification system
  - Both systems work together
```

### New files to create:
| File | Type |
|------|------|
| client/src/hooks/useWebRTC.js | WebRTC hook |
| client/src/components/IncomingCall.jsx | Call UI |
| client/src/components/ActiveCall.jsx | Call UI |

### Files to modify:
| File | Action |
|------|--------|
| server/src/config/socket.js | Add signaling events + online tracking |
| client/src/pages/Calls.jsx | Add call now + online status |

---

## Phase 5J — Final Launch (LOW)

> Last steps before shipping.

### 5J-1. Remove console.logs

```
Server: grep all console.log → replace with logger (Phase 5H)
Client: remove debug console.logs from components
Keep console.error for actual errors
```

### 5J-2. Favicon and Meta Tags

```
  - Generate proper favicon set (16x16, 32x32, 180x180, 512x512)
  - Add Open Graph meta tags in index.html for social sharing
  - Update page title per route
```

### 5J-3. Pre-Launch Security Checklist

```
  [ ] .env in .gitignore (already done)
  [ ] No hardcoded secrets in code
  [ ] Helmet enabled (Phase 5A)
  [ ] CORS restricted to production domain
  [ ] Rate limiting on auth endpoints (Phase 5A)
  [ ] File upload restricted to safe types (already done)
  [ ] JWT secrets are strong 32+ chars
  [ ] MongoDB uses authentication
  [ ] HTTPS enforced in production
```

### 5J-4. Deploy

```
  1. Push to GitHub
  2. Server → Railway (free $5 credit/month)
     - Set environment variables in Railway dashboard
     - Auto-deploys on git push (GitHub Actions)
  3. Client → Vercel (free tier)
     - Connect GitHub repo
     - Set VITE_API_URL to Railway URL
     - Auto-deploys on git push
  4. Mobile → EAS Build (free, 30 builds/month)
     - eas build --platform android
     - Download APK
  5. Run seed script on production
  6. Test all 3 roles
  7. Share links
```

---

## Build Order (Recommended)

```
WEEK 1:
  5A (Security)      ████████████  CRITICAL — protect everything first
  5B (Detail Pages)  ████████████  CRITICAL — core UX gaps

WEEK 2:
  5C (Testing)       ████████████  HIGH — catch bugs
  5D (Documentation) ████████████  HIGH — enable others to contribute

WEEK 3:
  5E (Docker)        ████████░░░░  HIGH — one-command setup
  5H (Backend)       ████████░░░░  MEDIUM — logging + cleanup

WEEK 4:
  5G (UX Polish)     ██████░░░░░░  MEDIUM — skeleton, empty states, drag-drop
  5I (WebRTC)        ██████░░░░░░  MEDIUM — real browser calling

WEEK 5:
  5F (Mobile)        ██████░░░░░░  MEDIUM — complete mobile app
  5J (Launch)        ████░░░░░░░░  LOW — final deploy
```

### Dependency Graph

```
5A (Security) ──→ 5B (Detail Pages) ──→ 5G (UX Polish)
                        ↓
5D (Docs) ──→ 5E (Docker) ──→ 5J (Launch)
                                  ↑
5C (Testing) ────────────────────┘
5H (Backend) ───────────────────┘
5F (Mobile) — independent, parallel
5I (WebRTC) — independent, parallel
```

---

## Package Installations Summary

### Server
```bash
npm install express-mongo-sanitize compression winston
npm install -D jest supertest mongodb-memory-server
```

### Client
```bash
npm install @hello-pangea/dnd driver.js
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

---

## File Count

| Phase | New Files | Modified Files |
|-------|-----------|----------------|
| 5A Security | 0 | 3 |
| 5B Detail Pages | 5 | 6 |
| 5C Testing | 11 | 3 |
| 5D Documentation | 4 | 0 |
| 5E Docker | 5 | 0 |
| 5F Mobile | 8 | 0 |
| 5G UX Polish | 3 | 5 |
| 5H Backend | 1 | 5 |
| 5I WebRTC | 3 | 2 |
| 5J Launch | 0 | 3 |
| **Total** | **~41 new** | **~27 modified** |

---

## Total Cost: $0/month

| Service | Free Tier |
|---------|-----------|
| MongoDB Atlas | 512 MB (M0 cluster) |
| Railway (server) | 500 hrs/month |
| Vercel (client) | 100 GB bandwidth |
| Upstash Redis | 10K commands/day |
| Gemini AI | 60 req/min |
| Google STUN | Unlimited (WebRTC) |
| Expo EAS Build | 30 builds/month |
| GitHub Actions | 2000 min/month |
| Docker | Free (local dev) |

---

## Success Criteria

After Plan 5 is complete:

1. Click any task → see full detail page with comments, timeline, actions
2. Click any employee → see profile, tasks, attendance, leaves, performance
3. Click any report → see AI summary, submissions, highlights, blockers
4. Invalid URL → 404 page (not blank screen)
5. JavaScript error → error boundary (not white screen)
6. 30+ automated tests passing in CI
7. `docker-compose up` starts entire project in one command
8. New developer reads README → sets up in 15 minutes
9. Manager clicks "Call Now" → real browser voice call with employee
10. All API responses gzipped, all headers secured, all inputs sanitized
11. Mobile app has shared components and state management
12. First-time user gets guided tour of features

