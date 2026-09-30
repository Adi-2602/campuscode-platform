const {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  changePassword
} = require("../services/passwordReset.service");

/**
 * Request password reset
 * POST /auth/password/forgot
 */
const requestPasswordResetHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required"
      });
    }

    const result = await requestPasswordReset(email);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Verify reset token
 * GET /auth/password/verify/:token
 */
const verifyResetTokenHandler = async (req, res) => {
  try {
    const { token } = req.params;

    const result = await verifyResetToken(token);

    res.json(result);

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Reset password using token
 * POST /auth/password/reset/:token
 */
const resetPasswordHandler = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        error: "New password is required"
      });
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long"
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;

    const result = await resetPassword(token, newPassword, ipAddress);

    res.json(result);

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Change password (logged-in user)
 * POST /auth/password/change
 */
const changePasswordHandler = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        error: "Both old and new passwords are required"
      });
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long"
      });
    }

    const result = await changePassword(req.user.id, oldPassword, newPassword);

    res.json(result);

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

module.exports = {
  requestPasswordResetHandler,
  verifyResetTokenHandler,
  resetPasswordHandler,
  changePasswordHandler
};