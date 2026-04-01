# Plan 3 — What To Do Next

## Status: App is built with 117+ files. Needs debugging + polish + launch.

---

## Phase 3A — Fix & Stabilize (Priority: CRITICAL)

### 3A-1. Fix all runtime errors
- [ ] Test every page one by one, fix any console errors
- [ ] Fix AnimatedCounter prop issue (value vs end)
- [ ] Fix any 403/401 errors on pages
- [ ] Fix user.id vs user._id inconsistency across all pages
- [ ] Test login → register → logout → login flow
- [ ] Test role-based access (admin vs manager vs employee)

### 3A-2. Seed database with test data
- [ ] Run `cd server && npm run seed` to create demo users
- [ ] Create sample tasks, meetings, messages via the UI
- [ ] Test all CRUD operations work

### 3A-3. Fix CORS and proxy issues
- [ ] Ensure Vite proxy works correctly for /api
- [ ] Test all API calls from browser DevTools Network tab
- [ ] Fix any "Network Error" or "CORS blocked" issues

### 3A-4. Fix Express 5 + Mongoose 9 compatibility
- [ ] Audit all controllers for deprecated patterns
- [ ] Ensure all pre('save') hooks use async (no next callback)
- [ ] Ensure all routes use the validate() middleware wrapper
- [ ] Test every API endpoint with curl

---

## Phase 3B — Add Real-Time Features (Priority: HIGH)

### 3B-1. Live notifications popup
- [ ] When manager assigns task → employee sees toast notification instantly
- [ ] When leave is approved → employee gets real-time notification
- [ ] When message is scheduled → sender sees delivery status live
- [ ] Show notification count badge in sidebar next to relevant menu items

### 3B-2. Live dashboard updates
- [ ] Dashboard stats auto-refresh every 30 seconds
- [ ] When task is completed → dashboard counter updates without refresh
- [ ] Show "X users online" indicator in sidebar

### 3B-3. Live chat indicators
- [ ] Show "AI is typing..." with animated dots
- [ ] Show message delivery status (sent ✓, delivered ✓✓)
- [ ] Auto-scroll to latest message

---

## Phase 3C — Complete Missing UI Features (Priority: HIGH)

### 3C-1. Notification center page
- [ ] Create /notifications page — list all past notifications
- [ ] Mark as read/unread
- [ ] Filter by type (task, meeting, leave, system)
- [ ] Delete notifications

### 3C-2. Settings page
- [ ] Create /settings page
- [ ] Change language (EN/HI/GU) with instant preview
- [ ] Change notification preferences (email on/off, in-app on/off)
- [ ] Change timezone
- [ ] Delete account

### 3C-3. Search everywhere
- [ ] Add global search bar in header
- [ ] Search across tasks, employees, meetings, documents
- [ ] Show results in a dropdown with categories
- [ ] Keyboard shortcut: Ctrl+K to open search

### 3C-4. Dashboard widgets
- [ ] Add recent tasks widget (last 5 tasks with status)
- [ ] Add upcoming meetings widget (next 3 meetings)
- [ ] Add team activity feed (who did what)
- [ ] Add calendar mini-view showing today's events

### 3C-5. Task detail page
- [ ] Create /tasks/:id page with full task details
- [ ] Show task timeline (created → started → completed)
- [ ] Comment section with real-time updates
- [ ] File attachments upload
- [ ] Task activity log

### 3C-6. Employee detail page
- [ ] Create /employees/:id page
- [ ] Show employee profile, tasks assigned, attendance, leave history
- [ ] Performance chart (tasks completed per week)
- [ ] Manager can edit employee details

### 3C-7. Salary slip download
- [ ] Add "Download Salary Slip" button in HR page
- [ ] Select month/year → generates PDF → downloads
- [ ] Show salary history list

---

## Phase 3D — AI Enhancements (Priority: MEDIUM)

### 3D-1. Get Gemini API key (FREE)
- [ ] Go to https://aistudio.google.com/apikey
- [ ] Create API key → paste in server/.env as GEMINI_API_KEY
- [ ] Restart server → AI Chat works

### 3D-2. AI smart features
- [ ] AI auto-suggests task priority based on description
- [ ] AI summarizes meeting notes when meeting is marked complete
- [ ] AI generates weekly performance report
- [ ] AI drafts email from rough notes (already built, needs UI button)
- [ ] AI answers questions about uploaded documents

### 3D-3. Voice input
- [ ] Add microphone button in AI Chat
- [ ] Use Web Speech API (free, built into browser)
- [ ] Speech-to-text → send to AI → AI responds
- [ ] Works in English, Hindi, Gujarati

### 3D-4. Smart suggestions
- [ ] When typing a message, AI suggests completions
- [ ] When creating a task, AI suggests similar past tasks
- [ ] When scheduling a meeting, AI suggests best time based on calendar

---

## Phase 3E — Email & Notifications Setup (Priority: MEDIUM)

### 3E-1. Setup Gmail notifications
- [ ] Go to https://myaccount.google.com/apppasswords
- [ ] Create app password → paste in server/.env
- [ ] Test: assign a task → email notification sent to employee

### 3E-2. Setup Upstash Redis (FREE)
- [ ] Go to https://upstash.com → sign up
- [ ] Create Redis database → copy URL
- [ ] Paste in server/.env as REDIS_URL
- [ ] Uncomment Redis code in redis.js
- [ ] Restart server → scheduled jobs work:
  - Messages sent at scheduled time
  - Call reminders fire on time
  - Task deadline escalation (30min → 2hr → 24hr)
  - Daily report auto-generates at 7pm
  - Salary slips auto-generate on 1st of month

### 3E-3. Setup Firebase Push (mobile)
- [ ] Create Firebase project at https://console.firebase.google.com
- [ ] Get service account key
- [ ] Add to server/.env
- [ ] Mobile app receives push notifications

---

## Phase 3F — Testing & Quality (Priority: MEDIUM)

### 3F-1. API testing
- [ ] Install Postman or Thunder Client
- [ ] Test every API endpoint:
  - POST /api/auth/register
  - POST /api/auth/login
  - GET /api/auth/me
  - GET /api/users
  - POST /api/tasks
  - GET /api/tasks/my
  - PATCH /api/tasks/:id/start
  - PATCH /api/tasks/:id/complete
  - POST /api/calls/schedule
  - POST /api/messages/schedule
  - POST /api/meetings/create
  - POST /api/reports/eod-submit
  - POST /api/ai/chat
  - POST /api/documents/upload
  - POST /api/hr/leave/apply
  - POST /api/hr/attendance/clock-in
  - GET /api/analytics/tasks

### 3F-2. Browser testing
- [ ] Test on Chrome, Firefox, Edge
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test dark theme on all pages
- [ ] Check no console errors on any page

### 3F-3. Performance testing
- [ ] Run Lighthouse audit (aim for 80+ score)
- [ ] Fix any performance issues
- [ ] Optimize images and assets
- [ ] Add lazy loading for heavy pages (Analytics, Documents)

---

## Phase 3G — Deploy to Production (Priority: LOW)

### 3G-1. Prepare for deployment
- [ ] Update server/.env with production values
- [ ] Update client VITE_API_URL to production server URL
- [ ] Remove all console.log from production code
- [ ] Run `npm run build` and verify no errors

### 3G-2. Deploy backend to Railway (FREE)
- [ ] Go to https://railway.app → sign up with GitHub
- [ ] Connect your GitHub repo
- [ ] Set root directory to `server`
- [ ] Add environment variables (MONGODB_URI, JWT_SECRET, etc.)
- [ ] Deploy → get URL like https://your-app.up.railway.app

### 3G-3. Deploy frontend to Vercel (FREE)
- [ ] Go to https://vercel.com → sign up with GitHub
- [ ] Import `client` folder
- [ ] Set VITE_API_URL to your Railway backend URL
- [ ] Deploy → get URL like https://your-app.vercel.app

### 3G-4. Deploy mobile (Expo EAS)
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Run: `eas login`
- [ ] Update API URL in mobile/src/services/api.js to production
- [ ] Build APK: `eas build --platform android --profile preview`
- [ ] Download APK → install on phone

### 3G-5. Custom domain (optional)
- [ ] Buy domain from Namecheap (~$10/year)
- [ ] Point to Vercel for frontend
- [ ] Update CORS settings on server

---

## Phase 3H — Advanced Features (Priority: LOW)

### 3H-1. Google Calendar integration
- [ ] Create Google Cloud Console project
- [ ] Enable Calendar API
- [ ] Create OAuth2 credentials
- [ ] Add to server/.env
- [ ] Meetings auto-create Google Calendar events with Meet links

### 3H-2. WhatsApp integration
- [ ] Get a dedicated phone number for the bot
- [ ] Start server with whatsapp-web.js
- [ ] Scan QR code from admin dashboard
- [ ] Messages can be sent via WhatsApp

### 3H-3. Slack integration
- [ ] Create Slack App at https://api.slack.com/apps
- [ ] Get Bot Token → add to server/.env
- [ ] Messages can be sent to Slack channels

### 3H-4. File management
- [ ] Setup Cloudflare R2 (10GB free)
- [ ] Upload documents to R2 instead of local storage
- [ ] Generate signed URLs for downloads
- [ ] Auto-delete files after expiry

### 3H-5. Audit log
- [ ] Track every action: who did what, when
- [ ] Create /audit-log page for admins
- [ ] Filter by user, action, date
- [ ] Export to CSV

### 3H-6. Multi-tenant support
- [ ] Add company/organization model
- [ ] Each company has its own users, tasks, settings
- [ ] Admin can manage multiple companies
- [ ] Subdomain routing (company1.yourapp.com)

### 3H-7. Analytics enhancements
- [ ] Add export to PDF/Excel for all reports
- [ ] Add comparison view (this week vs last week)
- [ ] Add employee ranking/leaderboard
- [ ] Add department-wise heatmap

### 3H-8. Progressive Web App (PWA)
- [ ] Add service worker for offline support
- [ ] Add manifest.json for install prompt
- [ ] Cache API responses for offline viewing
- [ ] Push notifications via web

---

## Priority Order — What to do first

| # | Task | Time | Impact |
|---|------|------|--------|
| 1 | Fix runtime errors (3A-1) | 1-2 hours | App actually works |
| 2 | Run seed data (3A-2) | 1 minute | Have test data |
| 3 | Get Gemini API key (3D-1) | 2 minutes | AI Chat works |
| 4 | Setup Gmail (3E-1) | 2 minutes | Email notifications work |
| 5 | Test all pages (3F-2) | 30 minutes | Find remaining bugs |
| 6 | Add global search (3C-3) | 2-3 hours | Much better UX |
| 7 | Add notification center (3C-1) | 2 hours | Professional feel |
| 8 | Task detail page (3C-5) | 3 hours | Core feature |
| 9 | Setup Redis (3E-2) | 5 minutes | Scheduled jobs work |
| 10 | Deploy (3G) | 30 minutes | App is live |

---

## Total Files in Project

| Layer | Count |
|-------|-------|
| Server (.js) | 57 |
| Client (.jsx/.js) | 36 |
| Mobile (.js) | 11 |
| Config/Deploy | 10 |
| **Total** | **114+** |

## Total Cost: $0/month (all free tier services)
