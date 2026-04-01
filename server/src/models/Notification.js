const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'task_assigned', 'task_completed', 'task_overdue', 'next_task',
        'leave_approved', 'leave_rejected', 'leave_applied', 'leave_request',
        'meeting_reminder', 'meeting_created', 'meeting_invite', 'meeting_rescheduled', 'meeting_cancelled',
        'message_received', 'scheduled_message',
        'call_reminder',
        'escalation', 'eod_reminder', 'sms_notification',
        'system_alert', 'role_changed',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
    },
    link: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // auto-delete after 30 days

module.exports = mongoose.model('Notification', notificationSchema);
