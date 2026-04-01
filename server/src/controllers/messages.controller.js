const { validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const { messageQueue } = require('../config/redis');
const { sendInAppNotification } = require('../services/notification.service');

// POST /api/messages/schedule
exports.scheduleMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { recipientIds, channel, subject, body, scheduledAt } = req.body;

    const recipients = await User.find({ _id: { $in: recipientIds } });
    if (recipients.length === 0) return res.status(400).json({ message: 'No valid recipients' });

    const message = await Message.create({
      sender: req.user.userId,
      recipients: recipientIds,
      channel,
      subject,
      body,
      scheduledAt: new Date(scheduledAt),
      deliveryLog: recipientIds.map((id) => ({ userId: id, status: 'pending' })),
    });

    // Add to BullMQ with delay (if Redis configured)
    if (messageQueue) {
      const delay = Math.max(0, new Date(scheduledAt).getTime() - Date.now());
      const job = await messageQueue.add(
        'send-message',
        { messageId: message._id.toString() },
        { delay, attempts: 3, backoff: { type: 'exponential', delay: 30000 } }
      );
      message.bullJobId = job.id;
      await message.save();
    }

    res.status(201).json({ message: 'Message scheduled', data: message });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/messages
exports.getMessages = async (req, res) => {
  try {
    const { status, channel, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (channel) filter.channel = channel;
    if (req.user.role === 'manager') filter.sender = req.user.userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [messages, total] = await Promise.all([
      Message.find(filter)
        .populate('sender', 'name email')
        .populate('recipients', 'name email')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Message.countDocuments(filter),
    ]);

    res.json({
      messages,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/messages/:id
exports.cancelMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (msg.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending messages' });
    }

    msg.status = 'cancelled';
    await msg.save();

    if (msg.bullJobId && messageQueue) {
      try {
        const job = await messageQueue.getJob(msg.bullJobId);
        if (job) await job.remove();
      } catch (err) {
        console.error('Failed to remove BullMQ job:', err.message);
      }
    }

    res.json({ message: 'Message cancelled', data: msg });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/messages/broadcast
exports.broadcastMessage = async (req, res) => {
  try {
    const { subject, body, channel } = req.body;
    if (!body) return res.status(400).json({ message: 'Message body required' });

    const employees = await User.find({ isActive: true }).select('_id');
    const recipientIds = employees.map((e) => e._id);

    const message = await Message.create({
      sender: req.user.userId,
      recipients: recipientIds,
      channel: channel || 'in-app',
      subject,
      body,
      scheduledAt: new Date(), // Send immediately
      deliveryLog: recipientIds.map((id) => ({ userId: id, status: 'pending' })),
    });

    // Process immediately (if Redis configured)
    if (messageQueue) {
      const job = await messageQueue.add(
        'send-message',
        { messageId: message._id.toString() },
        { attempts: 3 }
      );
      message.bullJobId = job.id;
      await message.save();
    }

    res.status(201).json({ message: `Broadcast sent to ${recipientIds.length} employees`, data: message });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
