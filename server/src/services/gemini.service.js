const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;
let model;

const getModel = () => {
  if (model) return model;
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  return model;
};

const SYSTEM_PROMPT = `You are a helpful corporate AI assistant for a company management platform.
You help managers and employees with tasks, scheduling, drafting emails, summarizing reports, and answering questions.

Language Rules:
- Detect the language of the user's message.
- If Hindi → respond in Hindi (Devanagari script).
- If Gujarati → respond in Gujarati script.
- If English → respond in English.
- Always respond in the SAME language as the user.

Be professional, concise, and helpful. When drafting emails or messages, use a professional corporate tone.`;

// Chat with conversation history
const chat = async (messages, systemPrompt) => {
  const m = getModel();
  const prompt = systemPrompt || SYSTEM_PROMPT;

  // Build conversation for Gemini
  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const chatSession = m.startChat({
    history: [
      { role: 'user', parts: [{ text: `System instructions: ${prompt}` }] },
      { role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] },
      ...history,
    ],
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chatSession.sendMessage(lastMessage.content);
  return result.response.text();
};

// Chat with streaming
const chatStream = async (messages, systemPrompt) => {
  const m = getModel();
  const prompt = systemPrompt || SYSTEM_PROMPT;

  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const chatSession = m.startChat({
    history: [
      { role: 'user', parts: [{ text: `System instructions: ${prompt}` }] },
      { role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] },
      ...history,
    ],
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chatSession.sendMessageStream(lastMessage.content);
  return result.stream;
};

// Simple text generation (for summaries, drafts, etc.)
const generate = async (prompt) => {
  const m = getModel();
  const result = await m.generateContent(prompt);
  return result.response.text();
};

// Draft professional email
const draftEmail = async (roughNotes, language = 'en') => {
  const langInstruction = language === 'hi' ? 'Write in Hindi.' : language === 'gu' ? 'Write in Gujarati.' : 'Write in English.';
  const prompt = `Convert these rough notes into a professional corporate email. ${langInstruction}
Include: Subject line, proper greeting, body, and sign-off.
Format the output as:
Subject: ...
---
[email body]

Rough notes: ${roughNotes}`;

  return generate(prompt);
};

// Summarize text (for reports, meetings, documents)
const summarize = async (text, context = '') => {
  const prompt = `Summarize the following ${context} concisely. Highlight key points, decisions, and action items if any:\n\n${text}`;
  return generate(prompt);
};

// Answer question about a document
const askAboutDocument = async (documentText, question) => {
  const prompt = `Based on the following document content, answer the user's question.
If the answer is not in the document, say so clearly.

Document:
${documentText}

Question: ${question}`;

  return generate(prompt);
};

// Triage email importance
const triageEmail = async (emailContent) => {
  const prompt = `Rate the importance of this email from 1-10 and provide a one-line summary.
Format: Score: X/10 | Summary: ...

Email:
${emailContent}`;

  return generate(prompt);
};

// ==========================================
// AI MODE FUNCTIONS (Plan 6 — Dual Intelligence)
// ==========================================

// Feature 1: Suggest best employee for a task
const suggestTaskAssignment = async (taskDetails, employees) => {
  const employeeList = employees.map((e) =>
    `- ${e.name} (${e.department || 'N/A'}): ${e.pendingTasks} pending tasks, ${e.completedRecent} completed recently, avg ${e.avgCompletionHours || 'N/A'}h completion time`
  ).join('\n');

  const prompt = `You are an AI assistant for corporate task management.
A manager wants to assign a new task. Suggest the BEST employee and explain why.

TASK:
Title: ${taskDetails.title}
Description: ${taskDetails.description || 'N/A'}
Priority: ${taskDetails.priority || 'medium'}
Due Date: ${taskDetails.dueDate || 'No deadline'}

AVAILABLE EMPLOYEES:
${employeeList}

Respond in this exact JSON format (no markdown, no code blocks):
{"suggestedEmployee":"employee name","reason":"1-2 sentence reason","confidence":"high/medium/low","alternatives":[{"name":"employee name","reason":"short reason"}]}`;

  const result = await generate(prompt);
  try {
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { suggestedEmployee: employees[0]?.name || '', reason: result, confidence: 'low', alternatives: [] };
  }
};

// Feature 2: Smart escalation — decide action for overdue task
const analyzeEscalation = async (taskData, employeeData, context) => {
  const prompt = `You are an AI assistant managing task escalations in a corporate environment.
A task is overdue. Analyze the context and decide the best action.

TASK:
Title: ${taskData.title}
Priority: ${taskData.priority}
Due Date: ${taskData.dueDate}
Hours Overdue: ${context.overdueHours}
Current Escalation Level: ${taskData.escalationLevel}

EMPLOYEE:
Name: ${employeeData.name}
Is Active Today: ${context.isActiveToday ? 'Yes' : 'No'}
Last Activity: ${context.lastActivity || 'Unknown'}
Historical Avg Completion: ${context.avgCompletionHours || 'Unknown'}h
Current Pending Tasks: ${context.pendingTaskCount}

TEAM CONTEXT:
Team Members On Leave: ${context.teamOnLeave}
Team Workload: ${context.teamWorkload || 'Normal'}

Decide ONE action. Respond in this exact JSON format (no markdown, no code blocks):
{"action":"escalate|wait|reassign|extend","reason":"1-2 sentence explanation","waitHours":0,"reassignTo":"name or empty"}`;

  const result = await generate(prompt);
  try {
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { action: 'escalate', reason: 'AI analysis unavailable, using default escalation.', waitHours: 0 };
  }
};

// Feature 3: Analyze leave request risk
const analyzeLeaveRequest = async (leaveData, teamData) => {
  const prompt = `You are an AI assistant helping managers review leave requests.
Analyze the risk and provide a recommendation.

LEAVE REQUEST:
Employee: ${leaveData.employeeName}
Type: ${leaveData.type}
From: ${leaveData.fromDate}
To: ${leaveData.toDate}
Days: ${leaveData.days}
Reason: ${leaveData.reason}

EMPLOYEE DATA:
Leave Balance (${leaveData.type}): ${leaveData.balanceRemaining} days remaining
Attendance Rate This Month: ${leaveData.attendanceRate}%
Pending Tasks: ${leaveData.pendingTasks}

TEAM DATA:
Team Size: ${teamData.teamSize}
Already On Leave Those Dates: ${teamData.othersOnLeave.join(', ') || 'None'}
Team Capacity If Approved: ${teamData.capacityPercent}%
High Priority Tasks Due That Week: ${teamData.criticalTasks}

Respond in this exact JSON format (no markdown, no code blocks):
{"riskLevel":"low|medium|high","checks":[{"label":"description","status":"ok|warning|risk"}],"recommendation":"approve|reject|conditional","reason":"1-2 sentence explanation"}`;

  const result = await generate(prompt);
  try {
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { riskLevel: 'low', checks: [], recommendation: 'approve', reason: result };
  }
};

// Feature 4: Smart daily report with insights
const generateSmartReport = async (submissions, taskData, attendanceData) => {
  const prompt = `You are an AI assistant generating a daily team report with insights.

EOD SUBMISSIONS:
${submissions.map((s) => `- ${s.name} (${s.department || 'N/A'}): ${s.update}`).join('\n') || 'No submissions yet'}

TASK DATA:
Tasks Completed Today: ${taskData.completed}
Tasks Created Today: ${taskData.created}
Currently Overdue: ${taskData.overdue}
Total Active Tasks: ${taskData.active}

ATTENDANCE:
Employees Present: ${attendanceData.present}/${attendanceData.total}
On Leave: ${attendanceData.onLeave}
Not Clocked In: ${attendanceData.notClockedIn}

Generate a smart report. Respond in this exact JSON format (no markdown, no code blocks):
{"summary":"2-3 sentence executive summary","highlights":["point 1","point 2"],"blockers":["blocker 1"],"riskAlerts":["alert 1"],"recommendations":["action 1","action 2"]}`;

  const result = await generate(prompt);
  try {
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { summary: result, highlights: [], blockers: [], riskAlerts: [], recommendations: [] };
  }
};

// Feature 5: Morning briefing for managers
const generateMorningBriefing = async (data) => {
  const prompt = `You are an AI assistant generating a morning briefing for a manager.

TODAY'S DATA:
Overdue Tasks: ${data.overdueTasks.map((t) => `"${t.title}" assigned to ${t.assignee} (${t.hoursOverdue}h overdue)`).join(', ') || 'None'}
Employees With No Tasks: ${data.unassignedEmployees.join(', ') || 'None'}
Today's Meetings: ${data.meetings.map((m) => `"${m.title}" at ${m.time}`).join(', ') || 'None'}
Pending Leave Requests: ${data.pendingLeaves}
Team Capacity: ${data.teamCapacity}%
This Week Task Completion Rate: ${data.weeklyCompletionRate}%
Last Week Completion Rate: ${data.lastWeekRate}%

Generate 3-5 actionable briefing items. Respond in this exact JSON format (no markdown, no code blocks):
{"items":[{"priority":"urgent|warning|info","title":"short title","detail":"1 sentence detail","action":"suggested action"}],"productivityTrend":"up|down|stable","summary":"1 sentence overall summary"}`;

  const result = await generate(prompt);
  try {
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { items: [{ priority: 'info', title: 'Briefing', detail: result, action: '' }], productivityTrend: 'stable', summary: result };
  }
};

// Feature 6: Pre-meeting brief
const generatePreMeetingBrief = async (meetingData, previousData) => {
  const prompt = `You are an AI assistant preparing a pre-meeting brief.

UPCOMING MEETING:
Title: ${meetingData.title}
Agenda: ${meetingData.agenda || 'No agenda set'}
Attendees: ${meetingData.attendees.join(', ')}
Time: ${meetingData.scheduledAt}

PREVIOUS MEETING (same title/group):
${previousData.hadPrevious ? `Date: ${previousData.date}
Action Items: ${previousData.actionItems.map((a) => `- ${a.text} (${a.status})`).join('\n') || 'None'}
Key Decisions: ${previousData.decisions || 'None recorded'}` : 'No previous meeting found'}

TEAM ACTIVITY SINCE LAST MEETING:
Tasks Completed: ${previousData.tasksSinceLast || 0}
New Tasks Created: ${previousData.tasksCreatedSinceLast || 0}

Generate a pre-meeting brief. Respond in this exact JSON format (no markdown, no code blocks):
{"pendingActions":[{"item":"description","owner":"person","status":"done|pending|overdue"}],"suggestedTopics":["topic 1","topic 2"],"teamProgress":"1 sentence summary","preparationNotes":"1-2 sentences"}`;

  const result = await generate(prompt);
  try {
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { pendingActions: [], suggestedTopics: [], teamProgress: result, preparationNotes: '' };
  }
};

// Feature 6b: Extract action items from meeting notes
const extractActionItems = async (meetingTitle, notesText) => {
  const prompt = `You are an AI assistant extracting structured data from meeting notes.

MEETING: ${meetingTitle}

NOTES:
${notesText}

Extract decisions, action items, and follow-ups. Respond in this exact JSON format (no markdown, no code blocks):
{"decisions":["decision 1","decision 2"],"actionItems":[{"task":"task description","owner":"person name or Unknown","deadline":"date or ASAP or N/A"}],"followUps":["follow up 1"]}`;

  const result = await generate(prompt);
  try {
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { decisions: [], actionItems: [], followUps: [result] };
  }
};

module.exports = {
  chat,
  chatStream,
  generate,
  draftEmail,
  summarize,
  askAboutDocument,
  triageEmail,
  suggestTaskAssignment,
  analyzeEscalation,
  analyzeLeaveRequest,
  generateSmartReport,
  generateMorningBriefing,
  generatePreMeetingBrief,
  extractActionItems,
  SYSTEM_PROMPT,
};
