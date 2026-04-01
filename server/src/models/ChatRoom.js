const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    type: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
    },
    name: {
      type: String,
      trim: true,
    },
    lastMessage: {
      content: { type: String },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date },
    },
  },
  { timestamps: true }
);

chatRoomSchema.index({ participants: 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
