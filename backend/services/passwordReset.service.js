const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const PasswordResetToken = require("../models/passwordResetToken.model");
const { sendEmail } = require("./email.service");
const { generatePasswordResetEmail } = require("../utils/emailTemplates.util");

/**
 * Generate secure random token
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Request password reset
 * Creates reset token and sends email
 */
const requestPasswordReset = async (email) => {
  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal if email exists or not (security)
    return {
      success: true,
      message: "If that email exists, a reset link has been sent."
    };
  }

  // Generate reset token
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // Delete any existing tokens for this user
  await PasswordResetToken.deleteMany({ userId: user._id });

  // Create new reset token
  await PasswordResetToken.create({
    userId: user._id,
    token,
    expiresAt
  });

  // Generate reset link
  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${token}`;

  // Send email
  const html = generatePasswordResetEmail({
    name: user.name,
    resetLink,
    expiryTime: "1 hour"
  });

  await sendEmail({
    to: user.email,
    subject: "Password Reset Request - CampusCode",
    html,
    text: `Reset your password: ${resetLink}`
  });

  return {
    success: true,
    message: "If that email exists, a reset link has been sent."
  };
};

/**
 * Verify reset token validity
 */
const verifyResetToken = async (token) => {
  const resetToken = await PasswordResetToken.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() }
  }).populate("userId", "name email");

  if (!resetToken) {
    throw new Error("Invalid or expired reset token");
  }

  return {
    valid: true,
    userId: resetToken.userId._id,
    userName: resetToken.userId.name,
    userEmail: resetToken.userId.email
  };
};

/**
 * Reset password using token
 */
const resetPassword = async (token, newPassword, ipAddress = null) => {
  // Verify token
  const resetToken = await PasswordResetToken.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() }
  });

  if (!resetToken) {
    throw new Error("Invalid or expired reset token");
  }

  // Get user
  const user = await User.findById(resetToken.userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update user password
  user.passwordHash = passwordHash;
  user.mustChangePassword = false; // Clear flag if it was set
  await user.save();

  // Mark token as used
  resetToken.used = true;
  resetToken.usedAt = new Date();
  resetToken.ipAddress = ipAddress;
  await resetToken.save();

  return {
    success: true,
    message: "Password reset successfully. You can now login with your new password."
  };
};

/**
 * Change password (for logged-in user)
 */
const changePassword = async (userId, oldPassword, newPassword) => {
  // Get user
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Verify old password
  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);

  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  // Check if new password is same as old
  const isSameAsOld = await bcrypt.compare(newPassword, user.passwordHash);

  if (isSameAsOld) {
    throw new Error("New password must be different from current password");
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  user.passwordHash = passwordHash;
  user.mustChangePassword = false;
  await user.save();

  return {
    success: true,
    message: "Password changed successfully"
  };
};

/**
 * Admin reset user password
 */
const adminResetUserPassword = async (userId, newPassword, adminId) => {
  // Get user
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  user.passwordHash = passwordHash;
  user.mustChangePassword = true; // Force user to change on next login
  await user.save();

  // Log admin action (optional - could use audit log)
  console.log(`Admin ${adminId} reset password for user ${userId}`);

  return {
    success: true,
    message: "Password reset successfully. User must change password on next login.",
    userId: user._id,
    userEmail: user.email
  };
};

/**
 * Cleanup expired tokens (can be called periodically)
 */
const cleanupExpiredTokens = async () => {
  const result = await PasswordResetToken.deleteMany({
    expiresAt: { $lt: new Date() }
  });

  return {
    deleted: result.deletedCount
  };
};

module.exports = {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  changePassword,
  adminResetUserPassword,
  cleanupExpiredTokens
};