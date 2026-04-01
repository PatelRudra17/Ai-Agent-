# API Reference

**Base URL:** `http://localhost:4000/api`
**Auth:** Bearer token in `Authorization` header (unless marked Public)

---

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | No | Register new user |
| POST | /auth/login | No | Login, returns JWT + refresh token |
| POST | /auth/refresh | No | Refresh access token |
| POST | /auth/logout | Yes | Logout, blacklists token |
| POST | /auth/change-password | Yes | Change password |
| GET | /auth/me | Yes | Get current user profile |
| POST | /auth/2fa/setup | Yes | Generate 2FA QR code |
| POST | /auth/2fa/verify | Yes | Verify and enable 2FA |
| POST | /auth/2fa/validate | No | Validate 2FA code during login |
| POST | /auth/2fa/disable | Yes | Disable 2FA |

### POST /auth/register
```json
Request: { "name": "John", "email": "john@test.com", "password": "Pass123", "role": "employee" }
Response: { "user": {...}, "accessToken": "...", "refreshToken": "..." }
```

### POST /auth/login
```json
Request: { "email": "john@test.com", "password": "Pass123" }
Response: { "user": {...}, "accessToken": "...", "refreshToken": "..." }
// If 2FA enabled: { "requires2FA": true, "tempToken": "..." }
```

---

## Users

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /users | Yes | Admin/Manager | List users with search/pagination |
| GET | /users/:id | Yes | Admin/Manager | Get user details |
| PATCH | /users/:id | Yes | Self/Admin | Update profile |
| DELETE | /users/:id | Yes | Admin | Deactivate user |

---

## Tasks

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /tasks | Yes | Admin/Manager | Create and assign task |
| POST | /tasks/suggest-assignee | Yes | Admin/Manager | AI suggests best employee |
| GET | /tasks/my | Yes | All | Employee's own task queue |
| GET | /tasks/team | Yes | Admin/Manager | All team tasks (paginated) |
| GET | /tasks/dashboard | Yes | Admin/Manager | Task stats (counts by status) |
| GET | /tasks/overdue | Yes | Admin/Manager | All overdue tasks |
| GET | /tasks/export | Yes | Admin/Manager | Export tasks as CSV |
| GET | /tasks/:id | Yes | All | Get single task detail |
| PATCH | /tasks/:id/start | Yes | Employee | Mark task In Progress |
| PATCH | /tasks/:id/complete | Yes | Employee | Complete task (auto-starts next) |
| POST | /tasks/:id/comment | Yes | All | Add comment to task |

### POST /tasks
```json
Request: { "title": "Fix bug", "description": "...", "assignedTo": "userId", "priority": "high", "dueDate": "2026-04-10T10:00:00Z" }
Response: { "task": {...} }
```

---

## Calls

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /calls/schedule | Yes | Admin/Manager | Schedule a call |
| GET | /calls | Yes | Admin/Manager | List all calls |
| GET | /calls/:id | Yes | Admin/Manager | Get call details |
| PATCH | /calls/:id/cancel | Yes | Admin/Manager | Cancel pending call |
| POST | /calls/webhook/status | Public | — | Twilio webhook callback |

---

## Messages

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /messages/schedule | Yes | Admin/Manager | Schedule future message |
| GET | /messages | Yes | Admin/Manager | List all messages |
| DELETE | /messages/:id | Yes | Admin/Manager | Cancel pending message |
| POST | /messages/broadcast | Yes | Admin | Send to all employees now |

---

## Meetings

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /meetings/create | Yes | Admin/Manager | Create meeting |
| GET | /meetings | Yes | All | List meetings |
| PATCH | /meetings/:id/reschedule | Yes | Admin/Manager | Reschedule meeting |
| DELETE | /meetings/:id | Yes | Admin/Manager | Cancel meeting |
| POST | /meetings/:id/notes | Yes | All | Add meeting notes |
| GET | /meetings/:id/summary | Yes | All | Get AI summary |

---

## Reports

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /reports/generate | Yes | Admin/Manager | Generate AI report |
| GET | /reports | Yes | Admin/Manager | List all reports |
| GET | /reports/:id | Yes | Admin/Manager | Get report details |
| POST | /reports/eod-submit | Yes | All | Submit EOD update |

---

## AI

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /ai/chat | Yes | All | Send message (streaming via Socket.io) |
| GET | /ai/conversations | Yes | All | List conversations |
| GET | /ai/conversations/:id | Yes | All | Get conversation |
| DELETE | /ai/conversations/:id | Yes | All | Delete conversation |
| POST | /ai/draft-email | Yes | All | Draft professional email |

### POST /ai/chat
```json
Request: { "message": "What are my pending tasks?", "conversationId": "optional" }
Response: { "message": "...", "conversationId": "..." }
// Also streams via Socket.io: 'ai_stream' events
```

---

## Documents

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /documents/upload | Yes | All | Upload PDF/DOCX/TXT/CSV |
| GET | /documents | Yes | All | List user's documents |
| POST | /documents/:id/ask | Yes | All | Ask AI about document |
| GET | /documents/:id/summary | Yes | All | Get AI document summary |

---

## HR

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /hr/leave/apply | Yes | Employee | Apply for leave |
| GET | /hr/leave/my | Yes | Employee | My leave history |
| GET | /hr/leave/team | Yes | Admin/Manager | Team leave requests |
| PATCH | /hr/leave/:id/approve | Yes | Admin/Manager | Approve leave |
| PATCH | /hr/leave/:id/reject | Yes | Admin/Manager | Reject leave |
| GET | /hr/leave/balance/:userId | Yes | All | Get leave balance |
| GET | /hr/salary/:userId/:month | Yes | All | Get salary slip PDF |
| POST | /hr/attendance/clock-in | Yes | Employee | Clock in |
| POST | /hr/attendance/clock-out | Yes | Employee | Clock out |
| GET | /hr/attendance/:userId | Yes | Admin/Manager | Attendance log |

---

## Analytics

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /analytics/tasks | Yes | Admin/Manager | Task completion stats |
| GET | /analytics/calls | Yes | Admin/Manager | Call volume stats |
| GET | /analytics/team | Yes | Admin/Manager | Team productivity |
| GET | /analytics/employee/:userId | Yes | Admin/Manager | Individual analytics |

---

## Admin

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /admin/stats | Yes | Admin | System statistics |
| GET | /admin/users | Yes | Admin | All users |
| PATCH | /admin/users/:id/role | Yes | Admin | Change user role |
| PATCH | /admin/users/:id/activate | Yes | Admin | Activate user |
| PATCH | /admin/users/:id/deactivate | Yes | Admin | Deactivate user |
| GET | /admin/audit-log | Yes | Admin | Activity audit log |
| GET | /admin/audit-log/export | Yes | Admin | Export audit log CSV |
| POST | /admin/cleanup | Yes | Admin | Data cleanup |
| GET | /admin/health | Yes | Admin | System health check |

---

## Notifications

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /notifications | Yes | All | List notifications |
| PATCH | /notifications/:id/read | Yes | All | Mark as read |
| DELETE | /notifications/:id | Yes | All | Delete notification |

---

## Search

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | /search?q=keyword | Yes | All | Search across users, tasks, meetings, documents |

---

## Health Check

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/health | No | Server status, MongoDB status, uptime, memory |
