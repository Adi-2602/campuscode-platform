const mongoose = require("mongoose");

const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    used: {
      type: Boolean,
      default: false
    },
    usedAt: {
      type: Date,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for cleanup of expired tokens
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for finding valid tokens
passwordResetTokenSchema.index({ token: 1, used: false, expiresAt: 1 });

module.exports = mongoose.model("PasswordResetToken", passwordResetTokenSchema);