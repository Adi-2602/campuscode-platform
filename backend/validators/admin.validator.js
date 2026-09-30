const { body, param, query } = require("express-validator");

/**
 * Validation rules for bulk verify teachers
 */
const bulkVerifyTeachersValidation = [
  body("teacherIds")
    .isArray({ min: 1 })
    .withMessage("teacherIds must be a non-empty array"),

  body("teacherIds.*")
    .isMongoId()
    .withMessage("Each teacherId must be a valid MongoDB ObjectId")
];

/**
 * Validation rules for resend credentials
 */
const resendCredentialsValidation = [
  param("teacherId")
    .notEmpty()
    .withMessage("Teacher ID is required")
    .isMongoId()
    .withMessage("Invalid teacher ID")
];

/**
 * Validation rules for reject teacher
 */
const rejectTeacherValidation = [
  param("teacherId")
    .notEmpty()
    .withMessage("Teacher ID is required")
    .isMongoId()
    .withMessage("Invalid teacher ID"),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason must be less than 500 characters")
];

/**
 * Validation rules for update teacher email
 */
const updateTeacherEmailValidation = [
  param("teacherId")
    .notEmpty()
    .withMessage("Teacher ID is required")
    .isMongoId()
    .withMessage("Invalid teacher ID"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail()
];

/**
 * Validation rules for unverified teachers query
 */
const unverifiedTeachersQueryValidation = [
  query("isPlaceholder")
    .optional()
    .isBoolean()
    .withMessage("isPlaceholder must be a boolean"),

  query("needsEmailUpdate")
    .optional()
    .isBoolean()
    .withMessage("needsEmailUpdate must be a boolean"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
];

module.exports = {
  bulkVerifyTeachersValidation,
  resendCredentialsValidation,
  rejectTeacherValidation,
  updateTeacherEmailValidation,
  unverifiedTeachersQueryValidation
};