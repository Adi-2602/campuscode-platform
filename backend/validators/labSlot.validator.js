const { body, query, param } = require("express-validator");

/**
 * Validation rules for creating a lab slot
 */
const createLabSlotValidation = [
  body("slotCode")
    .trim()
    .notEmpty()
    .withMessage("Slot code is required")
    .matches(/^P\d{1,2}$/i)
    .withMessage("Slot code must be in format: P1, P2, P47, etc.")
    .customSanitizer(value => value.toUpperCase()),

  body("day")
    .trim()
    .notEmpty()
    .withMessage("Day is required")
    .isIn(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
    .withMessage("Day must be one of: Monday, Tuesday, Wednesday, Thursday, Friday"),

  body("startTime")
    .trim()
    .notEmpty()
    .withMessage("Start time is required")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Start time must be in HH:MM format (24-hour)"),

  body("endTime")
    .trim()
    .notEmpty()
    .withMessage("End time is required")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("End time must be in HH:MM format (24-hour)")
    .custom((value, { req }) => {
      if (!req.body.startTime) return true;

      const [startHour, startMin] = req.body.startTime.split(":").map(Number);
      const [endHour, endMin] = value.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        throw new Error("End time must be after start time");
      }

      return true;
    }),

  body("batch")
    .notEmpty()
    .withMessage("Batch is required")
    .isInt({ min: 1, max: 2 })
    .withMessage("Batch must be 1 or 2"),

  body("hourOrder")
    .notEmpty()
    .withMessage("Hour order is required")
    .isInt({ min: 1, max: 12 })
    .withMessage("Hour order must be between 1 and 12"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value")
];

/**
 * Validation rules for updating a lab slot
 */
const updateLabSlotValidation = [
  param("slotId")
    .notEmpty()
    .withMessage("Slot ID is required")
    .isMongoId()
    .withMessage("Invalid slot ID"),

  body("slotCode")
    .optional()
    .trim()
    .matches(/^P\d{1,2}$/i)
    .withMessage("Slot code must be in format: P1, P2, P47, etc.")
    .customSanitizer(value => value.toUpperCase()),

  body("day")
    .optional()
    .trim()
    .isIn(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
    .withMessage("Day must be one of: Monday, Tuesday, Wednesday, Thursday, Friday"),

  body("startTime")
    .optional()
    .trim()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Start time must be in HH:MM format (24-hour)"),

  body("endTime")
    .optional()
    .trim()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("End time must be in HH:MM format (24-hour)"),

  body("batch")
    .optional()
    .isInt({ min: 1, max: 2 })
    .withMessage("Batch must be 1 or 2"),

  body("hourOrder")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("Hour order must be between 1 and 12"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value")
];

/**
 * Validation rules for slot ID parameter
 */
const slotIdValidation = [
  param("slotId")
    .notEmpty()
    .withMessage("Slot ID is required")
    .isMongoId()
    .withMessage("Invalid slot ID")
];

/**
 * Validation rules for batch parameter
 */
const batchParamValidation = [
  param("batch")
    .notEmpty()
    .withMessage("Batch is required")
    .isInt({ min: 1, max: 2 })
    .withMessage("Batch must be 1 or 2")
];

/**
 * Validation rules for query parameters
 */
const labSlotQueryValidation = [
  query("batch")
    .optional()
    .isInt({ min: 1, max: 2 })
    .withMessage("Batch must be 1 or 2"),

  query("day")
    .optional()
    .trim()
    .isIn(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
    .withMessage("Day must be one of: Monday, Tuesday, Wednesday, Thursday, Friday"),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),

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
  createLabSlotValidation,
  updateLabSlotValidation,
  slotIdValidation,
  batchParamValidation,
  labSlotQueryValidation
};