const Task = require('../models/Task');
const CallLog = require('../models/CallLog');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const { generateMorningBriefing } = require('../services/gemini.service');

// GET /api/analytics/tasks — Task completion stats
exports.getTaskStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const [byStatus, byPriority, dailyCompleted] = await Promise.all([
      Task.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { status: 'done', completedAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({ byStatus, byPriority, dailyCompleted });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/analytics/calls — Call/notification volume stats
exports.getCallStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const [byStatus, dailyCalls] = await Promise.all([
      CallLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      CallLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({ byStatus, dailyCalls });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/analytics/team — Team productivity overview
exports.getTeamStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const [topPerformers, departmentStats, meetingCount, leaveCount] = await Promise.all([
      // Top 10 employees by tasks completed
      Task.aggregate([
        { $match: { status: 'done', completedAt: { $gte: since } } },
        { $group: { _id: '$assignedTo', completed: { $sum: 1 } } },
        { $sort: { completed: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        { $project: { name: '$user.name', department: '$user.department', completed: 1 } },
      ]),
      // Tasks by department
      Task.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $lookup: {
            from: 'users',
            localField: 'assignedTo',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $group: {
            _id: '$user.department',
            total: { $sum: 1 },
            done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          },
        },
      ]),
      Meeting.countDocuments({ scheduledAt: { $gte: since } }),
      LeaveRequest.countDocuments({ appliedAt: { $gte: since } }),
    ]);

    res.json({ topPerformers, departmentStats, meetingCount, leaveCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/analytics/employee/:userId — Individual employee analytics
exports.getEmployeeStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const user = await User.findById(userId).select('name email department role');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [taskStats, attendanceStats, leaveStats] = await Promise.all([
      Task.aggregate([
        { $match: { assignedTo: user._id, createdAt: { $gte: since } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Attendance.aggregate([
        { $match: { userId: user._id, date: { $gte: since } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalHours: { $sum: '$hoursWorked' },
          },
        },
      ]),
      LeaveRequest.aggregate([
        { $match: { employee: user._id, appliedAt: { $gte: since } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Average completion time
    const avgCompletion = await Task.aggregate([
      {
        $match: {
          assignedTo: user._id,
          status: 'done',
          completedAt: { $gte: since },
          createdAt: { $exists: true },
        },
      },
      {
        $project: {
          completionTime: { $subtract: ['$completedAt', '$createdAt'] },
        },
      },
      {
        $group: {
          _id: null,
          avgMs: { $avg: '$completionTime' },
        },
      },
    ]);

    const avgHours = avgCompletion[0] ? (avgCompletion[0].avgMs / (1000 * 60 * 60)).toFixed(1) : null;

    res.json({ user, taskStats, attendanceStats, leaveStats, avgCompletionHours: avgHours });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/analytics/morning-briefing — AI morning briefing for managers
exports.getMorningBriefing = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);

    // Scope to manager's team or all for admin
    let teamFilter = { role: 'employee', isActive: true };
    if (req.user.role === 'manager') teamFilter.managerId = req.user.userId;
    const teamMembers = await User.find(teamFilter).select('name _id');
    const teamIds = teamMembers.map((m) => m._id);

    // Overdue tasks
    const overdueTasks = await Task.find({
      assignedTo: { $in: teamIds },
      dueDate: { $lt: now },
      status: { $in: ['pending', 'inprogress'] },
    }).populate('assignedTo', 'name').limit(10).lean();

    const overdueData = overdueTasks.map((t) => ({
      title: t.title,
      assignee: t.assignedTo?.name || 'Unknown',
      hoursOverdue: Math.round((now - new Date(t.dueDate)) / 3600000),
    }));

    // Employees with no tasks
    const employeesWithTasks = await Task.distinct('assignedTo', {
      assignedTo: { $in: teamIds },
      status: { $in: ['pending', 'inprogress'] },
    });
    const unassigned = teamMembers.filter((m) => !employeesWithTasks.some((id) => id.toString() === m._id.toString()));

    // Today's meetings
    const meetings = await Meeting.find({
      scheduledAt: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: 'cancelled' },
      $or: [{ organiser: req.user.userId }, { attendees: req.user.userId }],
    }).select('title scheduledAt').lean();

    // Pending leaves
    let leaveFilter = { status: 'pending' };
    if (req.user.role === 'manager') leaveFilter.employee = { $in: teamIds };
    const pendingLeaves = await LeaveRequest.countDocuments(leaveFilter);

    // On leave today
    const onLeaveToday = await Attendance.countDocuments({
      userId: { $in: teamIds }, date: todayStart, status: 'leave',
    });

    // Capacity
    const teamCapacity = teamMembers.length > 0 ? Math.round(((teamMembers.length - onLeaveToday) / teamMembers.length) * 100) : 100;

    // Completion rates
    const thisWeekDone = await Task.countDocuments({ assignedTo: { $in: teamIds }, status: 'done', completedAt: { $gte: weekAgo } });
    const thisWeekTotal = await Task.countDocuments({ assignedTo: { $in: teamIds }, createdAt: { $gte: weekAgo } });
    const lastWeekDone = await Task.countDocuments({ assignedTo: { $in: teamIds }, status: 'done', completedAt: { $gte: twoWeeksAgo, $lt: weekAgo } });
    const lastWeekTotal = await Task.countDocuments({ assignedTo: { $in: teamIds }, createdAt: { $gte: twoWeeksAgo, $lt: weekAgo } });

    const weeklyRate = thisWeekTotal > 0 ? Math.round((thisWeekDone / thisWeekTotal) * 100) : 0;
    const lastWeekRate = lastWeekTotal > 0 ? Math.round((lastWeekDone / lastWeekTotal) * 100) : 0;

    const briefing = await generateMorningBriefing({
      overdueTasks: overdueData,
      unassignedEmployees: unassigned.map((e) => e.name),
      meetings: meetings.map((m) => ({ title: m.title, time: new Date(m.scheduledAt).toLocaleTimeString() })),
      pendingLeaves,
      teamCapacity,
      weeklyCompletionRate: weeklyRate,
      lastWeekRate,
    });

    res.json({ briefing, raw: { overdueTasks: overdueData.length, unassigned: unassigned.length, meetings: meetings.length, pendingLeaves, teamCapacity, weeklyRate, lastWeekRate } });
  } catch (error) {
    res.status(500).json({ message: 'AI briefing failed', error: error.message });
  }
};
