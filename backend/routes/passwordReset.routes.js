const express = require("express");

const {
  requestPasswordResetHandler,
  verifyResetTokenHandler,
  resetPasswordHandler,
  changePasswordHandler
} = require("../controllers/passwordReset.controller");

const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Password Reset
 *   description: Password reset and change APIs
 */

/**
 * @swagger
 * /auth/password/forgot:
 *   post:
 *     summary: Request password reset
 *     description: Send password reset email to user
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "student@srmist.edu.in"
 *     responses:
 *       200:
 *         description: Reset email sent (always returns success for security)
 *       400:
 *         description: Validation error
 */
router.post("/forgot", requestPasswordResetHandler);

/**
 * @swagger
 * /auth/password/verify/{token}:
 *   get:
 *     summary: Verify reset token
 *     description: Check if reset token is valid and not expired
 *     tags: [Password Reset]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Reset token from email
 *     responses:
 *       200:
 *         description: Token is valid
 *       400:
 *         description: Token is invalid or expired
 */
router.get("/verify/:token", verifyResetTokenHandler);

/**
 * @swagger
 * /auth/password/reset/{token}:
 *   post:
 *     summary: Reset password
 *     description: Reset password using valid token
 *     tags: [Password Reset]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Reset token from email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: "NewSecure@123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token or weak password
 */
router.post("/reset/:token", resetPasswordHandler);

/**
 * @swagger
 * /auth/password/change:
 *   post:
 *     summary: Change password
 *     description: Change password for logged-in user
 *     tags: [Password Reset]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "OldPassword@123"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: "NewSecure@123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid old password or weak new password
 *       401:
 *         description: Unauthorized
 */
router.post("/change", authenticate, changePasswordHandler);

module.exports = router;