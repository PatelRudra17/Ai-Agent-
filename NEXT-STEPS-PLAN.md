# Corporate AI Agent — Next Steps Plan

## Phase A — Setup & Run (Do This First)

### A1. Start the App
- [ ] Open PowerShell 1: `cd "F:\Ai agent\corporate-ai-agent\server"` → `node src/app.js`
- [ ] Open PowerShell 2: `cd "F:\Ai agent\corporate-ai-agent\client"` → `npm run dev`
- [ ] Open browser: http://localhost:3000

### A2. Create Admin Account (AUTOMATED)
- [x] **DONE** — Run `cd server && npm run seed` to auto-create admin + manager + 3 employees
- Login credentials after seeding:
  - Admin: `admin@company.com` / `admin123`
  - Manager: `manager@company.com` / `manager123`
  - Employees: `priya@company.com`, `amit@company.com`, `neha@company.com` / `employee123`

### A3. Get Free Gemini API Key (for AI Chat)
- [ ] Go to https://aistudio.google.com/apikey
- [ ] Sign in with Google → Create API Key → Copy it
- [ ] Open `server/.env` → paste in `GEMINI_API_KEY=your-key-here`
- [ ] Restart server → AI Chat works in English, Hindi, Gujarati

### A4. Setup Gmail for Email Notifications (Optional)
- [ ] Go to https://myaccount.google.com/apppasswords → Create App Password
- [ ] Open `server/.env` → Set `GMAIL_USER` and `GMAIL_APP_PASSWORD`
- [ ] Restart server — email notifications will work

---

## Phase C — Improvements & Bug Fixes (ALL DONE)

### C1. UI Improvements
- [x] Dark mode toggle (Header component)
- [x] Notification bell with unread count (Header component)
- [x] Collapsible sidebar on mobile (Layout + Sidebar updated)
- [x] Profile edit page (Profile.jsx)
- [x] Password change feature (Profile.jsx + auth controller)
- [x] Documents page with upload + AI Q&A (Documents.jsx)

### C2. Real-time Features
- [x] Socket.io hook for live notifications (useSocket.js)
- [x] Real-time notification popup via toast
- [x] Live task/call/message status updates
- [x] Alert escalation notifications

### C3. Missing Features
- [x] Document upload page with AI Ask + Summary (Documents.jsx)
- [x] Profile edit page
- [x] Password change
- [x] Documents nav item in sidebar

### C4. Security Hardening
- [x] Rate limiting on all routes (express-rate-limit)
- [x] Auth routes: 20 req/15min
- [x] API routes: 100 req/min
- [x] AI routes: 12 req/min (Gemini free tier safe)
- [x] Token blacklist on logout (BlacklistedToken model + MongoDB TTL)
- [x] Express-validator middleware fix for Express 5

---

## Phase D — Setup Redis (Enables Job Queues) — YOUR ACTION NEEDED
- [ ] Go to https://upstash.com → Sign up free
- [ ] Create Redis database → Copy URL
- [ ] Open `server/.env` → Set `REDIS_URL=redis://...`
- [ ] Restart server — scheduled jobs will work

## Phase E — Deploy to Production — YOUR ACTION NEEDED
- [ ] Railway: https://railway.app (backend)
- [ ] Vercel: https://vercel.com (frontend)
- [ ] Config files already created: `railway.json`, `vercel.json`, `.github/workflows/deploy.yml`

## Phase F — Advanced Features (Future) — YOUR ACTION NEEDED
- [ ] Google Calendar: Setup Google Cloud Console → Calendar API
- [ ] WhatsApp: whatsapp-web.js needs phone with QR scan
- [ ] Slack: Create Slack App → Get bot token
- [ ] Firebase Push: Create Firebase project → Get service key
