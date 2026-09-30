const express = require("express");

const {
  generateStudentReportHandler,
  generateExamReportHandler,
  generateClassReportHandler,
  generateTeacherReportHandler,
  generateCustomReportHandler,
  getAvailableReportTypesHandler
} = require("../controllers/reporting.controller");

const { authenticate } = require("../middlewares/auth.middleware");
const {
  requirePermission,
  requireAdminRole
} = require("../middlewares/permission.middleware");

const { PERMISSIONS } = require("../constants/permissions");

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdminRole());

/**
 * @swagger
 * tags:
 *   name: Phase 3 - Reports
 *   description: Advanced PDF report generation (GENERATE_REPORTS)
 */

/**
 * @swagger
 * /admin/monitoring/reports/types:
 *   get:
 *     summary: Get available report types
 *     description: List all available report types with their descriptions and required filters
 *     tags: [Phase 3 - Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Report types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 reportTypes:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Permission denied (requires GENERATE_REPORTS)
 */
router.get(
  "/types",
  requirePermission(PERMISSIONS.GENERATE_REPORTS),
  getAvailableReportTypesHandler
);

/**
 * @swagger
 * /admin/monitoring/reports/student-performance:
 *   post:
 *     summary: Generate student performance report
 *     description: Generate a PDF report with student performance analytics, exam results, and analysis
 *     tags: [Phase 3 - Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: Student ID
 *     responses:
 *       200:
 *         description: PDF report generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: studentId is required
 *       404:
 *         description: Student not found
 *       403:
 *         description: Permission denied (requires GENERATE_REPORTS)
 */
router.post(
  "/student-performance",
  requirePermission(PERMISSIONS.GENERATE_REPORTS),
  generateStudentReportHandler
);

/**
 * @swagger
 * /admin/monitoring/reports/exam-analysis:
 *   post:
 *     summary: Generate exam analysis report
 *     description: Generate a PDF report with exam statistics and student results
 *     tags: [Phase 3 - Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - examId
 *             properties:
 *               examId:
 *                 type: string
 *                 description: Exam ID
 *     responses:
 *       200:
 *         description: PDF report generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: examId is required
 *       404:
 *         description: Exam not found
 */
router.post(
  "/exam-analysis",
  requirePermission(PERMISSIONS.GENERATE_REPORTS),
  generateExamReportHandler
);

/**
 * @swagger
 * /admin/monitoring/reports/class-performance:
 *   post:
 *     summary: Generate class performance report
 *     description: Generate a PDF report with class metrics and exam list
 *     tags: [Phase 3 - Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classId
 *             properties:
 *               classId:
 *                 type: string
 *                 description: Class ID
 *     responses:
 *       200:
 *         description: PDF report generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: classId is required
 *       404:
 *         description: Class not found
 */
router.post(
  "/class-performance",
  requirePermission(PERMISSIONS.GENERATE_REPORTS),
  generateClassReportHandler
);

/**
 * @swagger
 * /admin/monitoring/reports/teacher-activity:
 *   post:
 *     summary: Generate teacher activity report
 *     description: Generate a PDF report with teacher's classes, exams, and activity metrics
 *     tags: [Phase 3 - Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacherId
 *             properties:
 *               teacherId:
 *                 type: string
 *                 description: Teacher ID
 *     responses:
 *       200:
 *         description: PDF report generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: teacherId is required
 *       404:
 *         description: Teacher not found
 */
router.post(
  "/teacher-activity",
  requirePermission(PERMISSIONS.GENERATE_REPORTS),
  generateTeacherReportHandler
);

/**
 * @swagger
 * /admin/monitoring/reports/custom:
 *   post:
 *     summary: Generate custom report
 *     description: Generate a custom PDF report based on report type and filters
 *     tags: [Phase 3 - Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportType
 *               - filters
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [student_performance, exam_analysis, class_performance, teacher_activity]
 *               filters:
 *                 type: object
 *                 description: Filters based on report type (studentId, examId, classId, or teacherId)
 *           example:
 *             reportType: "student_performance"
 *             filters:
 *               studentId: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: PDF report generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid request (missing reportType or filters)
 */
router.post(
  "/custom",
  requirePermission(PERMISSIONS.GENERATE_REPORTS),
  generateCustomReportHandler
);

module.exports = router;