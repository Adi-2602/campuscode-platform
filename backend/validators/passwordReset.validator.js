const { body, param } = require("express-validator");

/**
 * Validation rules for forgot password request
 */
const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail()
];

/**
 * Validation rules for reset password
 */
const resetPasswordValidation = [
  param("token")
    .notEmpty()
    .withMessage("Reset token is required")
    .isLength({ min: 64, max: 64 })
    .withMessage("Invalid token format"),

  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number")
];

/**
 * Validation rules for change password
 */
const changePasswordValidation = [
  body("oldPassword")
    .trim()
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number")
];

/**
 * Validation rules for verify token
 */
const verifyTokenValidation = [
  param("token")
    .notEmpty()
    .withMessage("Reset token is required")
    .isLength({ min: 64, max: 64 })
    .withMessage("Invalid token format")
];

module.exports = {
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  verifyTokenValidation
};