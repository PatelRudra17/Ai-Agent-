# Plan 4 — Production-Ready: Charts, Admin Panel, Mobile, PWA & Security

## Goal
Transform the corporate AI agent from a feature-complete prototype into a production-ready, deployable product. Fill the remaining gaps: build chart components, create an admin control panel, complete the mobile app, add PWA support, implement security hardening (2FA, audit log UI), and optimize for real-world usage. **Total cost: $0 — all free tools and libraries.**

---

## Current Status (What's Done)

| Area | Status |
|------|--------|
| Auth + JWT + Roles | Done |
| 16 Frontend Pages | Done |
| 80+ API Endpoints | Done |
| 13 MongoDB Models | Done |
| AI Chat (Gemini) | Done |
| 3D Animations + Glassmorphism | Done |
| Socket.io Real-time | Done |
| Document Upload + AI Q&A | Done |
| HR (Leave, Attendance, Salary) | Done |
| Mobile App Structure | Partial |
| Chart Components | Empty folder — not built |
| Admin System Panel | Not built |
| PWA / Offline | Not built |
| 2FA / Security Hardening | Not built |
| Audit Log UI | Not built |
| Data Export (CSV/PDF) | Partial (salary PDF only) |

---

## Phase 4A — Build Chart Components (Priority: CRITICAL)

> The `client/src/components/charts/` folder is empty. Recharts is installed but no components exist. Analytics, Dashboard, and Reports pages need charts.

### 4A-1. Install missing chart utility
```bash
cd client
npm install date-fns
```

### 4A-2. Create reusable animated chart components
All charts should use the glassmorphism design system (GlassCard wrapper, themed colors, dark mode support).

- `components/charts/AnimatedBarChart.jsx`
  - Recharts `<BarChart>` with animation enabled
  - Glassmorphism tooltip with backdrop-blur
  - Gradient fill bars using `<defs>` + `<linearGradient>`
  - Dark/light theme colors from themeStore
  - Responsive container with aspect ratio

- `components/charts/AnimatedLineChart.jsx`
  - Recharts `<LineChart>` with smooth curves (`type="monotone"`)
  - Animated dot on hover
  - Gradient area fill below line
  - Multi-line support for comparison views

- `components/charts/AnimatedPieChart.jsx`
  - Recharts `<PieChart>` with custom active shape
  - Hover: sector expands outward
  - Center label showing total/selected value
  - Custom legend with colored dots

- `components/charts/AnimatedAreaChart.jsx`
  - Stacked area chart for trend data
  - Gradient fills per series
  - Animated on mount

- `components/charts/StatSparkline.jsx`
  - Tiny inline chart for dashboard stat cards
  - No axis labels, just the line/area
  - Shows trend direction (up/down arrow + color)

- `components/charts/ChartTooltip.jsx`
  - Shared custom glassmorphism tooltip
  - Blur background, rounded, themed text

### 4A-3. Wire charts into existing pages
- **Dashboard.jsx** — Add sparklines inside stat cards, mini bar chart for "tasks this week"
- **Analytics.jsx** — Full page with:
  - Task completion trend (line chart, last 30 days)
  - Department workload (bar chart)
  - Task priority distribution (pie chart)
  - Attendance trend (area chart)
  - Top performers table with sparklines
- **Reports.jsx** — Embed charts in generated reports
- **HR.jsx** — Leave balance pie chart, attendance heatmap-style bar chart

---

## Phase 4B — Admin Control Panel (Priority: HIGH)

> Currently there's no dedicated admin page to manage the system. Admins use the same UI as managers.

### 4B-1. Create admin routes (backend)
- `routes/admin.routes.js`
  - `GET /api/admin/stats` — System-wide stats (total users, tasks, storage used, uptime)
  - `GET /api/admin/users` — All users with filters (role, department, active/inactive)
  - `PATCH /api/admin/users/:id/role` — Change user role
  - `PATCH /api/admin/users/:id/deactivate` — Deactivate user account
  - `PATCH /api/admin/users/:id/activate` — Reactivate user account
  - `GET /api/admin/audit-log` — Paginated audit log (uses ActivityLog model)
  - `GET /api/admin/audit-log/export` — Export audit log as CSV
  - `DELETE /api/admin/data/cleanup` — Remove old notifications, expired tokens, old logs
  - `GET /api/admin/system/health` — MongoDB connection status, memory usage, uptime

### 4B-2. Create admin controller
- `controllers/admin.controller.js`
  - Aggregate stats from all models
  - Paginated audit log with filters (user, action, date range)
  - CSV export using json2csv (lightweight, free)
  - System health check (mongoose connection state, process.memoryUsage)

### 4B-3. Create admin frontend page
- `pages/Admin.jsx` — Full admin dashboard with tabs:
  - **Overview tab**: System stats cards (users, tasks, documents, storage), health indicators
  - **User Management tab**: Table of all users, role dropdown to change roles, activate/deactivate toggle, search/filter
  - **Audit Log tab**: Paginated table of all actions (who did what, when), filter by user/action/date, export CSV button
  - **System tab**: Server health, MongoDB status, memory/CPU indicators, data cleanup button with confirmation modal

### 4B-4. Add admin route to App.jsx
- Route: `/admin` — Protected, admin role only
- Add "Admin Panel" to Sidebar.jsx (visible only to admin role)
- Add admin icon (Shield or Settings2 from lucide-react)

### 4B-5. Install CSV export utility
```bash
cd server
npm install json2csv
```

---

## Phase 4C — Data Export Everywhere (Priority: HIGH)

> Users need to export data as CSV/PDF from various pages. Currently only salary slips generate PDFs.

### 4C-1. Create shared export service (backend)
- `services/export.service.js`
  - `exportCSV(data, columns, filename)` — Generic CSV generator using json2csv
  - `exportPDF(title, data, columns)` — Generic PDF table generator using pdfkit (already installed)

### 4C-2. Add export endpoints
- `GET /api/tasks/export?format=csv` — Export tasks list
- `GET /api/analytics/export?format=csv` — Export analytics data
- `GET /api/hr/attendance/export?userId=X&month=Y&format=csv` — Export attendance
- `GET /api/hr/leave/export?format=csv` — Export leave records
- `GET /api/reports/:id/export?format=pdf` — Export single report as PDF

### 4C-3. Add export buttons in frontend
- Tasks page: "Export CSV" button in header
- Analytics page: "Download Report" button per chart/section
- HR page: "Export Attendance" and "Export Leave History" buttons
- Reports page: "Download PDF" button per report
- Admin audit log: "Export CSV" button

### 4C-4. Create ExportButton UI component
- `components/ui/ExportButton.jsx`
  - GlowButton with download icon
  - Loading state while generating
  - Triggers file download via blob URL

---

## Phase 4D — Security Hardening (Priority: HIGH)

### 4D-1. Two-Factor Authentication (2FA) — FREE with TOTP
```bash
cd server
npm install otplib qrcode
```

- `POST /api/auth/2fa/setup` — Generate TOTP secret + QR code
- `POST /api/auth/2fa/verify` — Verify TOTP code and enable 2FA
- `POST /api/auth/2fa/validate` — Validate 2FA code during login
- `POST /api/auth/2fa/disable` — Disable 2FA (requires current code)

**How it works:**
1. User goes to Settings → Security → Enable 2FA
2. Server generates TOTP secret, returns QR code (base64 image)
3. User scans QR with Google Authenticator / Authy (free apps)
4. User enters 6-digit code to confirm
5. On next login: after password, prompt for 2FA code
6. Stored in User model: `twoFactorSecret`, `twoFactorEnabled`

### 4D-2. Add 2FA fields to User model
```js
twoFactorSecret: { type: String, select: false },
twoFactorEnabled: { type: Boolean, default: false }
```

### 4D-3. Update login flow
- After password verification, check if `twoFactorEnabled`
- If yes: return `{ requires2FA: true, tempToken }` instead of full JWT
- Frontend shows 2FA input modal
- User enters code → `POST /api/auth/2fa/validate` with tempToken + code
- Server verifies → returns full JWT tokens

### 4D-4. Frontend 2FA components
- `components/TwoFactorSetup.jsx` — QR code display + verification input
- `components/TwoFactorPrompt.jsx` — Modal during login for 2FA code entry
- Add 2FA section to Settings.jsx → Security tab

### 4D-5. Session management
- `GET /api/auth/sessions` — List active sessions (stored in a new Session model or JWT tracking)
- `DELETE /api/auth/sessions/:id` — Revoke a specific session
- Show active sessions in Settings → Security tab
- "Log out all devices" button

### 4D-6. Password policy enforcement
- Minimum 8 characters, at least 1 uppercase, 1 number, 1 special character
- Add validation in auth.controller.js register + change-password
- Frontend: real-time password strength meter in Register.jsx and Profile.jsx
- Block common passwords (top 100 list, hardcoded array)

---

## Phase 4E — Complete Mobile App (Priority: MEDIUM)

> Mobile app has 7 screens and basic navigation but needs full API integration and missing screens.

### 4E-1. Fix API integration in all screens
- Ensure `mobile/src/services/api.js` matches all web API endpoints
- Add token refresh logic (same as web client)
- Add proper error handling with user-friendly messages
- Test login → dashboard → tasks → AI chat flow on mobile

### 4E-2. Add missing mobile screens
- `screens/MeetingsScreen.js` — List and create meetings
- `screens/DocumentsScreen.js` — Upload documents, AI Q&A
- `screens/MessagesScreen.js` — Internal messaging
- `screens/NotificationsScreen.js` — Notification center
- `screens/SettingsScreen.js` — Language, theme, notification preferences

### 4E-3. Add to mobile navigation
- Update `MainNavigator.js` — Add Meetings, Documents to bottom tabs or drawer
- Add notification badge on tab icons
- Add settings gear icon in header

### 4E-4. Mobile-specific features
- **Biometric login** — Use `expo-local-authentication` (already installed)
  - Fingerprint / Face ID to unlock after initial login
  - Store token securely in AsyncStorage
  - Auto-lock after 5 minutes of inactivity
- **Push notifications** — Use `expo-notifications` (already installed)
  - Register device token on login → send to backend
  - Backend sends push via Firebase FCM on task assignment, leave approval, meeting reminder
- **Offline mode** — Cache recent tasks and messages in AsyncStorage
  - Show cached data when offline with "Offline" banner
  - Sync when back online
- **Pull-to-refresh** — Add to all list screens
- **Dark mode** — Follow system theme or manual toggle

### 4E-5. Mobile build
```bash
cd mobile
npx expo install expo-dev-client
npx eas build --platform android --profile preview
```
- Generates APK for testing
- No Google Play Store account needed for testing

---

## Phase 4F — Progressive Web App (Priority: MEDIUM)

> Turn the web app into an installable PWA with offline support.

### 4F-1. Create service worker
- `client/public/sw.js` — Service worker for caching
  - Cache static assets (JS, CSS, images) on install
  - Network-first strategy for API calls
  - Cache-first strategy for static assets
  - Offline fallback page

### 4F-2. Create web app manifest
- `client/public/manifest.json`
```json
{
  "name": "Corporate AI Agent",
  "short_name": "AI Agent",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0a0a1a",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 4F-3. Register service worker in main.jsx
```js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### 4F-4. Add install prompt
- `components/PWAInstallPrompt.jsx`
  - Detect `beforeinstallprompt` event
  - Show subtle banner: "Install app for a better experience"
  - Dismiss or install button
  - Remember dismissal in localStorage

### 4F-5. Web push notifications
- Use Web Push API (free, built into browsers)
- `POST /api/notifications/subscribe` — Store push subscription on server
- Server sends push notifications for: task assigned, leave approved, meeting reminder
- Uses `web-push` npm package (free)
```bash
cd server
npm install web-push
```

### 4F-6. Generate app icons
- Create simple SVG icon with the indigo/violet gradient
- Use any free tool to generate 192x192 and 512x512 PNGs
- Place in `client/public/`

---

## Phase 4G — Notification & Activity System Upgrade (Priority: MEDIUM)

### 4G-1. Upgrade notification model
- Add to existing Alert model or create `Notification` model:
  - `type`: task_assigned, task_completed, leave_approved, leave_rejected, meeting_reminder, system_alert, mention
  - `title`: Short notification title
  - `body`: Notification message
  - `link`: URL to navigate to (e.g., `/tasks`, `/hr`)
  - `read`: Boolean
  - `userId`: Recipient
  - `createdAt`: Timestamp

### 4G-2. Create notification endpoints
- `GET /api/notifications` — Paginated notifications for current user
- `PATCH /api/notifications/:id/read` — Mark as read
- `PATCH /api/notifications/read-all` — Mark all as read
- `DELETE /api/notifications/:id` — Delete notification
- `GET /api/notifications/unread-count` — Quick count for badge

### 4G-3. Trigger notifications everywhere
Add notification creation in controllers:
- `tasks.controller.js` — On create: notify assignee. On complete: notify manager.
- `hr.controller.js` — On leave approve/reject: notify employee. On clock-in: log activity.
- `meetings.controller.js` — On create: notify all participants. 30min before: reminder.
- `messages.controller.js` — On send: notify recipient.
- `admin.controller.js` — On role change: notify user.

### 4G-4. Upgrade Notifications.jsx page
- Group notifications by date (Today, Yesterday, This Week, Older)
- Click notification → navigate to relevant page
- Swipe to dismiss (on mobile)
- Filter tabs: All | Tasks | HR | Meetings | System
- Empty state with Lottie animation

### 4G-5. Activity feed on Dashboard
- `components/ActivityFeed.jsx`
  - Shows last 10 team activities
  - "Priya completed task: Fix login bug" with timestamp
  - Stagger animation on load
  - Real-time updates via Socket.io

---

## Phase 4H — Dashboard Widgets & Customization (Priority: LOW)

### 4H-1. Widget components
- `components/widgets/TasksWidget.jsx` — Last 5 tasks with status pills
- `components/widgets/MeetingsWidget.jsx` — Next 3 upcoming meetings with countdown
- `components/widgets/ActivityWidget.jsx` — Team activity feed (last 10 actions)
- `components/widgets/CalendarWidget.jsx` — Mini calendar showing today's events
- `components/widgets/QuickActionsWidget.jsx` — Common actions: Create Task, Schedule Meeting, Apply Leave
- `components/widgets/AIInsightsWidget.jsx` — AI-generated daily summary (1 Gemini call/day, cached)

### 4H-2. Dashboard layout upgrade
- Replace current Dashboard.jsx layout with widget grid
- 2-column layout on desktop, 1-column on mobile
- Each widget is a GlassCard with header + content
- Stat cards row at top with AnimatedCounter + Sparkline

### 4H-3. Role-based dashboard
- **Admin**: System health + user stats + audit log preview + all widgets
- **Manager**: Team stats + task distribution chart + team activity + meetings
- **Employee**: My tasks + upcoming meetings + leave balance + AI insights

---

## Phase 4I — Performance & Optimization (Priority: LOW)

### 4I-1. Frontend optimization
- Lazy load all pages with `React.lazy()` + `Suspense`
  ```jsx
  const Dashboard = lazy(() => import('./pages/Dashboard'));
  ```
- Add loading skeleton while page chunks load
- Lazy load 3D Scene component (heaviest component)
- Lazy load chart components (loaded only on Analytics/Dashboard)
- Preload critical routes on hover (dashboard, tasks)

### 4I-2. Backend optimization
- Add pagination to ALL list endpoints (default: 20 per page)
  - Tasks, messages, meetings, notifications, audit log, documents
  - Response format: `{ data: [], total, page, totalPages }`
- Add MongoDB indexes for frequently queried fields:
  ```js
  // Task: assignedTo + status (common query)
  TaskSchema.index({ assignedTo: 1, status: 1 });
  // Notification: userId + read + createdAt
  // Attendance: userId + date
  // ActivityLog: createdAt (for audit log)
  ```
- Cache dashboard stats in memory (refresh every 60 seconds) using simple in-memory cache
  - No Redis needed for basic caching
  ```js
  let cache = { data: null, timestamp: 0 };
  const CACHE_TTL = 60000; // 1 min
  ```

### 4I-3. Image & asset optimization
- Compress all static images
- Use WebP format where possible
- Add `loading="lazy"` to images
- Optimize Three.js: reduce particle count on mobile, use `frameloop="demand"`

### 4I-4. Bundle size reduction
- Analyze bundle: `npx vite-bundle-visualizer`
- Tree-shake Three.js (import only what's used)
- Tree-shake Recharts (import individual components)
- Dynamic import heavy libraries:
  ```js
  const { TypeAnimation } = await import('react-type-animation');
  ```

---

## Phase 4J — Testing & Quality Assurance (Priority: LOW)

### 4J-1. API endpoint testing checklist
Test every endpoint with curl or Postman (Thunder Client in VS Code is free):

**Auth:**
- [ ] POST /api/auth/register — Create new user
- [ ] POST /api/auth/login — Login and get tokens
- [ ] POST /api/auth/refresh — Refresh access token
- [ ] POST /api/auth/logout — Blacklist token
- [ ] POST /api/auth/change-password — Change password
- [ ] GET /api/auth/me — Get current user

**Tasks:**
- [ ] POST /api/tasks — Create task (as manager)
- [ ] GET /api/tasks/my — Get my tasks (as employee)
- [ ] GET /api/tasks/team — Get team tasks (as manager)
- [ ] PATCH /api/tasks/:id/start — Start a task
- [ ] PATCH /api/tasks/:id/complete — Complete a task
- [ ] POST /api/tasks/:id/comment — Add comment
- [ ] GET /api/tasks/export?format=csv — Export tasks

**Meetings:**
- [ ] POST /api/meetings — Schedule meeting
- [ ] GET /api/meetings — List meetings
- [ ] PATCH /api/meetings/:id — Update meeting
- [ ] DELETE /api/meetings/:id — Cancel meeting

**HR:**
- [ ] POST /api/hr/leave/apply — Apply for leave
- [ ] GET /api/hr/leave/my — My leave requests
- [ ] PATCH /api/hr/leave/:id/approve — Approve leave
- [ ] POST /api/hr/attendance/clock-in — Clock in
- [ ] POST /api/hr/attendance/clock-out — Clock out
- [ ] GET /api/hr/salary/:userId/:month — Get salary PDF

**AI:**
- [ ] POST /api/ai/chat — Send AI message
- [ ] GET /api/ai/conversations — List conversations
- [ ] POST /api/ai/draft-email — Draft email

**Documents:**
- [ ] POST /api/documents/upload — Upload file
- [ ] GET /api/documents — List documents
- [ ] POST /api/documents/:id/ask — Ask question

**Admin:**
- [ ] GET /api/admin/stats — System stats
- [ ] GET /api/admin/users — All users
- [ ] PATCH /api/admin/users/:id/role — Change role
- [ ] GET /api/admin/audit-log — Audit log
- [ ] GET /api/admin/system/health — Health check

### 4J-2. Frontend testing checklist
- [ ] Login → Dashboard → all page navigation works
- [ ] Test as Admin, Manager, Employee (different sidebar items visible)
- [ ] Dark mode toggle works on every page
- [ ] Mobile responsive (resize browser to 375px width)
- [ ] All forms submit correctly with validation
- [ ] Charts render with real data
- [ ] AI chat sends and receives messages
- [ ] Real-time notifications appear
- [ ] File upload works
- [ ] Export CSV/PDF downloads correctly
- [ ] 2FA setup and login flow works
- [ ] No console errors on any page

### 4J-3. Performance checklist
- [ ] Lighthouse score > 80 on all pages
- [ ] First Contentful Paint < 2 seconds
- [ ] Bundle size < 500KB gzipped (excluding Three.js)
- [ ] No memory leaks (check Chrome DevTools Memory tab)
- [ ] 3D scene runs at 60fps on mid-range hardware

---

## Build Order (Priority)

| Step | Phase | What | Impact |
|------|-------|------|--------|
| 1 | 4A | Build chart components + wire into pages | Analytics actually works |
| 2 | 4B | Admin control panel | System management |
| 3 | 4C | Data export (CSV/PDF) everywhere | Professional feature |
| 4 | 4D | 2FA + password policy | Security |
| 5 | 4G | Notification system upgrade | Better UX |
| 6 | 4H | Dashboard widgets | Polished dashboard |
| 7 | 4I | Performance optimization | Fast & smooth |
| 8 | 4F | PWA support | Installable app |
| 9 | 4E | Complete mobile app | Full mobile experience |
| 10 | 4J | Testing & QA | Production ready |

---

## New Files to Create

### Frontend (~20 files)
```
client/src/
├── components/
│   ├── charts/
│   │   ├── AnimatedBarChart.jsx
│   │   ├── AnimatedLineChart.jsx
│   │   ├── AnimatedPieChart.jsx
│   │   ├── AnimatedAreaChart.jsx
│   │   ├── StatSparkline.jsx
│   │   └── ChartTooltip.jsx
│   ├── widgets/
│   │   ├── TasksWidget.jsx
│   │   ├── MeetingsWidget.jsx
│   │   ├── ActivityWidget.jsx
│   │   ├── CalendarWidget.jsx
│   │   ├── QuickActionsWidget.jsx
│   │   └── AIInsightsWidget.jsx
│   ├── ui/
│   │   └── ExportButton.jsx
│   ├── TwoFactorSetup.jsx
│   ├── TwoFactorPrompt.jsx
│   ├── ActivityFeed.jsx
│   └── PWAInstallPrompt.jsx
├── pages/
│   └── Admin.jsx
└── public/
    ├── sw.js
    └── manifest.json
```

### Backend (~6 files)
```
server/src/
├── routes/
│   └── admin.routes.js
├── controllers/
│   └── admin.controller.js
├── services/
│   └── export.service.js
└── (updates to existing controllers, models, routes)
```

### Mobile (~5 files)
```
mobile/src/screens/
├── MeetingsScreen.js
├── DocumentsScreen.js
├── MessagesScreen.js
├── NotificationsScreen.js
└── SettingsScreen.js
```

---

## New Dependencies

### Server
| Package | Purpose | Cost |
|---------|---------|------|
| `json2csv` | CSV export | Free |
| `otplib` | TOTP 2FA generation | Free |
| `qrcode` | QR code for 2FA setup | Free |
| `web-push` | PWA push notifications | Free |

### Client
| Package | Purpose | Cost |
|---------|---------|------|
| `date-fns` | Date formatting for charts | Free |

### Total new dependencies: 5 (all free)

---

## Total Cost: $0/month (all free tier services)
