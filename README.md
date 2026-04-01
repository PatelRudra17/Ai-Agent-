# Corporate AI Agent

> MERN stack corporate AI platform with Gemini AI, real-time communications, task auto-chaining, HR module, and multi-language support.

## Features

**AI Intelligence**
- Gemini AI chat with streaming responses (token-by-token via Socket.io)
- Multi-language support: English, Hindi, Gujarati (auto-detects user language)
- AI email drafting from rough notes
- Document Q&A — upload PDF/DOCX/CSV and ask questions
- AI-powered task assignment suggestions
- Daily report AI summaries with highlights and blockers
- Dual mode: toggle between automation (rule-based) and AI (intelligent) per feature

**Task Management**
- Create, assign, and track tasks with priorities (critical/high/medium/low)
- Auto-chaining: completing a task automatically starts the next in queue
- 3-level escalation: 30min employee reminder, 2hr manager alert, 24hr admin alert
- Task comments, tags, and dependencies
- Kanban board view with status columns

**Communication**
- Real-time notifications via Socket.io
- Email notifications (task assignments, meeting invites, reports)
- Scheduled messages across email/WhatsApp/Slack channels
- Call scheduling with status tracking

**HR Module**
- Leave management: apply, approve, reject with balance tracking
- Attendance: clock-in/clock-out with hours worked
- Salary slip PDF generation (auto-generated monthly)
- Leave types: casual, sick, annual, unpaid

**Analytics & Reports**
- Daily EOD reports with AI-generated summaries
- Task completion analytics with charts
- Team and individual employee performance metrics
- CSV export for tasks, leaves, attendance, audit log

**Admin Panel**
- System stats overview
- User management (CRUD, role changes, activate/deactivate)
- Audit log of all actions
- Data cleanup tools
- Health check endpoint

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, Framer Motion, Recharts |
| Backend | Node.js, Express 5, Socket.io 4, BullMQ, node-cron |
| Database | MongoDB (Mongoose 9) |
| AI | Google Generative AI (Gemini) — free tier |
| Auth | JWT + bcryptjs + TOTP 2FA (otplib) |
| Mobile | React Native + Expo 52 |
| State | Zustand |
| i18n | react-i18next (EN/HI/GU) |
| Deployment | Railway (server), Vercel (client), EAS Build (mobile) |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Git

### Setup

```bash
# 1. Clone
git clone <repo-url>
cd corporate-ai-agent

# 2. Server
cd server
cp .env.example .env   # Edit with your values
npm install
npm run seed           # Create demo accounts
npm run dev            # Starts on http://localhost:4000

# 3. Client (new terminal)
cd client
npm install
npm run dev            # Starts on http://localhost:5173

# 4. Mobile (optional)
cd mobile
npm install
npx expo start
```

### Docker (Alternative)
```bash
docker-compose up --build
# Opens at http://localhost:3000
```

## Demo Accounts

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | admin123 |
| Manager | manager@company.com | manager123 |
| Employee | priya@company.com | employee123 |
| Employee | amit@company.com | employee123 |
| Employee | neha@company.com | employee123 |

## Project Structure

```
corporate-ai-agent/
├── server/                    # Express.js backend
│   ├── src/
│   │   ├── config/            # DB, Redis, Socket.io config
│   │   ├── controllers/       # Route handlers (16 files)
│   │   ├── middleware/        # Auth, RBAC, validation, rate limiting
│   │   ├── models/            # MongoDB schemas (14 models)
│   │   ├── routes/            # API endpoint definitions (13 files)
│   │   ├── services/          # Gemini, email, calendar, notifications
│   │   ├── workers/           # BullMQ job processors
│   │   ├── cron/              # Scheduled jobs (EOD report, salary)
│   │   └── app.js             # Main server entry
│   └── package.json
├── client/                    # React.js frontend
│   ├── src/
│   │   ├── pages/             # 20 page components
│   │   ├── components/        # Shared UI, charts, widgets, effects
│   │   ├── store/             # Zustand state (auth, notifications, theme)
│   │   ├── services/          # Axios API client, i18n
│   │   ├── hooks/             # useSocket
│   │   └── locales/           # en.json, hi.json, gu.json
│   └── package.json
├── mobile/                    # React Native + Expo
│   ├── src/
│   │   ├── screens/           # 7 mobile screens
│   │   ├── navigation/        # Auth + Main navigators
│   │   └── services/          # API + storage
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Environment Variables

See `server/.env.example` for all variables. Key ones:

| Variable | Required | Description |
|----------|----------|-------------|
| MONGODB_URI | Yes | MongoDB connection string |
| JWT_SECRET | Yes | JWT signing secret (32+ chars) |
| JWT_REFRESH_SECRET | Yes | Refresh token secret |
| GEMINI_API_KEY | Yes | Google AI Studio API key (free) |
| GMAIL_USER | Optional | Gmail for email notifications |
| GMAIL_APP_PASSWORD | Optional | Gmail app password |
| REDIS_URL | Optional | Enables BullMQ job queues |
| PORT | No | Server port (default: 4000) |
| CLIENT_URL | No | Frontend URL for CORS |

## API Endpoints

See [server/API.md](server/API.md) for the complete API reference.

**Summary: 60+ endpoints across 14 modules**
- Auth (10) — register, login, 2FA, refresh, logout
- Users (4) — CRUD + search
- Tasks (10) — create, assign, start, complete, comment, suggest
- Calls (5) — schedule, list, cancel
- Messages (4) — schedule, broadcast, list
- Meetings (6) — create, reschedule, cancel, notes, AI summary
- Reports (4) — generate, list, EOD submit, export PDF
- AI (5) — chat (streaming), conversations, draft email
- Documents (4) — upload, list, Q&A, summarize
- HR (12) — leave, attendance, salary
- Analytics (4) — task, call, team, employee stats
- Admin (9) — stats, user mgmt, audit, health
- Notifications (3) — list, mark read, delete
- Search (1) — global keyword search

## Testing

```bash
# Server tests (Jest + Supertest + MongoDB Memory Server)
cd server && npm test

# Client tests (Vitest + Testing Library)
cd client && npm test
```

## Deployment

**Server** → [Railway](https://railway.app) (free $5 credit/month)
**Client** → [Vercel](https://vercel.com) (free tier)
**Database** → [MongoDB Atlas](https://cloud.mongodb.com) M0 (free forever)
**Mobile** → EAS Build (30 free builds/month)

## User Roles (RBAC)

| Role | Access |
|------|--------|
| Admin | Full access — all data, all employees, system settings |
| Manager | Team only — assign tasks, schedule calls, view team reports |
| Employee | Own data — tasks, AI assistant, HR module |

## Cost

**$0/month** — all services run on free tiers.

## License

ISC
