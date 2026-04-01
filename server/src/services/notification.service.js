const { getIO } = require('../config/socket');
const { sendNotificationEmail, sendCallReminderEmail } = require('./email.service');

// Send in-app notification via Socket.io + persist to DB
const sendInAppNotification = (userId, notification) => {
  try {
    const io = getIO();
    io.to(userId.toString()).emit('notification', {
      ...notification,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Socket notification failed:', err.message);
  }

  // Persist notification to DB (fire and forget)
  try {
    const Notification = require('../models/Notification');
    Notification.create({
      userId,
      type: notification.type || 'system_alert',
      title: notification.title || 'Notification',
      body: notification.message || notification.body || '',
      link: notification.link || '',
    }).catch(() => {});
  } catch {}
};

// Replace Twilio call — sends in-app notification + email instead
const sendCallNotification = async ({ recipientId, recipientEmail, recipientPhone, callerName, message, scheduledAt }) => {
  // 1. In-app notification
  sendInAppNotification(recipientId, {
    type: 'call_reminder',
    title: `Call reminder from ${callerName}`,
    message,
    scheduledAt,
  });

  // 2. Email notification
  if (recipientEmail) {
    try {
      await sendCallReminderEmail(recipientEmail, callerName, message, scheduledAt);
    } catch (err) {
      console.error('Call reminder email failed:', err.message);
    }
  }

  return { status: 'notified', method: 'in-app + email' };
};

// Replace Twilio SMS — sends in-app + email
const sendSMSNotification = async ({ recipientId, recipientEmail, message }) => {
  sendInAppNotification(recipientId, {
    type: 'sms_notification',
    title: 'New message',
    message,
  });

  if (recipientEmail) {
    try {
      await sendNotificationEmail(recipientEmail, 'New Message', message);
    } catch (err) {
      console.error('SMS replacement email failed:', err.message);
    }
  }

  return { status: 'notified', method: 'in-app + email' };
};

// Broadcast to multiple users
const broadcastNotification = (userIds, notification) => {
  userIds.forEach((id) => sendInAppNotification(id, notification));
};

// Emit status update event
const emitStatusUpdate = (event, data) => {
  try {
    const io = getIO();
    io.emit(event, data);
  } catch (err) {
    console.error('Status emit failed:', err.message);
  }
};

module.exports = {
  sendInAppNotification,
  sendCallNotification,
  sendSMSNotification,
  broadcastNotification,
  emitStatusUpdate,
};
