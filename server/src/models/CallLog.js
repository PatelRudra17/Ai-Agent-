const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema(
  {
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientPhone: {
      type: String,
      trim: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'notifying', 'notified', 'failed', 'cancelled'],
      default: 'pending',
    },
    notificationMethod: {
      type: String,
      enum: ['in-app', 'email', 'in-app + email'],
      default: 'in-app + email',
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    bullJobId: {
      type: String,
    },
    aiSummary: {
      type: String,
    },
  },
  { timestamps: true }
);

callLogSchema.index({ scheduledBy: 1, scheduledAt: -1 });
callLogSchema.index({ recipient: 1 });
callLogSchema.index({ status: 1 });

module.exports = mongoose.model('CallLog', callLogSchema);
