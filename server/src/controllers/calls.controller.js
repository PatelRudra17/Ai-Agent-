const { validationResult } = require('express-validator');
const CallLog = require('../models/CallLog');
const User = require('../models/User');
const { callQueue } = require('../config/redis');

// POST /api/calls/schedule
exports.scheduleCall = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { recipientId, message, scheduledAt } = req.body;

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

    const callLog = await CallLog.create({
      scheduledBy: req.user.userId,
      recipient: recipientId,
      recipientPhone: recipient.phone,
      message,
      scheduledAt: new Date(scheduledAt),
    });

    // Add to BullMQ with delay (if Redis is configured)
    if (callQueue) {
      const delay = Math.max(0, new Date(scheduledAt).getTime() - Date.now());
      const job = await callQueue.add(
        'process-call',
        { callLogId: callLog._id.toString() },
        { delay, attempts: 3, backoff: { type: 'exponential', delay: 60000 } }
      );
      callLog.bullJobId = job.id;
      await callLog.save();
    }

    res.status(201).json({ message: 'Call scheduled (will send notification + email)', callLog });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/calls
exports.getCalls = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;

    // Managers see only their scheduled calls
    if (req.user.role === 'manager') {
      filter.scheduledBy = req.user.userId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [calls, total] = await Promise.all([
      CallLog.find(filter)
        .populate('scheduledBy', 'name email')
        .populate('recipient', 'name email phone')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CallLog.countDocuments(filter),
    ]);

    res.json({
      calls,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/calls/:id
exports.getCall = async (req, res) => {
  try {
    const call = await CallLog.findById(req.params.id)
      .populate('scheduledBy', 'name email')
      .populate('recipient', 'name email phone');
    if (!call) return res.status(404).json({ message: 'Call not found' });
    res.json({ call });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/calls/:id/cancel
exports.cancelCall = async (req, res) => {
  try {
    const call = await CallLog.findById(req.params.id);
    if (!call) return res.status(404).json({ message: 'Call not found' });
    if (call.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending calls' });
    }

    call.status = 'cancelled';
    await call.save();

    // Remove BullMQ job
    if (call.bullJobId && callQueue) {
      try {
        const job = await callQueue.getJob(call.bullJobId);
        if (job) await job.remove();
      } catch (err) {
        console.error('Failed to remove BullMQ job:', err.message);
      }
    }

    res.json({ message: 'Call cancelled', call });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/calls/employee/:userId
exports.getCallsByEmployee = async (req, res) => {
  try {
    const calls = await CallLog.find({ recipient: req.params.userId })
      .populate('scheduledBy', 'name email')
      .sort({ scheduledAt: -1 })
      .limit(50);
    res.json({ calls });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
