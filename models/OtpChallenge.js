import mongoose from 'mongoose';

const OtpChallengeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['registration', 'password_reset', 'email_change'],
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
    resetAuthTokenHash: {
      type: String,
      default: null,
    },
    resetAuthExpiresAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active challenges by email and purpose
OtpChallengeSchema.index({ email: 1, purpose: 1, consumedAt: 1 });

// MongoDB TTL index to auto-delete documents once expired (after 24 hours to preserve audit/cooldown temporarily)
OtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.OtpChallenge || mongoose.model('OtpChallenge', OtpChallengeSchema);
