const cron = require('node-cron');
const Task = require('../models/Task');
const Report = require('../models/Report');
const User = require('../models/User');
const { sendEmail, wrapHtml } = require('../services/email.service');

const startWeeklySummaryCron = () => {
  // Every Friday at 7:30pm — Generate weekly summary
  cron.schedule('30 19 * * 5', async () => {
    console.log('Generating weekly summary');
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);

      const [tasksCompleted, tasksCreated, reportsCount] = await Promise.all([
        Task.countDocuments({ completedAt: { $gte: weekStart }, status: 'done' }),
        Task.countDocuments({ createdAt: { $gte: weekStart } }),
        Report.countDocuments({ date: { $gte: weekStart }, type: 'daily' }),
      ]);

      const overdue = await Task.countDocuments({
        dueDate: { $lt: now },
        status: { $in: ['pending', 'inprogress'] },
      });

      const report = await Report.create({
        date: now,
        type: 'weekly',
        tasksCompleted,
        aiSummary: `Weekly: ${tasksCompleted} tasks completed, ${tasksCreated} created, ${overdue} still overdue.`,
        reportHtml: `
          <h2>Weekly Summary — ${weekStart.toLocaleDateString()} to ${now.toLocaleDateString()}</h2>
          <ul>
            <li><strong>Tasks Created:</strong> ${tasksCreated}</li>
            <li><strong>Tasks Completed:</strong> ${tasksCompleted}</li>
            <li><strong>Overdue Tasks:</strong> ${overdue}</li>
            <li><strong>Daily Reports Filed:</strong> ${reportsCount}</li>
          </ul>`,
      });

      // Email to admins and managers
      const recipients = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true });
      for (const r of recipients) {
        try {
          await sendEmail({
            to: r.email,
            subject: `Weekly Summary — ${weekStart.toLocaleDateString()} to ${now.toLocaleDateString()}`,
            text: report.aiSummary,
            html: wrapHtml('Weekly Summary', report.reportHtml),
          });
        } catch {}
      }

      report.sentToManager = true;
      await report.save();
      console.log('Weekly summary generated and emailed');
    } catch (err) {
      console.error('Weekly summary failed:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('Weekly summary cron scheduled (Friday 7:30pm)');
};

module.exports = { startWeeklySummaryCron };
