const { Worker } = require('bullmq');
const Task = require('../models/Task');
const Alert = require('../models/Alert');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { sendInAppNotification, emitStatusUpdate } = require('../services/notification.service');
const { sendNotificationEmail } = require('../services/email.service');
const { isAIMode } = require('../utils/checkAIMode');
const { analyzeEscalation } = require('../services/gemini.service');

let deadlineWorker;

const startDeadlineWorker = (redisConnection) => {
  deadlineWorker = new Worker(
    'deadline-queue',
    async (job) => {
      const { taskId } = job.data;
      console.log(`Checking deadline for task: ${taskId}`);

      const task = await Task.findById(taskId).populate('assignedTo assignedBy');
      if (!task || task.status === 'done' || task.status === 'cancelled') {
        console.log('Task completed/cancelled, skipping escalation');
        return;
      }

      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const overdueMs = now.getTime() - dueDate.getTime();

      if (overdueMs < 0) {
        console.log('Task not yet overdue, skipping');
        return;
      }

      // Mark as overdue if not already
      if (task.status !== 'overdue') {
        task.status = 'overdue';
      }

      const overdueHours = overdueMs / (1000 * 60 * 60);
      let newLevel = task.escalationLevel;

      // Determine escalation level
      if (overdueHours >= 24 && task.escalationLevel < 3) {
        newLevel = 3;
      } else if (overdueHours >= 2 && task.escalationLevel < 2) {
        newLevel = 2;
      } else if (overdueHours >= 0.5 && task.escalationLevel < 1) {
        newLevel = 1;
      }

      if (newLevel <= task.escalationLevel) {
        // Schedule next check if not at max level
        if (task.escalationLevel < 3) {
          await scheduleNextCheck(job.queue, taskId, task.escalationLevel);
        }
        await task.save();
        return;
      }

      // Check if the manager who assigned this task uses AI mode for escalation
      const useAI = task.assignedBy ? await isAIMode(task.assignedBy, 'taskEscalation') : false;

      if (useAI) {
        // AI Mode: analyze context before deciding
        console.log('AI Mode: Analyzing escalation context...');
        const assignee = task.assignedTo;
        try {
          const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
          const attendance = await Attendance.findOne({ userId: assignee._id, date: todayStart });
          const pendingCount = await Task.countDocuments({ assignedTo: assignee._id, status: { $in: ['pending', 'inprogress'] } });
          const teamOnLeave = await Attendance.countDocuments({ date: todayStart, status: 'leave' });

          const decision = await analyzeEscalation(
            { title: task.title, priority: task.priority, dueDate: task.dueDate?.toISOString(), escalationLevel: task.escalationLevel },
            { name: assignee.name },
            {
              overdueHours: overdueHours.toFixed(1),
              isActiveToday: !!attendance?.clockIn,
              lastActivity: attendance?.clockIn ? attendance.clockIn.toLocaleTimeString() : 'No clock-in',
              avgCompletionHours: null,
              pendingTaskCount: pendingCount,
              teamOnLeave,
              teamWorkload: pendingCount > 5 ? 'Heavy' : 'Normal',
            }
          );

          console.log(`AI Decision: ${decision.action} — ${decision.reason}`);

          if (decision.action === 'wait') {
            // AI says wait — schedule next check but don't escalate
            task.escalationLevel = newLevel; // Track that we checked
            await task.save();
            await scheduleNextCheck(job.queue, taskId, task.escalationLevel);
            return;
          } else if (decision.action === 'extend') {
            // AI says extend deadline — skip escalation
            await task.save();
            await scheduleNextCheck(job.queue, taskId, task.escalationLevel);
            return;
          }
          // For 'escalate' and 'reassign', proceed with escalation
        } catch (aiErr) {
          console.error('AI escalation analysis failed, using default:', aiErr.message);
        }
      }

      // Automation Mode (default) or AI decided to escalate
      task.escalationLevel = newLevel;
      await task.save();

      // Execute escalation action
      await executeEscalation(task, newLevel);

      // Schedule next escalation check if not at max
      if (newLevel < 3) {
        await scheduleNextCheck(job.queue, taskId, newLevel);
      }
    },
    {
      connection: redisConnection,
      concurrency: 10,
    }
  );

  deadlineWorker.on('failed', (job, err) => {
    console.error(`Deadline job ${job?.id} failed:`, err.message);
  });

  return deadlineWorker;
};

async function executeEscalation(task, level) {
  const employee = task.assignedTo;
  const alertMessage = `Task "${task.title}" is overdue (Level ${level} escalation)`;

  // Create alert record
  await Alert.create({
    type: 'task_overdue',
    taskId: task._id,
    triggeredFor: employee._id,
    level,
    message: alertMessage,
  });

  switch (level) {
    case 1: {
      // 30 min overdue → Notify employee (in-app + email)
      console.log(`Level 1 escalation: Notifying employee ${employee.name}`);
      sendInAppNotification(employee._id, {
        type: 'escalation',
        level: 1,
        title: 'Task Overdue',
        message: `"${task.title}" is overdue. Please complete ASAP.`,
        taskId: task._id,
      });
      try {
        await sendNotificationEmail(employee.email, 'Task Overdue', alertMessage);
      } catch {}
      break;
    }
    case 2: {
      // 2 hours overdue → Notify manager
      console.log(`Level 2 escalation: Notifying manager for ${employee.name}`);
      const manager = await User.findById(employee.managerId);
      if (manager) {
        sendInAppNotification(manager._id, {
          type: 'escalation',
          level: 2,
          title: 'Employee Task Overdue',
          message: `${employee.name}'s task "${task.title}" is 2+ hours overdue.`,
          taskId: task._id,
        });
        try {
          await sendNotificationEmail(manager.email, 'Team Task Overdue (Level 2)', `${employee.name}'s task "${task.title}" is overdue by 2+ hours.`);
        } catch {}
      }
      break;
    }
    case 3: {
      // 24 hours overdue → Notify admin/boss
      console.log(`Level 3 escalation: Notifying admin for ${employee.name}`);
      const admins = await User.find({ role: 'admin' }).select('_id email');
      for (const admin of admins) {
        sendInAppNotification(admin._id, {
          type: 'escalation',
          level: 3,
          title: 'CRITICAL: Task 24h+ Overdue',
          message: `${employee.name}'s task "${task.title}" is 24+ hours overdue!`,
          taskId: task._id,
        });
        try {
          await sendNotificationEmail(admin.email, 'CRITICAL: Task 24h+ Overdue', `${employee.name}'s task "${task.title}" is 24+ hours overdue. Immediate attention required.`);
        } catch {}
      }
      break;
    }
  }

  emitStatusUpdate('alert_fired', {
    taskId: task._id,
    level,
    message: alertMessage,
  });
}

async function scheduleNextCheck(queue, taskId, currentLevel) {
  // Schedule next check based on current level
  const delays = {
    0: 30 * 60 * 1000,   // Check again in 30 min for Level 1
    1: 90 * 60 * 1000,   // Check again in 90 min for Level 2
    2: 22 * 60 * 60 * 1000, // Check again in 22h for Level 3
  };

  const delay = delays[currentLevel] || 60 * 60 * 1000;
  const { Queue } = require('bullmq');

  // Use the deadlineQueue from config
  const { deadlineQueue } = require('../config/redis');
  await deadlineQueue.add('check-deadline', { taskId }, { delay, attempts: 1 });
}

module.exports = { startDeadlineWorker };
