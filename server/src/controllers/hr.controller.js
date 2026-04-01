const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const User = require('../models/User');
const { generateSalarySlip } = require('../services/salary.service');
const { sendInAppNotification } = require('../services/notification.service');
const { sendNotificationEmail } = require('../services/email.service');
const { analyzeLeaveRequest } = require('../services/gemini.service');

// Leave balance config (per year)
const LEAVE_BALANCE = { casual: 12, sick: 10, annual: 15, unpaid: 999 };

// POST /api/hr/leave/apply
exports.applyLeave = async (req, res) => {
  try {
    const { type, fromDate, toDate, reason } = req.body;
    if (!type || !fromDate || !toDate || !reason) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const leave = await LeaveRequest.create({
      employee: req.user.userId,
      type,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason,
    });

    // Notify manager
    const employee = await User.findById(req.user.userId);
    if (employee?.managerId) {
      sendInAppNotification(employee.managerId, {
        type: 'leave_request',
        title: `Leave Request: ${employee.name}`,
        message: `${type} leave from ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`,
        leaveId: leave._id,
      });
      const manager = await User.findById(employee.managerId);
      if (manager) {
        try {
          await sendNotificationEmail(manager.email, `Leave Request from ${employee.name}`,
            `${employee.name} has applied for ${type} leave from ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}.\nReason: ${reason}`);
        } catch {}
      }
    }

    res.status(201).json({ message: 'Leave applied', leave });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/hr/leave/my
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ employee: req.user.userId })
      .populate('approvedBy', 'name')
      .sort({ appliedAt: -1 });
    res.json({ leaves });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/hr/leave/team
exports.getTeamLeaves = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    if (req.user.role === 'manager') {
      const teamMembers = await User.find({ managerId: req.user.userId }).select('_id');
      filter.employee = { $in: teamMembers.map((m) => m._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [leaves, total] = await Promise.all([
      LeaveRequest.find(filter)
        .populate('employee', 'name email department')
        .populate('approvedBy', 'name')
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LeaveRequest.countDocuments(filter),
    ]);

    res.json({ leaves, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/hr/leave/:id/approve
exports.approveLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    if (leave.status !== 'pending') return res.status(400).json({ message: 'Already processed' });

    leave.status = 'approved';
    leave.approvedBy = req.user.userId;
    await leave.save();

    // Mark attendance as leave for those dates
    const from = new Date(leave.fromDate);
    const to = new Date(leave.toDate);
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      await Attendance.findOneAndUpdate(
        { userId: leave.employee, date: new Date(d.toDateString()) },
        { status: 'leave' },
        { upsert: true }
      );
    }

    sendInAppNotification(leave.employee, {
      type: 'leave_approved',
      title: 'Leave Approved',
      message: `Your ${leave.type} leave has been approved.`,
    });

    res.json({ message: 'Leave approved', leave });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/hr/leave/:id/reject
exports.rejectLeave = async (req, res) => {
  try {
    const { reason } = req.body;
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    if (leave.status !== 'pending') return res.status(400).json({ message: 'Already processed' });

    leave.status = 'rejected';
    leave.approvedBy = req.user.userId;
    leave.rejectionReason = reason || '';
    await leave.save();

    sendInAppNotification(leave.employee, {
      type: 'leave_rejected',
      title: 'Leave Rejected',
      message: `Your ${leave.type} leave was rejected.${reason ? ' Reason: ' + reason : ''}`,
    });

    res.json({ message: 'Leave rejected', leave });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/hr/leave/balance/:userId
exports.getLeaveBalance = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Only allow own balance or admin/manager
    if (req.user.role === 'employee' && req.user.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const year = new Date().getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    const approved = await LeaveRequest.find({
      employee: userId,
      status: 'approved',
      fromDate: { $gte: yearStart, $lte: yearEnd },
    });

    const used = { casual: 0, sick: 0, annual: 0, unpaid: 0 };
    for (const leave of approved) {
      const days = Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / 86400000) + 1;
      if (used[leave.type] !== undefined) used[leave.type] += days;
    }

    const balance = {};
    for (const type of Object.keys(LEAVE_BALANCE)) {
      balance[type] = { total: LEAVE_BALANCE[type], used: used[type], remaining: LEAVE_BALANCE[type] - used[type] };
    }

    res.json({ balance, year });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/hr/leave/:id/analyze — AI analyzes leave request risk
exports.analyzeLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id).populate('employee', 'name email department');
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    const employee = leave.employee;
    const days = Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / 86400000) + 1;

    // Get leave balance
    const year = new Date().getFullYear();
    const yearStart = new Date(year, 0, 1);
    const approved = await LeaveRequest.find({ employee: employee._id, status: 'approved', fromDate: { $gte: yearStart } });
    const usedOfType = approved.reduce((sum, l) => {
      if (l.type === leave.type) return sum + Math.ceil((new Date(l.toDate) - new Date(l.fromDate)) / 86400000) + 1;
      return sum;
    }, 0);
    const balanceRemaining = LEAVE_BALANCE[leave.type] - usedOfType;

    // Attendance rate this month
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const attendanceRecords = await Attendance.find({ userId: employee._id, date: { $gte: monthStart } });
    const presentDays = attendanceRecords.filter((r) => r.status === 'present').length;
    const workingDays = Math.max(1, attendanceRecords.length);
    const attendanceRate = Math.round((presentDays / workingDays) * 100);

    // Pending tasks
    const pendingTasks = await Task.countDocuments({ assignedTo: employee._id, status: { $in: ['pending', 'inprogress'] } });

    // Team data — who else is on leave those dates
    let teamFilter = { role: 'employee', isActive: true };
    if (req.user.role === 'manager') teamFilter.managerId = req.user.userId;
    const teamMembers = await User.find(teamFilter).select('name _id');
    const teamSize = teamMembers.length;

    const overlappingLeaves = await LeaveRequest.find({
      employee: { $in: teamMembers.map((m) => m._id), $ne: employee._id },
      status: 'approved',
      fromDate: { $lte: leave.toDate },
      toDate: { $gte: leave.fromDate },
    }).populate('employee', 'name');
    const othersOnLeave = overlappingLeaves.map((l) => l.employee?.name || 'Unknown');
    const capacityPercent = teamSize > 0 ? Math.round(((teamSize - othersOnLeave.length - 1) / teamSize) * 100) : 100;

    // Critical tasks due that week
    const weekEnd = new Date(leave.toDate); weekEnd.setDate(weekEnd.getDate() + 2);
    const criticalTasks = await Task.countDocuments({
      assignedTo: { $in: teamMembers.map((m) => m._id) },
      priority: { $in: ['high', 'critical'] },
      dueDate: { $gte: leave.fromDate, $lte: weekEnd },
      status: { $in: ['pending', 'inprogress'] },
    });

    const analysis = await analyzeLeaveRequest(
      {
        employeeName: employee.name,
        type: leave.type,
        fromDate: new Date(leave.fromDate).toLocaleDateString(),
        toDate: new Date(leave.toDate).toLocaleDateString(),
        days,
        reason: leave.reason,
        balanceRemaining,
        attendanceRate,
        pendingTasks,
      },
      { teamSize, othersOnLeave, capacityPercent, criticalTasks }
    );

    res.json({ analysis, leaveId: leave._id });
  } catch (error) {
    res.status(500).json({ message: 'AI analysis failed', error: error.message });
  }
};

// POST /api/hr/attendance/clock-in
exports.clockIn = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let record = await Attendance.findOne({ userId: req.user.userId, date: today });
    if (record?.clockIn) return res.status(400).json({ message: 'Already clocked in today' });

    if (!record) {
      record = await Attendance.create({ userId: req.user.userId, date: today, clockIn: new Date(), status: 'present' });
    } else {
      record.clockIn = new Date();
      record.status = 'present';
      await record.save();
    }

    res.json({ message: 'Clocked in', record });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/hr/attendance/clock-out
exports.clockOut = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await Attendance.findOne({ userId: req.user.userId, date: today });
    if (!record || !record.clockIn) return res.status(400).json({ message: 'Not clocked in today' });
    if (record.clockOut) return res.status(400).json({ message: 'Already clocked out' });

    record.clockOut = new Date();
    record.hoursWorked = (record.clockOut - record.clockIn) / (1000 * 60 * 60);
    if (record.hoursWorked < 4) record.status = 'half-day';
    await record.save();

    res.json({ message: 'Clocked out', record });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/hr/attendance/:userId
exports.getAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = req.params.userId;

    if (req.user.role === 'employee' && req.user.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const records = await Attendance.find({
      userId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    const summary = {
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      halfDay: records.filter((r) => r.status === 'half-day').length,
      leave: records.filter((r) => r.status === 'leave').length,
      totalHours: records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0).toFixed(1),
    };

    res.json({ records, summary, month: m, year: y });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/hr/leave/export — Export leave records as CSV
exports.exportLeaves = async (req, res) => {
  try {
    const { exportCSV } = require('../services/export.service');
    const leaves = await LeaveRequest.find()
      .populate('employee', 'name email department')
      .populate('approvedBy', 'name')
      .sort({ appliedAt: -1 })
      .limit(5000)
      .lean();

    const rows = leaves.map((l) => ({
      Employee: l.employee?.name || '',
      Email: l.employee?.email || '',
      Department: l.employee?.department || '',
      Type: l.type,
      From: new Date(l.fromDate).toLocaleDateString(),
      To: new Date(l.toDate).toLocaleDateString(),
      Reason: l.reason,
      Status: l.status,
      'Approved By': l.approvedBy?.name || '',
      'Applied At': new Date(l.appliedAt || l.createdAt).toLocaleDateString(),
    }));

    const csv = exportCSV(rows, Object.keys(rows[0] || {}).map((k) => ({ label: k, value: k })));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leave-records.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/hr/attendance/export — Export attendance as CSV
exports.exportAttendance = async (req, res) => {
  try {
    const { exportCSV } = require('../services/export.service');
    const { userId, month, year } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (month && year) {
      const y = parseInt(year);
      const m = parseInt(month);
      filter.date = { $gte: new Date(y, m - 1, 1), $lte: new Date(y, m, 0, 23, 59, 59) };
    }

    const records = await Attendance.find(filter)
      .populate('userId', 'name email department')
      .sort({ date: -1 })
      .limit(5000)
      .lean();

    const rows = records.map((r) => ({
      Employee: r.userId?.name || '',
      Email: r.userId?.email || '',
      Date: new Date(r.date).toLocaleDateString(),
      'Clock In': r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '',
      'Clock Out': r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '',
      'Hours Worked': r.hoursWorked ? r.hoursWorked.toFixed(1) : '',
      Status: r.status,
    }));

    const csv = exportCSV(rows, Object.keys(rows[0] || {}).map((k) => ({ label: k, value: k })));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/hr/salary/:userId/:month — Get/generate salary slip
exports.getSalarySlip = async (req, res) => {
  try {
    const { userId, month } = req.params;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const m = parseInt(month);

    if (req.user.role === 'employee' && req.user.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const employee = await User.findById(userId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const result = await generateSalarySlip({
      employee,
      month: m,
      year,
      salary: { basic: 50000, hra: 20000, da: 5000, special: 10000, pf: 6000, tax: 8500 },
    });

    res.json({ message: 'Salary slip generated', slip: result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
