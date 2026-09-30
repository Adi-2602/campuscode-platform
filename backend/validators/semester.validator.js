const { body, query, param } = require("express-validator");

/**
 * Validation rules for creating a semester
 */
const createSemesterValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Semester name is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Semester name must be between 3 and 50 characters")
    .matches(/^Semester [IVX]+$|^Sem [0-9]+$/)
    .withMessage("Semester name should be in format: 'Semester IV' or 'Sem 4'"),

  body("academicYear")
    .trim()
    .notEmpty()
    .withMessage("Academic year is required")
    .matches(/^\d{4}-\d{2}$/)
    .withMessage("Academic year should be in format: 'YYYY-YY' (e.g., '2023-24')"),

  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date")
    .custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid start date");
      }
      return true;
    }),

  body("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(value);

      if (isNaN(endDate.getTime())) {
        throw new Error("Invalid end date");
      }

      if (endDate <= startDate) {
        throw new Error("End date must be after start date");
      }

      return true;
    }),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value")
];

/**
 * Validation rules for updating a semester
 */
const updateSemesterValidation = [
  param("semesterId")
    .notEmpty()
    .withMessage("Semester ID is required")
    .isMongoId()
    .withMessage("Invalid semester ID"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Semester name must be between 3 and 50 characters")
    .matches(/^Semester [IVX]+$|^Sem [0-9]+$/)
    .withMessage("Semester name should be in format: 'Semester IV' or 'Sem 4'"),

  body("academicYear")
    .optional()
    .trim()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage("Academic year should be in format: 'YYYY-YY' (e.g., '2023-24')"),

  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value")
];

/**
 * Validation rules for semester ID parameter
 */
const semesterIdValidation = [
  param("semesterId")
    .notEmpty()
    .withMessage("Semester ID is required")
    .isMongoId()
    .withMessage("Invalid semester ID")
];

/**
 * Validation rules for query parameters
 */
const semesterQueryValidation = [
  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),

  query("academicYear")
    .optional()
    .trim()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage("Academic year should be in format: 'YYYY-YY' (e.g., '2023-24')"),

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
  createSemesterValidation,
  updateSemesterValidation,
  semesterIdValidation,
  semesterQueryValidation
};