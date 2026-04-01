require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
const Meeting = require('./models/Meeting');
const LeaveRequest = require('./models/LeaveRequest');
const Attendance = require('./models/Attendance');
const Report = require('./models/Report');
const Notification = require('./models/Notification');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ──── USERS ────
  let admin, manager, employees = [];

  const adminExists = await User.findOne({ email: 'admin@company.com' });
  if (!adminExists) {
    admin = await User.create({ name: 'Admin Boss', email: 'admin@company.com', password: 'admin123', role: 'admin', department: 'Management', phone: '+91-9999999999' });
    console.log('Admin created');
  } else { admin = adminExists; console.log('Admin exists'); }

  const managerExists = await User.findOne({ email: 'manager@company.com' });
  if (!managerExists) {
    manager = await User.create({ name: 'Rahul Manager', email: 'manager@company.com', password: 'manager123', role: 'manager', department: 'Engineering', phone: '+91-8888888888' });
    console.log('Manager created');
  } else { manager = managerExists; console.log('Manager exists'); }

  const empData = [
    { name: 'Priya Sharma', email: 'priya@company.com', department: 'Engineering' },
    { name: 'Amit Patel', email: 'amit@company.com', department: 'Engineering' },
    { name: 'Neha Gupta', email: 'neha@company.com', department: 'Design' },
  ];

  for (const emp of empData) {
    const exists = await User.findOne({ email: emp.email });
    if (!exists) {
      const u = await User.create({ ...emp, password: 'employee123', role: 'employee', managerId: manager._id });
      employees.push(u);
      console.log(`Employee created: ${emp.email}`);
    } else { employees.push(exists); }
  }

  // ──── TASKS (15 tasks with varied statuses) ────
  const existingTasks = await Task.countDocuments();
  if (existingTasks === 0) {
    const now = new Date();
    const daysAgo = (d) => new Date(now.getTime() - d * 86400000);
    const daysFromNow = (d) => new Date(now.getTime() + d * 86400000);

    const tasks = [
      { title: 'Fix payment gateway bug', description: 'Stripe webhook failing on subscriptions. Returns 500 on renewal events.', assignedTo: employees[0]._id, assignedBy: manager._id, priority: 'critical', status: 'done', dueDate: daysAgo(2), completedAt: daysAgo(1), createdAt: daysAgo(5) },
      { title: 'Design new onboarding flow', description: 'Create Figma mockups for the new user onboarding experience. Include 3 variations.', assignedTo: employees[2]._id, assignedBy: manager._id, priority: 'high', status: 'done', dueDate: daysAgo(1), completedAt: daysAgo(0.5), createdAt: daysAgo(4) },
      { title: 'API documentation update', description: 'Update API.md with the new analytics and HR endpoints. Include request/response examples.', assignedTo: employees[1]._id, assignedBy: manager._id, priority: 'medium', status: 'inprogress', dueDate: daysFromNow(2), createdAt: daysAgo(3) },
      { title: 'Implement dark mode toggle', description: 'Add theme switching support using CSS variables and Zustand store.', assignedTo: employees[0]._id, assignedBy: manager._id, priority: 'medium', status: 'inprogress', dueDate: daysFromNow(3), createdAt: daysAgo(2) },
      { title: 'Set up Redis for job queues', description: 'Configure Upstash Redis and enable BullMQ workers for message scheduling and deadline tracking.', assignedTo: employees[1]._id, assignedBy: admin._id, priority: 'high', status: 'pending', dueDate: daysFromNow(4), createdAt: daysAgo(1) },
      { title: 'Mobile app login screen', description: 'Build the React Native login screen matching web design. Include role selection.', assignedTo: employees[0]._id, assignedBy: manager._id, priority: 'medium', status: 'pending', dueDate: daysFromNow(5), createdAt: daysAgo(1) },
      { title: 'Database backup strategy', description: 'Document and implement MongoDB Atlas automated backup schedule.', assignedTo: employees[1]._id, assignedBy: admin._id, priority: 'low', status: 'pending', dueDate: daysFromNow(7), createdAt: now },
      { title: 'Write unit tests for auth', description: 'Add Jest tests for register, login, 2FA, and token refresh endpoints.', assignedTo: employees[0]._id, assignedBy: manager._id, priority: 'high', status: 'done', dueDate: daysAgo(3), completedAt: daysAgo(2), createdAt: daysAgo(6) },
      { title: 'Optimize dashboard queries', description: 'Dashboard loads slowly — add MongoDB indexes and reduce N+1 queries.', assignedTo: employees[1]._id, assignedBy: manager._id, priority: 'high', status: 'done', dueDate: daysAgo(4), completedAt: daysAgo(3), createdAt: daysAgo(7) },
      { title: 'Create landing page', description: 'Design and build a marketing/landing page showcasing all features before login.', assignedTo: employees[2]._id, assignedBy: manager._id, priority: 'medium', status: 'pending', dueDate: daysFromNow(6), createdAt: now },
      { title: 'Fix attendance clock-out bug', description: 'Clock-out button shows error when employee has not clocked in today.', assignedTo: employees[0]._id, assignedBy: manager._id, priority: 'high', status: 'overdue', dueDate: daysAgo(1), createdAt: daysAgo(3), escalationLevel: 1 },
      { title: 'Set up email templates', description: 'Create HTML email templates for task notifications, leave approvals, and weekly summaries.', assignedTo: employees[2]._id, assignedBy: manager._id, priority: 'low', status: 'done', dueDate: daysAgo(5), completedAt: daysAgo(4), createdAt: daysAgo(8) },
      { title: 'Integrate Slack notifications', description: 'Send task assignment and overdue alerts to the #engineering Slack channel.', assignedTo: employees[1]._id, assignedBy: admin._id, priority: 'medium', status: 'overdue', dueDate: daysAgo(2), createdAt: daysAgo(5), escalationLevel: 1 },
      { title: 'Performance review dashboard', description: 'Build analytics view showing per-employee task completion rates, attendance, and leave trends.', assignedTo: employees[2]._id, assignedBy: manager._id, priority: 'medium', status: 'inprogress', dueDate: daysFromNow(4), createdAt: daysAgo(2) },
      { title: 'Docker compose production config', description: 'Create production Docker Compose with proper env, health checks, and restart policies.', assignedTo: employees[1]._id, assignedBy: admin._id, priority: 'low', status: 'pending', dueDate: daysFromNow(10), createdAt: now },
    ];

    await Task.insertMany(tasks);
    console.log(`${tasks.length} tasks created`);
  } else { console.log(`Tasks exist (${existingTasks})`); }

  // ──── MEETINGS (6 meetings) ────
  const existingMeetings = await Meeting.countDocuments();
  if (existingMeetings === 0) {
    const now = new Date();
    const today9am = new Date(now); today9am.setHours(9, 0, 0, 0);
    const today2pm = new Date(now); today2pm.setHours(14, 0, 0, 0);
    const today4pm = new Date(now); today4pm.setHours(16, 0, 0, 0);
    const daysAgo = (d) => new Date(now.getTime() - d * 86400000);
    const daysFromNow = (d) => new Date(now.getTime() + d * 86400000);

    const meetings = [
      { title: 'Daily Standup', organiser: manager._id, attendees: employees.map(e => e._id), scheduledAt: today9am, duration: 15, agenda: 'Quick status updates from each team member', status: 'scheduled' },
      { title: 'Sprint Planning', organiser: manager._id, attendees: [admin._id, ...employees.map(e => e._id)], scheduledAt: today2pm, duration: 60, agenda: 'Plan next sprint — prioritize backlog items, assign tasks', status: 'scheduled' },
      { title: 'Design Review', organiser: manager._id, attendees: [employees[2]._id, employees[0]._id], scheduledAt: today4pm, duration: 30, agenda: 'Review onboarding flow mockups', status: 'scheduled' },
      { title: 'Weekly Retrospective', organiser: manager._id, attendees: employees.map(e => e._id), scheduledAt: daysAgo(2), duration: 45, agenda: 'What went well, what to improve', status: 'completed', notes: [{ userId: manager._id, text: 'Team agreed to implement code review checklist. Action: Priya to draft the checklist by Friday.' }] },
      { title: 'Client Demo', organiser: admin._id, attendees: [manager._id, employees[0]._id], scheduledAt: daysFromNow(3), duration: 60, agenda: 'Demo the AI features and task management to the client', status: 'scheduled' },
      { title: 'Architecture Discussion', organiser: admin._id, attendees: [manager._id, employees[1]._id], scheduledAt: daysFromNow(5), duration: 90, agenda: 'Discuss microservices migration plan and Redis integration', status: 'scheduled' },
    ];

    await Meeting.insertMany(meetings);
    console.log(`${meetings.length} meetings created`);
  } else { console.log(`Meetings exist (${existingMeetings})`); }

  // ──── LEAVE REQUESTS (4 leaves) ────
  const existingLeaves = await LeaveRequest.countDocuments();
  if (existingLeaves === 0) {
    const now = new Date();
    const daysFromNow = (d) => new Date(now.getTime() + d * 86400000);
    const daysAgo = (d) => new Date(now.getTime() - d * 86400000);

    const leaves = [
      { employee: employees[0]._id, type: 'casual', fromDate: daysFromNow(5), toDate: daysFromNow(6), reason: 'Family function — wedding ceremony', status: 'pending', appliedAt: now },
      { employee: employees[1]._id, type: 'sick', fromDate: daysAgo(3), toDate: daysAgo(2), reason: 'Fever and headache', status: 'approved', approvedBy: manager._id, appliedAt: daysAgo(4) },
      { employee: employees[2]._id, type: 'annual', fromDate: daysFromNow(10), toDate: daysFromNow(14), reason: 'Family vacation to Goa', status: 'pending', appliedAt: daysAgo(1) },
      { employee: employees[0]._id, type: 'casual', fromDate: daysAgo(10), toDate: daysAgo(10), reason: 'Personal work — bank visit', status: 'rejected', approvedBy: manager._id, rejectionReason: 'Critical sprint deadline', appliedAt: daysAgo(12) },
    ];

    await LeaveRequest.insertMany(leaves);
    console.log(`${leaves.length} leave requests created`);
  } else { console.log(`Leaves exist (${existingLeaves})`); }

  // ──── ATTENDANCE (5 days for each employee) ────
  const existingAttendance = await Attendance.countDocuments();
  if (existingAttendance === 0) {
    const records = [];
    for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
      const date = new Date(); date.setDate(date.getDate() - dayOffset); date.setHours(0, 0, 0, 0);
      for (const emp of employees) {
        const clockIn = new Date(date); clockIn.setHours(9 + Math.floor(Math.random() * 1), Math.floor(Math.random() * 30), 0);
        const clockOut = new Date(date); clockOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);
        const hours = ((clockOut - clockIn) / 3600000).toFixed(1);
        records.push({ userId: emp._id, date, clockIn, clockOut, hoursWorked: parseFloat(hours), status: 'present' });
      }
    }
    await Attendance.insertMany(records);
    console.log(`${records.length} attendance records created`);
  } else { console.log(`Attendance exists (${existingAttendance})`); }

  // ──── REPORTS (2 reports) ────
  const existingReports = await Report.countDocuments();
  if (existingReports === 0) {
    const now = new Date();
    const daysAgo = (d) => new Date(now.getTime() - d * 86400000);

    const reports = [
      {
        date: daysAgo(1), type: 'daily', tasksCompleted: 4,
        aiSummary: 'Team completed 4 tasks yesterday including the critical payment gateway fix. 2 tasks remain overdue in the notification module. Priya was the top performer with 2 completions.',
        reportHtml: '<h3>Daily Summary</h3><ul><li><strong>Tasks Completed:</strong> 4</li><li><strong>Overdue:</strong> 2</li><li><strong>Top Performer:</strong> Priya Sharma</li></ul><h4>Highlights</h4><ul><li>Payment gateway bug fixed (Priya)</li><li>Dashboard queries optimized (Amit)</li></ul><h4>Blockers</h4><ul><li>Slack integration delayed — waiting for bot token</li></ul>',
        employeeUpdates: [
          { userId: employees[0]._id, update: 'Fixed payment gateway webhook and wrote 4 test cases for auth module.' },
          { userId: employees[1]._id, update: 'Optimized MongoDB queries for dashboard. Working on API documentation.' },
          { userId: employees[2]._id, update: 'Completed onboarding flow mockups. Starting email template designs.' },
        ],
        sentToManager: true,
      },
      {
        date: daysAgo(7), type: 'weekly', tasksCompleted: 12,
        aiSummary: 'Weekly: 12 tasks completed, 5 new tasks created, 2 still overdue. Team velocity improved 15% compared to last week. Design team delivered all mockups on time.',
        reportHtml: '<h3>Weekly Summary</h3><ul><li><strong>Tasks Created:</strong> 5</li><li><strong>Tasks Completed:</strong> 12</li><li><strong>Overdue:</strong> 2</li><li><strong>Team Velocity:</strong> +15%</li></ul>',
        sentToManager: true,
      },
    ];

    await Report.insertMany(reports);
    console.log(`${reports.length} reports created`);
  } else { console.log(`Reports exist (${existingReports})`); }

  // ──── NOTIFICATIONS (8 notifications for admin) ────
  const existingNotifs = await Notification.countDocuments();
  if (existingNotifs === 0) {
    const now = new Date();
    const minsAgo = (m) => new Date(now.getTime() - m * 60000);

    const notifs = [
      { userId: admin._id, type: 'task_completed', title: 'Task Completed', body: 'Priya completed "Fix payment gateway bug"', read: false, createdAt: minsAgo(15) },
      { userId: admin._id, type: 'task_overdue', title: 'Task Overdue', body: '"Fix attendance clock-out bug" is overdue by 1 day', read: false, createdAt: minsAgo(60) },
      { userId: admin._id, type: 'leave_applied', title: 'Leave Request', body: 'Priya Sharma applied for 2 days casual leave', read: false, createdAt: minsAgo(120) },
      { userId: admin._id, type: 'meeting_created', title: 'Meeting Scheduled', body: 'Sprint Planning at 2:00 PM today', read: true, createdAt: minsAgo(180) },
      { userId: admin._id, type: 'task_assigned', title: 'Task Assigned', body: 'You assigned "Set up Redis" to Amit Patel', read: true, createdAt: minsAgo(300) },
      { userId: manager._id, type: 'leave_applied', title: 'Leave Request', body: 'Neha Gupta applied for 5 days annual leave', read: false, createdAt: minsAgo(90) },
      { userId: manager._id, type: 'task_completed', title: 'Task Completed', body: 'Neha completed "Design new onboarding flow"', read: false, createdAt: minsAgo(30) },
      { userId: employees[0]._id, type: 'task_assigned', title: 'New Task', body: 'You have been assigned "Mobile app login screen"', read: false, createdAt: minsAgo(45) },
    ];

    await Notification.insertMany(notifs);
    console.log(`${notifs.length} notifications created`);
  } else { console.log(`Notifications exist (${existingNotifs})`); }

  console.log('\n--- Login Credentials ---');
  console.log('Admin:    admin@company.com    / admin123');
  console.log('Manager:  manager@company.com  / manager123');
  console.log('Employee: priya@company.com    / employee123');
  console.log('Employee: amit@company.com     / employee123');
  console.log('Employee: neha@company.com     / employee123');

  await mongoose.disconnect();
  console.log('\nDone!');
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
