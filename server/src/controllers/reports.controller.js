const Report = require('../models/Report');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendInAppNotification } = require('../services/notification.service');

// POST /api/reports/eod-submit — Employee submits EOD update
exports.submitEOD = async (req, res) => {
  try {
    const { update } = req.body;
    if (!update) return res.status(400).json({ message: 'Update text required' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's report
    let report = await Report.findOne({
      date: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
      type: 'daily',
    });

    if (!report) {
      report = await Report.create({ date: today, type: 'daily' });
    }

    // Check if user already submitted
    const existing = report.employeeUpdates.find(
      (eu) => eu.userId.toString() === req.user.userId
    );
    if (existing) {
      existing.update = update;
      existing.submittedAt = new Date();
    } else {
      report.employeeUpdates.push({
        userId: req.user.userId,
        update,
        submittedAt: new Date(),
      });
    }

    // Count tasks completed today by this user
    const completedToday = await Task.countDocuments({
      assignedTo: req.user.userId,
      completedAt: { $gte: today },
      status: 'done',
    });

    await report.save();

    // Notify employee's manager
    const employee = await User.findById(req.user.userId);
    if (employee?.managerId) {
      sendInAppNotification(employee.managerId.toString(), {
        type: 'system_alert',
        title: `EOD Update: ${employee.name}`,
        body: `Submitted daily update. ${completedToday} task(s) completed today.`,
        link: '/reports',
      });
    }

    res.json({ message: 'EOD update submitted', completedToday });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/reports/generate — Generate AI report (summary added in Phase 4 with Gemini)
exports.generateReport = async (req, res) => {
  try {
    const { date, type } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    let report = await Report.findOne({
      date: { $gte: targetDate, $lt: new Date(targetDate.getTime() + 86400000) },
      type: type || 'daily',
    }).populate('employeeUpdates.userId', 'name email department');

    if (!report) {
      return res.status(404).json({ message: 'No report found for this date' });
    }

    // Count total tasks completed
    const tasksCompleted = await Task.countDocuments({
      completedAt: { $gte: targetDate, $lt: new Date(targetDate.getTime() + 86400000) },
      status: 'done',
    });

    report.tasksCompleted = tasksCompleted;

    // Build basic report HTML (AI-enhanced in Phase 4)
    const updatesHtml = report.employeeUpdates.map((eu) =>
      `<li><strong>${eu.userId?.name || 'Employee'}</strong>: ${eu.update}</li>`
    ).join('');

    report.reportHtml = `
      <h2>Daily Report — ${targetDate.toLocaleDateString()}</h2>
      <p><strong>Tasks Completed:</strong> ${tasksCompleted}</p>
      <h3>Employee Updates</h3>
      <ul>${updatesHtml || '<li>No updates submitted</li>'}</ul>
    `;

    await report.save();

    res.json({ message: 'Report generated', report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/reports
exports.getReports = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('employeeUpdates.userId', 'name email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Report.countDocuments(filter),
    ]);

    res.json({ reports, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/reports/:id
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('employeeUpdates.userId', 'name email department')
      .populate('blockers.userId', 'name');

    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
