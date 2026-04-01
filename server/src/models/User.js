const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'employee'],
      default: 'employee',
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'hi', 'gu'],
      default: 'en',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    aiPreferences: {
      masterMode: {
        type: String,
        enum: ['automation', 'ai'],
        default: 'automation',
      },
      features: {
        taskAssignment: { type: String, enum: ['automation', 'ai'], default: 'automation' },
        taskEscalation: { type: String, enum: ['automation', 'ai'], default: 'automation' },
        leaveAnalysis: { type: String, enum: ['automation', 'ai'], default: 'automation' },
        dailyReports: { type: String, enum: ['automation', 'ai'], default: 'automation' },
        dashboardBriefing: { type: String, enum: ['automation', 'ai'], default: 'automation' },
        meetingSummary: { type: String, enum: ['automation', 'ai'], default: 'automation' },
        messageDrafting: { type: String, enum: ['automation', 'ai'], default: 'automation' },
      },
    },
  },
  { timestamps: true }
);

// Index for faster queries
userSchema.index({ role: 1 });
userSchema.index({ managerId: 1 });
userSchema.index({ department: 1 });

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
