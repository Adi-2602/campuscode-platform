const { body, query, param } = require("express-validator");

/**
 * Validation rules for semester data upload
 */
const uploadSemesterDataValidation = [
  body("semesterId")
    .trim()
    .notEmpty()
    .withMessage("Semester ID is required")
    .isMongoId()
    .withMessage("Invalid semester ID")
];

/**
 * Validation rules for upload ID parameter
 */
const uploadIdValidation = [
  param("uploadId")
    .notEmpty()
    .withMessage("Upload ID is required")
    .isMongoId()
    .withMessage("Invalid upload ID")
];

/**
 * Validation rules for upload query parameters
 */
const uploadQueryValidation = [
  query("semesterId")
    .optional()
    .isMongoId()
    .withMessage("Invalid semester ID"),

  query("status")
    .optional()
    .isIn(["pending", "processing", "completed", "failed", "cancelled"])
    .withMessage("Invalid status. Must be: pending, processing, completed, failed, or cancelled"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("sort")
    .optional()
    .isString()
    .withMessage("Sort must be a string")
];

module.exports = {
  uploadSemesterDataValidation,
  uploadIdValidation,
  uploadQueryValidation
};