const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
  url: String,
  filename: String,
  extractedText: String,
}, { _id: false });

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    messages: [messageSchema],
    title: {
      type: String,
      default: 'New Conversation',
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'gu'],
      default: 'en',
    },
    attachments: [attachmentSchema],
    tokenCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, lastActivity: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
