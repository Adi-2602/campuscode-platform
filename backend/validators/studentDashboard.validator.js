const { param } = require("express-validator");

/**
 * Validation rules for day parameter
 */
const dayParamValidation = [
  param("day")
    .trim()
    .notEmpty()
    .withMessage("Day is required")
    .isIn(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"])
    .withMessage("Invalid day. Must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday")
    .customSanitizer(value => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase())
];

module.exports = {
  dayParamValidation
};