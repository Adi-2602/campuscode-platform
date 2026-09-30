const { body, query, param } = require("express-validator");

/**
 * Validation rules for creating a class schedule template
 */
const createClassScheduleTemplateValidation = [
  body("semesterId")
    .trim()
    .notEmpty()
    .withMessage("Semester ID is required")
    .isMongoId()
    .withMessage("Invalid semester ID"),

  body("batch")
    .notEmpty()
    .withMessage("Batch is required")
    .isInt({ min: 1, max: 2 })
    .withMessage("Batch must be 1 or 2"),

  body("section")
    .trim()
    .notEmpty()
    .withMessage("Section is required")
    .isLength({ min: 1, max: 20 })
    .withMessage("Section must be between 1 and 20 characters")
    // Allow: A1, B2, Full, M-Full, etc.
    .customSanitizer(value => value.toUpperCase()),

  body("group")
    .notEmpty()
    .withMessage("Group is required")
    .isInt({ min: 1, max: 2 })
    .withMessage("Group must be 1 or 2"),

  body("courseCode")
    .trim()
    .notEmpty()
    .withMessage("Course code is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Course code must be between 3 and 20 characters")
    .customSanitizer(value => value.toUpperCase()),

  body("courseName")
    .trim()
    .notEmpty()
    .withMessage("Course name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Course name must be between 3 and 100 characters"),

  body("venue")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Venue must be less than 50 characters"),

  body("labSlots")
    .optional()
    .isArray()
    .withMessage("Lab slots must be an array")
    .custom((value) => {
      if (value && value.length > 0) {
        const allValid = value.every(id => /^[0-9a-fA-F]{24}$/.test(id));
        if (!allValid) {
          throw new Error("All lab slot IDs must be valid MongoDB ObjectIds");
        }
      }
      return true;
    })
];

/**
 * Validation rules for updating a class schedule template
 */
const updateClassScheduleTemplateValidation = [
  param("templateId")
    .notEmpty()
    .withMessage("Template ID is required")
    .isMongoId()
    .withMessage("Invalid template ID"),

  body("batch")
    .optional()
    .isInt({ min: 1, max: 2 })
    .withMessage("Batch must be 1 or 2"),

  body("section")
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Section must be between 1 and 20 characters")
    .customSanitizer(value => value.toUpperCase()),

  body("group")
    .optional()
    .isInt({ min: 1, max: 2 })
    .withMessage("Group must be 1 or 2"),

  body("courseCode")
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Course code must be between 3 and 20 characters")
    .customSanitizer(value => value.toUpperCase()),

  body("courseName")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Course name must be between 3 and 100 characters"),

  body("venue")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Venue must be less than 50 characters"),

  body("labSlots")
    .optional()
    .isArray()
    .withMessage("Lab slots must be an array")
    .custom((value) => {
      if (value && value.length > 0) {
        const allValid = value.every(id => /^[0-9a-fA-F]{24}$/.test(id));
        if (!allValid) {
          throw new Error("All lab slot IDs must be valid MongoDB ObjectIds");
        }
      }
      return true;
    })
];

/**
 * Validation rules for template ID parameter
 */
const templateIdValidation = [
  param("templateId")
    .notEmpty()
    .withMessage("Template ID is required")
    .isMongoId()
    .withMessage("Invalid template ID")
];

/**
 * Validation rules for semester ID parameter
 */
const semesterIdParamValidation = [
  param("semesterId")
    .notEmpty()
    .withMessage("Semester ID is required")
    .isMongoId()
    .withMessage("Invalid semester ID")
];

/**
 * Validation rules for batch and section parameters
 */
const batchSectionParamValidation = [
  param("semesterId")
    .notEmpty()
    .withMessage("Semester ID is required")
    .isMongoId()
    .withMessage("Invalid semester ID"),

  param("batch")
    .notEmpty()
    .withMessage("Batch is required")
    .isInt({ min: 1, max: 2 })
    .withMessage("Batch must be 1 or 2"),

  param("section")
    .trim()
    .notEmpty()
    .withMessage("Section is required")
    .isLength({ min: 1, max: 20 })
    .withMessage("Section must be between 1 and 20 characters")
];

/**
 * Validation rules for query parameters
 */
const templateQueryValidation = [
  query("semesterId")
    .optional()
    .isMongoId()
    .withMessage("Invalid semester ID"),

  query("batch")
    .optional()
    .isInt({ min: 1, max: 2 })
    .withMessage("Batch must be 1 or 2"),

  query("section")
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Section must be between 1 and 20 characters"),

  query("group")
    .optional()
    .isInt({ min: 1, max: 2 })
    .withMessage("Group must be 1 or 2"),

  query("courseCode")
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Course code must be between 1 and 20 characters"),

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

/**
 * Validation rules for duplicate template
 */
const duplicateTemplateValidation = [
  param("templateId")
    .notEmpty()
    .withMessage("Template ID is required")
    .isMongoId()
    .withMessage("Invalid template ID"),

  body("semesterId")
    .optional()
    .isMongoId()
    .withMessage("Invalid semester ID"),

  body("batch")
    .optional()
    .isInt({ min: 1, max: 2 })
    .withMessage("Batch must be 1 or 2"),

  body("section")
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Section must be between 1 and 20 characters"),

  body("group")
    .optional()
    .isInt({ min: 1, max: 2 })
    .withMessage("Group must be 1 or 2"),

  body("courseCode")
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Course code must be between 3 and 20 characters"),

  body("courseName")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Course name must be between 3 and 100 characters"),

  body("venue")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Venue must be less than 50 characters"),

  body("labSlots")
    .optional()
    .isArray()
    .withMessage("Lab slots must be an array")
];

module.exports = {
  createClassScheduleTemplateValidation,
  updateClassScheduleTemplateValidation,
  templateIdValidation,
  semesterIdParamValidation,
  batchSectionParamValidation,
  templateQueryValidation,
  duplicateTemplateValidation
};