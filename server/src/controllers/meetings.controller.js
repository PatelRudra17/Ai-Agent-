const { validationResult } = require('express-validator');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { createEvent, deleteEvent, updateEvent } = require('../services/calendar.service');
const { sendInAppNotification, emitStatusUpdate } = require('../services/notification.service');
const { sendNotificationEmail } = require('../services/email.service');
const { summarize, generatePreMeetingBrief, extractActionItems } = require('../services/gemini.service');
const Task = require('../models/Task');

// POST /api/meetings/create
exports.createMeeting = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, attendeeIds, scheduledAt, duration, agenda, isRecurring, recurringCron } = req.body;

    const attendees = await User.find({ _id: { $in: attendeeIds } });
    if (attendees.length === 0) return res.status(400).json({ message: 'No valid attendees' });

    const meeting = await Meeting.create({
      title,
      organiser: req.user.userId,
      attendees: attendeeIds,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 30,
      agenda,
      isRecurring,
      recurringCron,
    });

    // Try to create Google Calendar event (optional — works without it)
    const calendarResult = await createEvent({
      title,
      description: agenda || '',
      startTime: scheduledAt,
      durationMinutes: duration || 30,
      attendeeEmails: attendees.map((a) => a.email),
    });

    if (calendarResult) {
      meeting.googleEventId = calendarResult.eventId;
      meeting.meetLink = calendarResult.meetLink;
      await meeting.save();
    }

    // Notify all attendees
    for (const attendee of attendees) {
      sendInAppNotification(attendee._id, {
        type: 'meeting_invite',
        title: `Meeting: ${title}`,
        message: `Scheduled for ${new Date(scheduledAt).toLocaleString()}`,
        meetingId: meeting._id,
      });
      try {
        await sendNotificationEmail(
          attendee.email,
          `Meeting Invite: ${title}`,
          `You are invited to "${title}" on ${new Date(scheduledAt).toLocaleString()}.\n${meeting.meetLink ? `Join: ${meeting.meetLink}` : ''}\n${agenda ? `Agenda: ${agenda}` : ''}`
        );
      } catch {}
    }

    const populated = await Meeting.findById(meeting._id)
      .populate('organiser', 'name email')
      .populate('attendees', 'name email');

    res.status(201).json({ message: 'Meeting created', meeting: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/meetings
exports.getMeetings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    // Employees see only their meetings
    if (req.user.role === 'employee') {
      filter.$or = [{ organiser: req.user.userId }, { attendees: req.user.userId }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [meetings, total] = await Promise.all([
      Meeting.find(filter)
        .populate('organiser', 'name email')
        .populate('attendees', 'name email')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Meeting.countDocuments(filter),
    ]);

    res.json({ meetings, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/meetings/:id/reschedule
exports.rescheduleMeeting = async (req, res) => {
  try {
    const { scheduledAt, duration } = req.body;
    const meeting = await Meeting.findById(req.params.id).populate('attendees', 'name email');
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    meeting.scheduledAt = new Date(scheduledAt);
    if (duration) meeting.duration = duration;
    await meeting.save();

    // Update Google Calendar
    if (meeting.googleEventId) {
      await updateEvent(meeting.googleEventId, {
        title: meeting.title,
        startTime: scheduledAt,
        durationMinutes: meeting.duration,
      });
    }

    // Notify attendees
    for (const att of meeting.attendees) {
      sendInAppNotification(att._id, {
        type: 'meeting_rescheduled',
        title: `Meeting rescheduled: ${meeting.title}`,
        message: `New time: ${new Date(scheduledAt).toLocaleString()}`,
      });
    }

    res.json({ message: 'Meeting rescheduled', meeting });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/meetings/:id
exports.cancelMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate('attendees', 'name email');
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    meeting.status = 'cancelled';
    await meeting.save();

    if (meeting.googleEventId) {
      await deleteEvent(meeting.googleEventId);
    }

    for (const att of meeting.attendees) {
      sendInAppNotification(att._id, {
        type: 'meeting_cancelled',
        title: `Meeting cancelled: ${meeting.title}`,
        message: 'This meeting has been cancelled.',
      });
    }

    res.json({ message: 'Meeting cancelled', meeting });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/meetings/:id/notes
exports.addNotes = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Note text required' });

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    meeting.notes.push({ userId: req.user.userId, text });
    await meeting.save();

    const populated = await Meeting.findById(meeting._id)
      .populate('notes.userId', 'name email');

    res.json({ message: 'Note added', notes: populated.notes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/meetings/:id/summary — placeholder for AI summary (Phase 4)
exports.getMeetingSummary = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate('notes.userId', 'name');
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (meeting.aiSummary) {
      return res.json({ summary: meeting.aiSummary });
    }

    if (meeting.notes.length === 0) {
      return res.json({ summary: 'No notes submitted yet.' });
    }

    // Generate AI summary from notes using Gemini
    const notesText = meeting.notes.map((n) => `${n.userId?.name || 'User'}: ${n.text}`).join('\n');
    const input = `Meeting: ${meeting.title}\nAgenda: ${meeting.agenda || 'N/A'}\n\nNotes:\n${notesText}`;

    try {
      const aiSummary = await summarize(input, 'meeting notes');
      meeting.aiSummary = aiSummary;
      await meeting.save();
      res.json({ summary: aiSummary });
    } catch (err) {
      res.json({ summary: notesText });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/meetings/:id/pre-brief — AI generates pre-meeting brief
exports.getPreMeetingBrief = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('attendees', 'name email')
      .populate('organiser', 'name');
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    // Find previous meeting with same title or attendees
    const previousMeeting = await Meeting.findOne({
      _id: { $ne: meeting._id },
      $or: [
        { title: meeting.title },
        { attendees: { $in: meeting.attendees.map((a) => a._id) }, organiser: meeting.organiser._id },
      ],
      scheduledAt: { $lt: meeting.scheduledAt },
      status: { $ne: 'cancelled' },
    }).populate('notes.userId', 'name').sort({ scheduledAt: -1 });

    let previousData = { hadPrevious: false, actionItems: [], decisions: '', tasksSinceLast: 0, tasksCreatedSinceLast: 0 };

    if (previousMeeting) {
      const sinceLastDate = previousMeeting.scheduledAt;
      const [tasksDone, tasksCreated] = await Promise.all([
        Task.countDocuments({ status: 'done', completedAt: { $gte: sinceLastDate } }),
        Task.countDocuments({ createdAt: { $gte: sinceLastDate } }),
      ]);

      previousData = {
        hadPrevious: true,
        date: previousMeeting.scheduledAt.toLocaleDateString(),
        actionItems: previousMeeting.notes.map((n) => ({ text: n.text, status: 'recorded', owner: n.userId?.name || 'Unknown' })),
        decisions: previousMeeting.aiSummary || 'No summary available',
        tasksSinceLast: tasksDone,
        tasksCreatedSinceLast: tasksCreated,
      };
    }

    const brief = await generatePreMeetingBrief(
      {
        title: meeting.title,
        agenda: meeting.agenda,
        attendees: meeting.attendees.map((a) => a.name),
        scheduledAt: meeting.scheduledAt.toLocaleString(),
      },
      previousData
    );

    res.json({ brief, previousMeetingId: previousMeeting?._id || null });
  } catch (error) {
    res.status(500).json({ message: 'AI pre-brief failed', error: error.message });
  }
};

// POST /api/meetings/:id/smart-summary — AI extracts decisions + action items
exports.getSmartSummary = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate('notes.userId', 'name');
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (meeting.notes.length === 0) {
      return res.status(400).json({ message: 'No notes to analyze' });
    }

    const notesText = meeting.notes.map((n) => `${n.userId?.name || 'User'}: ${n.text}`).join('\n');
    const extracted = await extractActionItems(meeting.title, notesText);

    // Also generate plain summary
    const input = `Meeting: ${meeting.title}\nAgenda: ${meeting.agenda || 'N/A'}\n\nNotes:\n${notesText}`;
    let aiSummary = meeting.aiSummary;
    if (!aiSummary) {
      try { aiSummary = await summarize(input, 'meeting notes'); } catch { aiSummary = ''; }
      meeting.aiSummary = aiSummary;
      await meeting.save();
    }

    res.json({ summary: aiSummary, extracted });
  } catch (error) {
    res.status(500).json({ message: 'AI smart summary failed', error: error.message });
  }
};

// POST /api/meetings/:id/create-tasks-from-actions — Create tasks from AI-extracted action items
exports.createTasksFromActions = async (req, res) => {
  try {
    const { actionItems } = req.body;
    if (!actionItems || actionItems.length === 0) {
      return res.status(400).json({ message: 'No action items provided' });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const createdTasks = [];
    for (const item of actionItems) {
      // Try to match owner to a user
      let assignee = null;
      if (item.owner && item.owner !== 'Unknown') {
        assignee = await User.findOne({
          name: { $regex: item.owner, $options: 'i' },
          isActive: true,
        }).select('_id name');
      }

      if (assignee) {
        const lastTask = await Task.findOne({ assignedTo: assignee._id }).sort({ queueOrder: -1 }).select('queueOrder');
        const queueOrder = (lastTask?.queueOrder || 0) + 1;

        const task = await Task.create({
          title: item.task,
          description: `From meeting: ${meeting.title}`,
          assignedTo: assignee._id,
          assignedBy: req.user.userId,
          priority: 'medium',
          dueDate: item.deadline && item.deadline !== 'N/A' && item.deadline !== 'ASAP' ? new Date(item.deadline) : null,
          queueOrder,
        });
        createdTasks.push({ task: task._id, title: item.task, assignedTo: assignee.name });
      }
    }

    res.json({ message: `${createdTasks.length} tasks created`, tasks: createdTasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
