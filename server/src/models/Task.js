const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  size: Number,
}, { _id: false });

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'inprogress', 'done', 'overdue', 'cancelled'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    queueOrder: {
      type: Number,
      default: 0,
    },
    dependsOn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    attachments: [attachmentSchema],
    comments: [commentSchema],
    escalationLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    reminderJobId: {
      type: String,
    },
    tags: [String],
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ assignedTo: 1, status: 1, queueOrder: 1 });
taskSchema.index({ dueDate: 1, escalationLevel: 1 });

module.exports = mongoose.model('Task', taskSchema);
