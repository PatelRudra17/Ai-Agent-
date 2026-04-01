const mongoose = require('mongoose');

const deliveryLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentAt: Date,
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  error: String,
}, { _id: false });

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    channel: {
      type: String,
      enum: ['email', 'whatsapp', 'in-app', 'slack'],
      required: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'cancelled'],
      default: 'pending',
    },
    bullJobId: {
      type: String,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    cronExpression: {
      type: String,
    },
    deliveryLog: [deliveryLogSchema],
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, scheduledAt: -1 });
messageSchema.index({ status: 1 });
messageSchema.index({ scheduledAt: 1, status: 1 });

module.exports = mongoose.model('Message', messageSchema);
