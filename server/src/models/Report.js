const mongoose = require('mongoose');

const employeeUpdateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  update: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
}, { _id: false });

const blockerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  issue: { type: String, required: true },
}, { _id: false });

const reportSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'custom'],
      default: 'daily',
    },
    employeeUpdates: [employeeUpdateSchema],
    aiSummary: {
      type: String,
    },
    highlights: [String],
    blockers: [blockerSchema],
    tasksCompleted: {
      type: Number,
      default: 0,
    },
    reportHtml: {
      type: String,
    },
    sentToManager: {
      type: Boolean,
      default: false,
    },
    pdfUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

reportSchema.index({ date: -1, type: 1 });

module.exports = mongoose.model('Report', reportSchema);
