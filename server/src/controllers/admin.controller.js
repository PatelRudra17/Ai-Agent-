const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const Meeting = require('../models/Meeting');
const Document = require('../models/Document');
const ActivityLog = require('../models/ActivityLog');
const LeaveRequest = require('../models/LeaveRequest');
const BlacklistedToken = require('../models/BlacklistedToken');

// Simple in-memory cache for expensive queries
let statsCache = { data: null, timestamp: 0 };
const CACHE_TTL = 60000; // 60 seconds

// GET /api/admin/stats — System-wide stats
exports.getStats = async (req, res) => {
  // Return cached if fresh
  if (statsCache.data && Date.now() - statsCache.timestamp < CACHE_TTL) {
    return res.json(statsCache.data);
  }
  try {
    const [userStats, taskStats, meetingCount, documentCount, leaveCount] = await Promise.all([
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
      ]),
      Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Meeting.countDocuments(),
      Document.countDocuments(),
      LeaveRequest.countDocuments(),
    ]);

    const totalUsers = userStats.reduce((s, r) => s + r.count, 0);
    const activeUsers = userStats.reduce((s, r) => s + r.active, 0);
    const totalTasks = taskStats.reduce((s, r) => s + r.count, 0);

    const mem = process.memoryUsage();

    const result = {
      users: { total: totalUsers, active: activeUsers, byRole: userStats },
      tasks: { total: totalTasks, byStatus: taskStats },
      meetings: meetingCount,
      documents: documentCount,
      leaves: leaveCount,
      system: {
        uptime: process.uptime(),
        memoryUsage: {
          rss: Math.round(mem.rss / 1024 / 1024),
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        },
        nodeVersion: process.version,
        mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      },
    };

    statsCache = { data: result, timestamp: Date.now() };
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/admin/users — All users with filters
exports.getUsers = async (req, res) => {
  try {
    const { role, department, search, isActive, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('managerId', 'name email')
        .select('-password')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/admin/users/:id/role — Change user role
exports.changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    await ActivityLog.create({
      userId: req.user.userId,
      action: 'role_changed',
      module: 'users',
      details: { targetUserId: user._id, newRole: role },
    });

    res.json({ message: `Role updated to ${role}`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/admin/users/:id/deactivate
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    await ActivityLog.create({
      userId: req.user.userId,
      action: 'user_deactivated',
      module: 'users',
      details: { targetUserId: user._id },
    });

    res.json({ message: 'User deactivated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/admin/users/:id/activate
exports.activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    await ActivityLog.create({
      userId: req.user.userId,
      action: 'user_activated',
      module: 'users',
      details: { targetUserId: user._id },
    });

    res.json({ message: 'User activated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/admin/audit-log — Paginated audit log
exports.getAuditLog = async (req, res) => {
  try {
    const { userId, module, action, from, to, page = 1, limit = 30 } = req.query;
    const filter = {};

    if (userId) filter.userId = userId;
    if (module) filter.module = module;
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('userId', 'name email')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/admin/audit-log/export — Export audit log as CSV
exports.exportAuditLog = async (req, res) => {
  try {
    const { Parser } = require('json2csv');
    const { from, to } = req.query;
    const filter = {};

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const logs = await ActivityLog.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const rows = logs.map((l) => ({
      Date: new Date(l.createdAt).toISOString(),
      User: l.userId?.name || 'System',
      Email: l.userId?.email || '',
      Action: l.action,
      Module: l.module,
      Details: JSON.stringify(l.details || {}),
      IP: l.ipAddress || '',
    }));

    const parser = new Parser({ fields: ['Date', 'User', 'Email', 'Action', 'Module', 'Details', 'IP'] });
    const csv = parser.parse(rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-log.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/admin/data/cleanup — Remove old data
exports.cleanupData = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [expiredTokens, oldLogs] = await Promise.all([
      BlacklistedToken.deleteMany({ expiresAt: { $lt: new Date() } }),
      ActivityLog.deleteMany({ createdAt: { $lt: thirtyDaysAgo } }),
    ]);

    await ActivityLog.create({
      userId: req.user.userId,
      action: 'data_cleanup',
      module: 'auth',
      details: { expiredTokens: expiredTokens.deletedCount, oldLogs: oldLogs.deletedCount },
    });

    res.json({
      message: 'Cleanup complete',
      removed: {
        expiredTokens: expiredTokens.deletedCount,
        oldActivityLogs: oldLogs.deletedCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/admin/system/health
exports.getSystemHealth = async (req, res) => {
  try {
    const mem = process.memoryUsage();
    const mongoState = ['disconnected', 'connected', 'connecting', 'disconnecting'];

    res.json({
      status: 'ok',
      uptime: Math.round(process.uptime()),
      mongodb: mongoState[mongoose.connection.readyState] || 'unknown',
      memory: {
        rssMB: Math.round(mem.rss / 1024 / 1024),
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        heapPercent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
      },
      node: process.version,
      platform: process.platform,
      pid: process.pid,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
