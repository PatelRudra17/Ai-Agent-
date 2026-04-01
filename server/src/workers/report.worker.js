const { Worker } = require('bullmq');
const Report = require('../models/Report');
const Task = require('../models/Task');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { sendEmail, wrapHtml } = require('../services/email.service');
const { summarize, generateSmartReport } = require('../services/gemini.service');

let reportWorker;

const startReportWorker = (redisConnection) => {
  reportWorker = new Worker(
    'report-queue',
    async (job) => {
      const { date } = job.data;
      console.log(`Generating report for: ${date}`);

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate.getTime() + 86400000);

      let report = await Report.findOne({
        date: { $gte: targetDate, $lt: nextDay },
        type: 'daily',
      }).populate('employeeUpdates.userId', 'name email department');

      if (!report) {
        report = await Report.create({ date: targetDate, type: 'daily' });
      }

      // Count tasks completed today
      const tasksCompleted = await Task.countDocuments({
        completedAt: { $gte: targetDate, $lt: nextDay },
        status: 'done',
      });
      report.tasksCompleted = tasksCompleted;

      // Build report HTML
      const updatesHtml = report.employeeUpdates.map((eu) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${eu.userId?.name || 'Employee'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${eu.userId?.department || '—'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${eu.update}</td>
        </tr>`
      ).join('');

      const submittedCount = report.employeeUpdates.length;
      const totalActive = await User.countDocuments({ isActive: true, role: 'employee' });

      report.reportHtml = `
        <h2>Daily Report — ${targetDate.toLocaleDateString()}</h2>
        <p><strong>Tasks Completed:</strong> ${tasksCompleted}</p>
        <p><strong>EOD Submissions:</strong> ${submittedCount} / ${totalActive} employees</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px; text-align: left;">Employee</th>
              <th style="padding: 8px; text-align: left;">Department</th>
              <th style="padding: 8px; text-align: left;">Update</th>
            </tr>
          </thead>
          <tbody>${updatesHtml || '<tr><td colspan="3" style="padding: 8px;">No updates submitted</td></tr>'}</tbody>
        </table>`;

      // Generate AI summary — try smart report first, fall back to basic
      try {
        const updatesText = report.employeeUpdates.map((eu) =>
          `${eu.userId?.name || 'Employee'} (${eu.userId?.department || 'N/A'}): ${eu.update}`
        ).join('\n');

        // Check if any manager has AI mode enabled for daily reports
        const managersWithAI = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true, 'aiPreferences.masterMode': 'ai', 'aiPreferences.features.dailyReports': 'ai' }).select('_id');
        const useSmartReport = managersWithAI.length > 0;

        if (useSmartReport) {
          // AI Mode: Smart report with insights, blockers, recommendations
          const todayStart = new Date(targetDate); todayStart.setHours(0, 0, 0, 0);
          const [tasksCreated, overdueTasks, activeCount, presentCount, onLeaveCount, totalEmp] = await Promise.all([
            Task.countDocuments({ createdAt: { $gte: targetDate, $lt: nextDay } }),
            Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $in: ['pending', 'inprogress'] } }),
            Task.countDocuments({ status: { $in: ['pending', 'inprogress'] } }),
            Attendance.countDocuments({ date: todayStart, status: 'present' }),
            Attendance.countDocuments({ date: todayStart, status: 'leave' }),
            User.countDocuments({ isActive: true, role: 'employee' }),
          ]);

          const smartResult = await generateSmartReport(
            report.employeeUpdates.map((eu) => ({ name: eu.userId?.name || 'Employee', department: eu.userId?.department, update: eu.update })),
            { completed: tasksCompleted, created: tasksCreated, overdue: overdueTasks, active: activeCount },
            { present: presentCount, onLeave: onLeaveCount, total: totalEmp, notClockedIn: totalEmp - presentCount - onLeaveCount }
          );

          report.aiSummary = smartResult.summary;
          // Store smart insights in reportHtml
          const insightsHtml = `
            <h3>AI Insights</h3>
            ${smartResult.highlights.length ? `<h4>Highlights</h4><ul>${smartResult.highlights.map((h) => `<li style="color: #16a34a;">${h}</li>`).join('')}</ul>` : ''}
            ${smartResult.blockers.length ? `<h4>Blockers</h4><ul>${smartResult.blockers.map((b) => `<li style="color: #dc2626;">${b}</li>`).join('')}</ul>` : ''}
            ${smartResult.riskAlerts.length ? `<h4>Risk Alerts</h4><ul>${smartResult.riskAlerts.map((r) => `<li style="color: #f59e0b;">${r}</li>`).join('')}</ul>` : ''}
            ${smartResult.recommendations.length ? `<h4>Recommendations</h4><ul>${smartResult.recommendations.map((r) => `<li>${r}</li>`).join('')}</ul>` : ''}`;
          report.reportHtml += insightsHtml;
        } else {
          // Automation Mode: Basic summary
          const summaryInput = `Daily report for ${targetDate.toLocaleDateString()}.\nTasks completed: ${tasksCompleted}\nSubmissions: ${submittedCount}/${totalActive}\n\nEmployee updates:\n${updatesText}`;
          report.aiSummary = await summarize(summaryInput, 'daily work report');
        }
      } catch (aiErr) {
        console.error('AI summary failed, using fallback:', aiErr.message);
        report.aiSummary = `${submittedCount} employees submitted EOD updates. ${tasksCompleted} tasks completed.`;
      }
      await report.save();

      // Email to all managers
      const managers = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true });
      for (const mgr of managers) {
        try {
          await sendEmail({
            to: mgr.email,
            subject: `Daily Report — ${targetDate.toLocaleDateString()}`,
            text: report.aiSummary,
            html: wrapHtml('Daily Report', report.reportHtml),
          });
        } catch (err) {
          console.error(`Failed to email report to ${mgr.email}:`, err.message);
        }
      }

      report.sentToManager = true;
      await report.save();

      console.log(`Report generated and emailed for ${date}`);
    },
    {
      connection: redisConnection,
      concurrency: 1,
    }
  );

  reportWorker.on('failed', (job, err) => {
    console.error(`Report job ${job?.id} failed:`, err.message);
  });

  return reportWorker;
};

module.exports = { startReportWorker };
