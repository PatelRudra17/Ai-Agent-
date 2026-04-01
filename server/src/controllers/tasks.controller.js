const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { deadlineQueue } = require('../config/redis');
const { emitStatusUpdate, sendInAppNotification } = require('../services/notification.service');
const { sendTaskEmail } = require('../services/email.service');
const { suggestTaskAssignment } = require('../services/gemini.service');
const { isAIMode } = require('../utils/checkAIMode');

// POST /api/tasks — Create and assign task
exports.createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, assignedTo, priority, dueDate, tags, dependsOn } = req.body;

    const employee = await User.findById(assignedTo);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Get next queue order for this employee
    const lastTask = await Task.findOne({ assignedTo })
      .sort({ queueOrder: -1 })
      .select('queueOrder');
    const queueOrder = (lastTask?.queueOrder || 0) + 1;

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user.userId,
      priority: priority || 'medium',
      dueDate,
      queueOrder,
      tags,
      dependsOn,
    });

    // Schedule deadline check if dueDate exists
    if (dueDate && deadlineQueue) {
      const delay = Math.max(0, new Date(dueDate).getTime() - Date.now());
      const job = await deadlineQueue.add(
        'check-deadline',
        { taskId: task._id.toString() },
        { delay, attempts: 1 }
      );
      task.reminderJobId = job.id;
      await task.save();
    }

    // Notify employee
    sendInAppNotification(assignedTo, {
      type: 'task_assigned',
      title: `New task: ${title}`,
      message: `Assigned by ${req.user.name}. Priority: ${priority || 'medium'}`,
      taskId: task._id,
    });

    // Email notification
    try {
      await sendTaskEmail(employee.email, title, req.user.name, dueDate);
    } catch (err) {
      console.error('Task email failed:', err.message);
    }

    emitStatusUpdate('task_updated', { action: 'created', task });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    res.status(201).json({ message: 'Task created', task: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/tasks/my — Employee's own task queue
exports.getMyTasks = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = { assignedTo: req.user.userId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedBy', 'name email')
        .sort({ queueOrder: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({ tasks, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/tasks/team — All team tasks (manager/admin)
exports.getTeamTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Managers see only their team's tasks
    if (req.user.role === 'manager') {
      const teamMembers = await User.find({ managerId: req.user.userId }).select('_id');
      filter.assignedTo = { $in: teamMembers.map((m) => m._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({ tasks, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/tasks/:id/start — Mark In Progress
exports.startTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.assignedTo.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not your task' });
    }
    if (task.status !== 'pending') {
      return res.status(400).json({ message: 'Task must be pending to start' });
    }

    task.status = 'inprogress';
    await task.save();

    emitStatusUpdate('task_updated', { action: 'started', task });
    res.json({ message: 'Task started', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/tasks/:id/complete — Mark done + auto-assign next
exports.completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.assignedTo.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not your task' });
    }

    // 1. Mark done
    task.status = 'done';
    task.completedAt = new Date();
    await task.save();

    // 2. Cancel old deadline job
    if (task.reminderJobId && deadlineQueue) {
      try {
        const job = await deadlineQueue.getJob(task.reminderJobId);
        if (job) await job.remove();
      } catch {}
    }

    // 3. Auto-assign next pending task
    const nextTask = await Task.findOne({
      assignedTo: req.user.userId,
      status: 'pending',
    }).sort({ queueOrder: 1 });

    if (nextTask) {
      nextTask.status = 'inprogress';
      await nextTask.save();

      // Schedule deadline for next task
      if (nextTask.dueDate && deadlineQueue) {
        const delay = Math.max(0, new Date(nextTask.dueDate).getTime() - Date.now());
        const job = await deadlineQueue.add(
          'check-deadline',
          { taskId: nextTask._id.toString() },
          { delay, attempts: 1 }
        );
        nextTask.reminderJobId = job.id;
        await nextTask.save();
      }

      sendInAppNotification(req.user.userId, {
        type: 'next_task',
        title: `Next task: ${nextTask.title}`,
        message: 'Auto-assigned after completing previous task',
        taskId: nextTask._id,
      });
    }

    // 4. Notify the manager who assigned this task
    if (task.assignedBy) {
      sendInAppNotification(task.assignedBy.toString(), {
        type: 'task_completed',
        title: `Task Completed: ${task.title}`,
        body: `${req.user.name || 'Employee'} has completed the task.`,
        link: '/tasks',
      });
    }

    // 5. Emit updates
    emitStatusUpdate('task_updated', { action: 'completed', task, nextTask });

    res.json({ message: 'Task completed', task, nextTask: nextTask || null });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/tasks/:id/comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.comments.push({ userId: req.user.userId, text });
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('comments.userId', 'name email');

    emitStatusUpdate('task_updated', { action: 'comment', taskId: task._id });
    res.json({ message: 'Comment added', comments: populated.comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/tasks/export — Export tasks as CSV
exports.exportTasks = async (req, res) => {
  try {
    const { exportCSV } = require('../services/export.service');
    const filter = {};
    if (req.user.role === 'manager') {
      const teamMembers = await User.find({ managerId: req.user.userId }).select('_id');
      filter.assignedTo = { $in: teamMembers.map((m) => m._id) };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const rows = tasks.map((t) => ({
      Title: t.title,
      'Assigned To': t.assignedTo?.name || '',
      'Assigned By': t.assignedBy?.name || '',
      Priority: t.priority,
      Status: t.status,
      'Due Date': t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
      'Completed At': t.completedAt ? new Date(t.completedAt).toLocaleDateString() : '',
      Created: new Date(t.createdAt).toLocaleDateString(),
    }));

    const csv = exportCSV(rows, [
      { label: 'Title', value: 'Title' },
      { label: 'Assigned To', value: 'Assigned To' },
      { label: 'Assigned By', value: 'Assigned By' },
      { label: 'Priority', value: 'Priority' },
      { label: 'Status', value: 'Status' },
      { label: 'Due Date', value: 'Due Date' },
      { label: 'Completed At', value: 'Completed At' },
      { label: 'Created', value: 'Created' },
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/tasks/dashboard — Task analytics
exports.getTaskDashboard = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'manager') {
      const teamMembers = await User.find({ managerId: req.user.userId }).select('_id');
      filter.assignedTo = { $in: teamMembers.map((m) => m._id) };
    }

    const [total, pending, inprogress, done, overdue, critical] = await Promise.all([
      Task.countDocuments(filter),
      Task.countDocuments({ ...filter, status: 'pending' }),
      Task.countDocuments({ ...filter, status: 'inprogress' }),
      Task.countDocuments({ ...filter, status: 'done' }),
      Task.countDocuments({ ...filter, status: 'overdue' }),
      Task.countDocuments({ ...filter, priority: 'critical', status: { $in: ['pending', 'inprogress'] } }),
    ]);

    res.json({ stats: { total, pending, inprogress, done, overdue, critical } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/tasks/suggest-assignee — AI suggests best employee for a task
exports.suggestAssignee = async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });

    // Get team employees
    let teamFilter = { role: 'employee', isActive: true };
    if (req.user.role === 'manager') {
      teamFilter.managerId = req.user.userId;
    }
    const employees = await User.find(teamFilter).select('name email department');

    if (employees.length === 0) {
      return res.status(400).json({ message: 'No employees available' });
    }

    // Gather workload data for each employee
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    const employeeData = await Promise.all(employees.map(async (emp) => {
      const [pendingTasks, completedRecent, avgResult] = await Promise.all([
        Task.countDocuments({ assignedTo: emp._id, status: { $in: ['pending', 'inprogress'] } }),
        Task.countDocuments({ assignedTo: emp._id, status: 'done', completedAt: { $gte: weekAgo } }),
        Task.aggregate([
          { $match: { assignedTo: emp._id, status: 'done', completedAt: { $gte: weekAgo } } },
          { $project: { time: { $subtract: ['$completedAt', '$createdAt'] } } },
          { $group: { _id: null, avg: { $avg: '$time' } } },
        ]),
      ]);
      const avgMs = avgResult[0]?.avg || 0;
      return {
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        department: emp.department || '',
        pendingTasks,
        completedRecent,
        avgCompletionHours: avgMs ? (avgMs / 3600000).toFixed(1) : null,
      };
    }));

    const suggestion = await suggestTaskAssignment(
      { title, description, priority, dueDate },
      employeeData
    );

    // Map suggested name back to employee ID
    const matchEmployee = (name) => {
      if (!name) return null;
      const lower = name.toLowerCase();
      return employeeData.find((e) => e.name.toLowerCase().includes(lower) || lower.includes(e.name.toLowerCase()));
    };

    const suggested = matchEmployee(suggestion.suggestedEmployee);
    const alternatives = (suggestion.alternatives || []).map((alt) => ({
      ...alt,
      employee: matchEmployee(alt.name),
    })).filter((a) => a.employee);

    res.json({
      suggestion: {
        employee: suggested || null,
        reason: suggestion.reason,
        confidence: suggestion.confidence,
        alternatives,
      },
      employees: employeeData,
    });
  } catch (error) {
    res.status(500).json({ message: 'AI suggestion failed', error: error.message });
  }
};

// GET /api/tasks/:id — Single task detail
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email role department')
      .populate('assignedBy', 'name email')
      .populate('comments.userId', 'name email')
      .populate('dependsOn', 'title status');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Role check: employee can only see own tasks
    if (req.user.role === 'employee' && task.assignedTo?._id?.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Manager can only see their team's tasks
    if (req.user.role === 'manager') {
      const teamIds = await User.find({ managerId: req.user.userId }).distinct('_id');
      const teamStrings = teamIds.map(id => id.toString());
      if (!teamStrings.includes(task.assignedTo?._id?.toString()) && task.assignedBy?._id?.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/tasks/overdue
exports.getOverdueTasks = async (req, res) => {
  try {
    const filter = {
      dueDate: { $lt: new Date() },
      status: { $in: ['pending', 'inprogress'] },
    };

    if (req.user.role === 'manager') {
      const teamMembers = await User.find({ managerId: req.user.userId }).select('_id');
      filter.assignedTo = { $in: teamMembers.map((m) => m._id) };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ dueDate: 1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
