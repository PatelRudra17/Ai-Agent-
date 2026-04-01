const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
    },
    organiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attendees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    scheduledAt: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // minutes
      default: 30,
    },
    googleEventId: {
      type: String,
    },
    meetLink: {
      type: String,
    },
    agenda: {
      type: String,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    notes: [noteSchema],
    aiSummary: {
      type: String,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringCron: {
      type: String,
    },
  },
  { timestamps: true }
);

meetingSchema.index({ organiser: 1, scheduledAt: -1 });
meetingSchema.index({ attendees: 1 });
meetingSchema.index({ scheduledAt: 1, status: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
