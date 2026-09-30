const express = require("express");
const {
  verifyTeacherAccount,
  bulkImportStudentsHandler
} = require("../controllers/admin.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * 📝 NOTE: This file handles basic admin operations
 ...
 */

/**
 * @swagger
 * /admin/students/bulk-import:
 *   post:
 *     summary: Bulk import students
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [data]
 *     responses:
 *       200:
 *         description: Import results
 */
router.post(
  "/students/bulk-import",
  authenticate,
  authorizeRoles("admin", "superadmin"),
  bulkImportStudentsHandler
);

/**
 * @swagger
 * /admin/verify-teacher:
 ...
 */
router.post(
  "/verify-teacher",
  authenticate,
  authorizeRoles("superadmin"),
  verifyTeacherAccount
);

module.exports = router;