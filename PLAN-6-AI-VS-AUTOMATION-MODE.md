# Plan 6 — AI Mode vs Automation Mode (Dual Intelligence System)

---

## Core Concept

Every smart feature in the platform has TWO modes that users can switch between:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ⚙ AUTOMATION MODE (Default — Safe)                │
│      Fixed rules, predictable, no AI involved       │
│      "When X happens, always do Y"                  │
│                                                     │
│   🤖 AI MODE (Optional — Smart)                     │
│      AI analyzes context, recommends, decides       │
│      "Analyze situation, suggest best action"        │
│                                                     │
│   User picks with a toggle/button per feature       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Why Both Modes

```
AUTOMATION ALONE:
  ✅ Reliable, predictable, zero risk
  ❌ Dumb — same action regardless of context
  ❌ No competitive edge — every tool does this

AI ALONE:
  ✅ Smart, context-aware, impressive
  ❌ Can make wrong calls
  ❌ Some companies don't trust AI decisions
  ❌ Costs API calls even when not needed

BOTH TOGETHER (Our Approach):
  ✅ User has full control
  ✅ Conservative users → stay on Automation
  ✅ Tech-forward users → enable AI
  ✅ Zero API cost when AI mode is OFF
  ✅ Unique selling point — no competitor does this
  ✅ Builds trust gradually
```

---

## Database Changes

### User Model — Add AI Preferences

```javascript
// Add to User model (server/src/models/User.js)

aiPreferences: {
  masterMode: {
    type: String,
    enum: ['automation', 'ai'],
    default: 'automation',
  },
  features: {
    taskAssignment: { type: String, enum: ['automation', 'ai'], default: 'automation' },
    taskEscalation: { type: String, enum: ['automation', 'ai'], default: 'automation' },
    leaveAnalysis: { type: String, enum: ['automation', 'ai'], default: 'automation' },
    dailyReports: { type: String, enum: ['automation', 'ai'], default: 'automation' },
    dashboardBriefing: { type: String, enum: ['automation', 'ai'], default: 'automation' },
    meetingSummary: { type: String, enum: ['automation', 'ai'], default: 'automation' },
    messageDrafting: { type: String, enum: ['automation', 'ai'], default: 'automation' },
  },
}
```

### Helper Function — Check Mode

```javascript
// server/src/utils/checkAIMode.js

const User = require('../models/User');

const isAIMode = async (userId, feature) => {
  const user = await User.findById(userId).select('aiPreferences');
  if (!user?.aiPreferences) return false;

  // Master switch overrides individual features
  if (user.aiPreferences.masterMode === 'automation') return false;

  // Check individual feature preference
  return user.aiPreferences.features?.[feature] === 'ai';
};

module.exports = { isAIMode };
```

---

## 7 Features — Automation vs AI Mode

---

### Feature 1: Task Assignment

**Where:** Tasks page → Create Task form

**Automation Mode (Current — No Change):**
```
Manager opens "Create Task"
  → Manually selects employee from dropdown
  → Sets priority, due date
  → Clicks create
  → Employee notified
```

**AI Mode (New):**
```
Manager opens "Create Task"
  → Fills title, description, priority, due date
  → Clicks "AI Suggest Assignee"
  → Backend:
       1. Fetch all team employees
       2. For each employee, get:
          - Current pending task count
          - Average completion time for similar tasks
          - Current workload (tasks due this week)
          - Skills/department match
       3. Send data to Gemini:
          "Given these employees and their workload,
           who is the best person for this task?
           Task: [title + description]
           Employees: [data]"
       4. Gemini returns: recommendation + reason
  → Frontend shows:
       "🤖 AI Recommends: Priya
        Reason: Lowest workload (2 tasks), completed
        5 similar design tasks, avg 4.2 hrs
        [Assign Priya] [Choose Someone Else]"
```

**Files to modify:**
- `server/src/controllers/tasks.controller.js` — add `suggestAssignee` endpoint
- `server/src/services/gemini.service.js` — add `suggestTaskAssignment` function
- `client/src/pages/Tasks.jsx` — add AI suggest button in create form

**New endpoint:**
```
POST /api/tasks/suggest-assignee
Body: { title, description, priority, dueDate }
Response: { suggestedEmployee, reason, alternatives }
```

---

### Feature 2: Task Escalation

**Where:** Deadline worker (background process)

**Automation Mode (Current — No Change):**
```
Task overdue:
  30 min  → Level 1: Notify employee (always)
  2 hours → Level 2: Notify manager (always)
  24 hours → Level 3: Notify admin (always)
  
  Fixed thresholds. No exceptions. No context check.
```

**AI Mode (New):**
```
Task overdue → Before escalating, AI checks:
  1. Is employee currently active? (last clock-in, last task action)
  2. Task complexity (priority, description length, tags)
  3. Employee's historical pattern (usually late but delivers?)
  4. Is there a dependency blocking this task?
  5. Team situation (others on leave? team overloaded?)

  Send context to Gemini:
  "Task X is overdue by Y hours. Here's the context: [data]
   Should I: escalate, wait, reassign, or extend deadline?
   Give decision and reason."

  Gemini decides:
  OPTION A: "Escalate — employee inactive for 4 hours"
  OPTION B: "Wait 2 more hours — employee is active, task is complex"
  OPTION C: "Reassign to Amit — original assignee is on leave tomorrow"
  OPTION D: "Extend deadline — dependency task not yet completed"

  → Execute the AI decision
  → Log the decision with reason in ActivityLog
```

**Files to modify:**
- `server/src/workers/deadline.worker.js` — add AI check before escalation
- `server/src/services/gemini.service.js` — add `analyzeEscalation` function
- `server/src/models/ActivityLog.js` — log AI decisions

**Decision flow:**
```javascript
// In deadline.worker.js
const { isAIMode } = require('../utils/checkAIMode');

// Before escalation:
const useAI = await isAIMode(task.assignedBy, 'taskEscalation');

if (useAI) {
  const decision = await analyzeEscalation(task, employee, context);
  // decision = { action: 'wait'|'escalate'|'reassign'|'extend', reason: '...' }
  await executeAIDecision(decision, task);
} else {
  // Current fixed escalation logic (unchanged)
  await executeEscalation(task, level);
}
```

---

### Feature 3: Leave Approval Analysis

**Where:** HR page → Team Leaves tab (Manager view)

**Automation Mode (Current — No Change):**
```
Employee applies for leave
  → Manager sees: name, type, dates, reason, balance remaining
  → Manager manually decides: Approve or Reject
  → No analysis, no risk assessment
```

**AI Mode (New):**
```
Employee applies for leave
  → Manager sees leave request + AI Analysis panel:

  🤖 AI Risk Analysis:
  ┌──────────────────────────────────────────┐
  │ Risk Level: MEDIUM ⚠️                    │
  │                                          │
  │ ✅ Balance: 7 days remaining (sufficient)│
  │ ⚠️ Conflict: Amit also on leave Apr 3-4 │
  │ ✅ No critical deadlines that week       │
  │ ⚠️ Team capacity: 60% (below 70% ideal) │
  │ ✅ Employee attendance: 95% this month   │
  │                                          │
  │ 📊 Recommendation: APPROVE               │
  │ Reason: Balance OK, no deadline conflict. │
  │ Note: Team will be at 60% capacity —     │
  │ consider no more leaves that week.        │
  │                                          │
  │ [Approve (Recommended)] [Reject]          │
  └──────────────────────────────────────────┘
```

**Backend logic:**
```
1. Get leave request details
2. Check: who else is on leave those dates?
3. Check: any high-priority tasks due that week for this employee?
4. Check: team capacity (how many available vs total)
5. Check: employee's attendance record
6. Send all data to Gemini → get risk analysis + recommendation
7. Return analysis to frontend
```

**Files to modify:**
- `server/src/controllers/hr.controller.js` — add `analyzeLeave` endpoint
- `server/src/services/gemini.service.js` — add `analyzeLeaveRequest` function
- `client/src/pages/HR.jsx` — show AI analysis panel in team leaves

**New endpoint:**
```
POST /api/hr/leave/:id/analyze
Response: { riskLevel, checks[], recommendation, reason }
```

---

### Feature 4: Daily Reports

**Where:** Reports page + 7 PM cron job

**Automation Mode (Current — No Change):**
```
7 PM cron fires:
  → Collect all employee EOD submissions
  → Gemini summarizes text (basic summary)
  → Email HTML report to managers
  → Just a summary — no insights, no alerts
```

**AI Mode (New):**
```
7 PM cron fires:
  → Collect all EOD submissions
  → ALSO collect: task completion data, attendance, overdue tasks
  → Send EVERYTHING to Gemini with enhanced prompt:
  
  "Analyze today's team performance:
   EOD submissions: [data]
   Tasks completed: [data]
   Tasks overdue: [data]
   Attendance: [data]
   
   Generate:
   1. Executive summary (3 bullet points)
   2. Highlights (what went well)
   3. Blockers (what's stuck and why)
   4. Risk alerts (who might miss deadlines tomorrow)
   5. Recommendations (specific actions for manager)"

  → Result:
  HIGHLIGHTS:
  - Payment API integration completed (critical path done)
  - 14/18 tasks completed today (78% rate)
  
  BLOCKERS:
  - Dashboard redesign stuck — Amit waiting for design assets
  - Test environment down since 2 PM
  
  RISK ALERTS:
  ⚠️ Priya has 3 tasks due tomorrow but completed 0 today (sick?)
  ⚠️ Project X deadline is Friday — 4 tasks still pending
  
  RECOMMENDATIONS:
  1. Check on Priya — unusual inactivity
  2. Assign backup for test environment fix
  3. Prioritize Project X tasks tomorrow
```

**Files to modify:**
- `server/src/workers/report.worker.js` — enhanced AI prompt when AI mode
- `server/src/services/gemini.service.js` — add `generateSmartReport` function
- `client/src/pages/Reports.jsx` — show AI insights section in report view

---

### Feature 5: Dashboard Morning Briefing

**Where:** Dashboard page (top section, after stats)

**Automation Mode (Current — No Change):**
```
Dashboard shows:
  → Stat cards: Tasks, Done, Overdue, Meetings, Leaves
  → AI Insights widget: basic completion rate + hardcoded tip
  → Charts: weekly task trend
  → No proactive intelligence
```

**AI Mode (New):**
```
Dashboard shows stat cards (same) + AI Morning Briefing:

┌──────────────────────────────────────────────┐
│ 🤖 AI Morning Briefing                      │
│                                              │
│ Good morning! Here's what needs attention:   │
│                                              │
│ 1. 🔴 URGENT: 3 tasks overdue from yesterday│
│    → Rahul's API task (24hrs late)           │
│    → Suggest: Reassign or check with Rahul   │
│                                              │
│ 2. ⚠️ Priya has 0 tasks assigned             │
│    → She completed all tasks yesterday       │
│    → Suggest: Assign new work                │
│                                              │
│ 3. 📅 2 PM meeting with client               │
│    → Pending action item from last meeting:  │
│    → "Cost analysis" — Priya hasn't submitted│
│    → Suggest: Follow up before meeting       │
│                                              │
│ 4. 📊 Team productivity: 72% this week       │
│    → Down from 85% last week                 │
│    → Possible cause: 2 employees on leave    │
│                                              │
│ [Dismiss] [Create task from #1] [Message Priya]│
└──────────────────────────────────────────────┘
```

**Backend logic:**
```
1. Collect: overdue tasks, unassigned employees, today's meetings,
   pending action items, weekly productivity trend, leave data
2. Send to Gemini: "Generate a morning briefing for this manager.
   Highlight top 3-5 things needing attention with specific actions."
3. Return structured briefing
```

**Files to modify:**
- `server/src/controllers/analytics.controller.js` — add `getMorningBriefing` endpoint
- `server/src/services/gemini.service.js` — add `generateMorningBriefing` function
- `client/src/components/widgets/AIInsightsWidget.jsx` — upgrade to show briefing in AI mode
- `client/src/pages/Dashboard.jsx` — integrate briefing widget

**New endpoint:**
```
GET /api/analytics/morning-briefing
Response: { briefingItems[], productivityTrend, urgentCount }
```

---

### Feature 6: Meeting Intelligence

**Where:** Meetings page → individual meeting view

**Automation Mode (Current — No Change):**
```
Meeting ends:
  → Participants manually add notes
  → Click "AI Summary" → Gemini summarizes notes
  → Just a text summary, nothing more
```

**AI Mode (New):**
```
BEFORE meeting — AI prepares:
  → "Pre-meeting brief:
     Last meeting: 3 action items (2 done, 1 pending)
     Pending: Priya's cost analysis (due Friday)
     Attendees completed 45 tasks since last meeting
     Suggestion: Discuss overdue Project X"

AFTER meeting — AI analyzes notes:
  → Extracts: Decisions, Action Items, Deadlines
  → For each action item:
     "Auto-create task? [Yes] [No]"
  → Detects follow-ups:
     "Schedule follow-up meeting in 1 week? [Yes] [No]"
  → Compares with previous meeting:
     "3 action items from last meeting:
      ✅ Budget proposal — Done
      ✅ Client demo — Done
      ❌ Cost analysis — Still pending (2 weeks now)"
```

**Files to modify:**
- `server/src/controllers/meetings.controller.js` — add `getPreMeetingBrief`, `smartSummary` endpoints
- `server/src/services/gemini.service.js` — add `generatePreMeetingBrief`, `extractActionItems` functions
- `client/src/pages/Meetings.jsx` — show pre-meeting brief, action item extraction UI

**New endpoints:**
```
GET  /api/meetings/:id/pre-brief
POST /api/meetings/:id/smart-summary
POST /api/meetings/:id/create-tasks-from-actions
```

---

### Feature 7: Message Drafting

**Where:** Messages page → compose message

**Automation Mode (Current — No Change):**
```
Manager types message manually
  → Selects recipients, channel, schedule time
  → Types full message text
  → Sends
```

**AI Mode (New):**
```
Manager switches to AI Draft mode
  → Types rough notes: "tell team meeting thursday, budget review added"
  → Clicks "AI Draft"
  → AI generates professional message:
     "Dear Team,
      I'd like to inform you that our upcoming meeting has been
      rescheduled to Thursday. The agenda has been updated to
      include a budget review session.
      Please confirm your availability.
      Best regards"
  → Manager can: [Use This] [Edit] [Regenerate] [Back to Manual]
```

**Files to modify:**
- `server/src/controllers/messages.controller.js` — add AI draft option
- `client/src/pages/Messages.jsx` — add toggle between manual compose and AI draft

**Existing endpoint (already works):**
```
POST /api/ai/draft-email — Already exists in ai.controller.js
Just need to integrate it into Messages page UI
```

---

## Frontend Implementation — Toggle Component

### Reusable ModeToggle Component

```
File: client/src/components/ui/ModeToggle.jsx

Props:
  - feature: string (e.g., 'taskAssignment')
  - onModeChange: (mode) => void
  - showLabel: boolean

Renders:
  ┌─────────────────────────────────┐
  │  ⚙ Automation  │  🤖 AI Mode   │
  └─────────────────────────────────┘
  
  - Reads current mode from user's aiPreferences
  - On click: updates local state + calls API to save preference
  - Highlighted tab shows active mode
```

### Settings Page — AI Preferences Section

```
File: client/src/pages/Settings.jsx (add section)

New section: "Intelligence Mode"

  Master Switch:
  ┌──────────────────────────────────────┐
  │ ⚙ All Automation  ○────● 🤖 All AI  │
  └──────────────────────────────────────┘

  Per-Feature Controls:
  ┌──────────────────────────────────────┐
  │ Task Assignment    [⚙] [🤖]         │
  │ Task Escalation    [⚙] [🤖]         │
  │ Leave Analysis     [⚙] [🤖]         │
  │ Daily Reports      [⚙] [🤖]         │
  │ Dashboard Briefing [⚙] [🤖]         │
  │ Meeting Summary    [⚙] [🤖]         │
  │ Message Drafting   [⚙] [🤖]         │
  └──────────────────────────────────────┘

  [Save Preferences]
```

---

## API Endpoints Summary (New)

| Endpoint | Method | Purpose | Used When |
|----------|--------|---------|-----------|
| `/api/users/ai-preferences` | PATCH | Update user's AI mode preferences | Settings page |
| `/api/users/ai-preferences` | GET | Get current preferences | App load |
| `/api/tasks/suggest-assignee` | POST | AI recommends best employee for task | Task creation (AI mode) |
| `/api/hr/leave/:id/analyze` | POST | AI analyzes leave request risk | Leave review (AI mode) |
| `/api/analytics/morning-briefing` | GET | AI generates morning briefing | Dashboard load (AI mode) |
| `/api/meetings/:id/pre-brief` | GET | AI generates pre-meeting brief | Meeting view (AI mode) |
| `/api/meetings/:id/smart-summary` | POST | AI extracts decisions + action items | After meeting (AI mode) |
| `/api/meetings/:id/create-tasks-from-actions` | POST | Create tasks from AI-extracted actions | After smart summary |
| `/api/ai/draft-email` | POST | AI drafts professional message | Messages page (AI mode) — already exists |

---

## Gemini Service — New Functions

```
File: server/src/services/gemini.service.js (add these)

1. suggestTaskAssignment(taskDetails, employees[])
   → Returns: { employee, reason, confidence, alternatives[] }

2. analyzeEscalation(task, employee, context)
   → Returns: { action: 'escalate'|'wait'|'reassign'|'extend', reason, details }

3. analyzeLeaveRequest(leave, teamData, taskData)
   → Returns: { riskLevel, checks[], recommendation, reason }

4. generateSmartReport(submissions[], taskData, attendanceData)
   → Returns: { summary, highlights[], blockers[], riskAlerts[], recommendations[] }

5. generateMorningBriefing(overdueTasks, unassignedEmployees, meetings, trends)
   → Returns: { briefingItems[], productivityTrend, urgentCount }

6. generatePreMeetingBrief(meeting, previousMeetingNotes, actionItems)
   → Returns: { previousActions[], pendingItems[], suggestedTopics[] }

7. extractActionItems(meetingNotes)
   → Returns: { decisions[], actionItems[], followUps[] }
```

---

## Implementation Order

```
Phase 1 — Foundation (Do First)
  ├── 1. Add aiPreferences to User model
  ├── 2. Create checkAIMode utility
  ├── 3. Create ModeToggle component
  ├── 4. Add AI Preferences section to Settings page
  └── 5. Create PATCH/GET /api/users/ai-preferences endpoints

Phase 2 — Quick Wins (Already Partially Built)
  ├── 6. Feature 7: Message Drafting (AI draft already exists, just add toggle)
  ├── 7. Feature 4: Daily Reports (enhance existing report worker prompt)
  └── 8. Feature 6: Meeting Summary (enhance existing summary)

Phase 3 — Core Intelligence
  ├── 9.  Feature 1: Smart Task Assignment (new endpoint + UI)
  ├── 10. Feature 3: Leave Analysis (new endpoint + UI)
  └── 11. Feature 5: Dashboard Morning Briefing (new widget)

Phase 4 — Advanced
  └── 12. Feature 2: Smart Escalation (modify deadline worker)
```

---

## How Decision Flow Works

```
User action triggered (e.g., task overdue, leave request, create task)
         │
         ▼
  Check user's aiPreferences for this feature
         │
         ├── MODE = "automation"
         │         │
         │         ▼
         │   Run existing fixed rules (NO CHANGE to current code)
         │   No Gemini API call
         │   Predictable, fast, free
         │
         └── MODE = "ai"
                   │
                   ▼
             Collect context data from database
                   │
                   ▼
             Send to Gemini with structured prompt
                   │
                   ▼
             Parse AI response
                   │
                   ├── For recommendations (task assign, leave, briefing):
                   │     → Show to user with [Accept] [Override] buttons
                   │     → User makes final decision
                   │
                   └── For autonomous actions (escalation, reports):
                         → AI decides and executes
                         → Log decision + reason in ActivityLog
                         → Can be reviewed in Admin audit trail
```

---

## Cost Control

```
AI MODE OFF (Automation):
  → Zero Gemini API calls
  → Completely free
  → Uses only existing cron + BullMQ rules

AI MODE ON:
  → Gemini API calls only for enabled features
  → Gemini 1.5 Flash = free tier: 15 requests/minute, 1500/day
  → Each feature uses 1 API call per action
  → Estimated usage for 10 employees + 2 managers:
     - Morning briefing: 2 calls/day (1 per manager)
     - Task suggestions: ~5 calls/day
     - Leave analysis: ~2 calls/day
     - Smart reports: 1 call/day
     - Meeting intelligence: ~3 calls/day
     ─────────────────────────────────
     Total: ~13 calls/day (well within free tier)

  → If API limit hit → auto-fallback to Automation mode
  → No paid API needed
```

---

## Unique Selling Point

```
"The only corporate AI agent that gives YOU the choice.

 Other tools force AI on everything — ours lets you decide.

 Want AI to handle task assignments? Enable it.
 Prefer manual control over leave approvals? Keep it manual.
 
 Every feature. Your choice. Your control."
```

---

## Files to Create (New)

| File | Purpose |
|------|---------|
| `server/src/utils/checkAIMode.js` | Helper to check user's AI preference |
| `client/src/components/ui/ModeToggle.jsx` | Reusable toggle component |

## Files to Modify (Existing)

| File | Change |
|------|--------|
| `server/src/models/User.js` | Add `aiPreferences` field |
| `server/src/controllers/tasks.controller.js` | Add `suggestAssignee` endpoint |
| `server/src/controllers/hr.controller.js` | Add `analyzeLeave` endpoint |
| `server/src/controllers/analytics.controller.js` | Add `getMorningBriefing` endpoint |
| `server/src/controllers/meetings.controller.js` | Add `getPreMeetingBrief`, `smartSummary` |
| `server/src/services/gemini.service.js` | Add 7 new AI functions |
| `server/src/workers/deadline.worker.js` | Add AI mode check before escalation |
| `server/src/workers/report.worker.js` | Enhanced prompt in AI mode |
| `server/src/routes/tasks.routes.js` | Add suggest-assignee route |
| `server/src/routes/hr.routes.js` | Add analyze route |
| `server/src/routes/analytics.routes.js` | Add morning-briefing route |
| `server/src/routes/meetings.routes.js` | Add pre-brief, smart-summary routes |
| `server/src/routes/user.routes.js` | Add ai-preferences routes |
| `client/src/pages/Settings.jsx` | Add AI Preferences section |
| `client/src/pages/Tasks.jsx` | Add AI suggest in create form |
| `client/src/pages/HR.jsx` | Add AI analysis panel in team leaves |
| `client/src/pages/Dashboard.jsx` | Upgrade insights widget for AI mode |
| `client/src/pages/Meetings.jsx` | Add pre-brief and smart summary UI |
| `client/src/pages/Messages.jsx` | Add AI draft toggle |
| `client/src/components/widgets/AIInsightsWidget.jsx` | Upgrade for morning briefing |
