const express = require("express");

const {
  getEnrollmentStatsHandler,
  getLabUtilizationHandler,
  getTeacherLoadHandler,
  exportEnrollmentCSVHandler,
  exportTeachersCSVHandler,
  exportStudentsCSVHandler,
  exportLabUtilizationCSVHandler
} = require("../controllers/adminReports.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

// All admin report routes require admin/superadmin authentication
router.use(authenticate, authorizeRoles("admin", "superadmin"));

/**
 * @swagger
 * tags:
 *   name: Admin Reports
 *   description: Admin reporting and analytics APIs
 */

/**
 * @swagger
 * /admin/reports/semester/{semesterId}/enrollment:
 *   get:
 *     summary: Get enrollment statistics
 *     description: Get detailed enrollment statistics for a semester
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       400:
 *         description: Semester not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/semester/:semesterId/enrollment", getEnrollmentStatsHandler);

/**
 * @swagger
 * /admin/reports/semester/{semesterId}/lab-utilization:
 *   get:
 *     summary: Get lab utilization report
 *     description: Get report on lab slot usage and availability
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     responses:
 *       200:
 *         description: Report retrieved successfully
 *       400:
 *         description: Semester not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/semester/:semesterId/lab-utilization", getLabUtilizationHandler);

/**
 * @swagger
 * /admin/reports/teacher-load:
 *   get:
 *     summary: Get teacher load distribution
 *     description: Get workload distribution across teachers
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semesterId
 *         schema:
 *           type: string
 *         description: Filter by semester (optional)
 *     responses:
 *       200:
 *         description: Distribution retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/teacher-load", getTeacherLoadHandler);

/**
 * @swagger
 * tags:
 *   name: Admin Exports
 *   description: Data export APIs (CSV)
 */

/**
 * @swagger
 * /admin/exports/semester/{semesterId}/enrollment:
 *   get:
 *     summary: Export enrollment data as CSV
 *     description: Download enrollment data in CSV format
 *     tags: [Admin Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/exports/semester/:semesterId/enrollment", exportEnrollmentCSVHandler);

/**
 * @swagger
 * /admin/exports/semester/{semesterId}/teachers:
 *   get:
 *     summary: Export teachers data as CSV
 *     description: Download teacher workload data in CSV format
 *     tags: [Admin Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/exports/semester/:semesterId/teachers", exportTeachersCSVHandler);

/**
 * @swagger
 * /admin/exports/semester/{semesterId}/students:
 *   get:
 *     summary: Export students data as CSV
 *     description: Download student data in CSV format
 *     tags: [Admin Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/exports/semester/:semesterId/students", exportStudentsCSVHandler);

/**
 * @swagger
 * /admin/exports/semester/{semesterId}/lab-utilization:
 *   get:
 *     summary: Export lab utilization as CSV
 *     description: Download lab slot utilization data in CSV format
 *     tags: [Admin Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/exports/semester/:semesterId/lab-utilization", exportLabUtilizationCSVHandler);

module.exports = router;