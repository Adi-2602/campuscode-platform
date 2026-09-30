const express = require("express");

const {
  getSystemStatsHandler,
  getStudentPerformanceHandler,
  getExamStatisticsHandler,
  getClassPerformanceHandler,
  getTeacherActivityHandler,
  getSubmissionTrendsHandler,
  getLeaderboardHandler,
  getDashboardOverviewHandler,
  getExamAnalyticsSummaryHandler,
  compareClassesHandler
} = require("../controllers/analytics.controller");

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
 *   name: Phase 3 - Analytics
 *   description: Analytics dashboard and performance metrics (VIEW_ANALYTICS)
 */

/**
 * @swagger
 * /admin/monitoring/analytics/dashboard:
 *   get:
 *     summary: Get dashboard overview
 *     description: Get combined analytics dashboard with system stats, trends, and top performers
 *     tags: [Phase 3 - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 dashboard:
 *                   type: object
 *                   properties:
 *                     systemStats:
 *                       type: object
 *                     recentTrends:
 *                       type: object
 *                     topPerformers:
 *                       type: array
 *       403:
 *         description: Permission denied (requires VIEW_ANALYTICS)
 */
router.get(
  "/dashboard",
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  getDashboardOverviewHandler
);

/**
 * @swagger
 * /admin/monitoring/analytics/system-stats:
 *   get:
 *     summary: Get system statistics
 *     description: View overall system statistics (users, classes, exams, submissions)
 *     tags: [Phase 3 - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         students:
 *                           type: number
 *                         teachers:
 *                           type: number
 *                         activeStudents:
 *                           type: number
 *                         activeTeachers:
 *                           type: number
 *                     classes:
 *                       type: number
 *                     exams:
 *                       type: number
 *                     submissions:
 *                       type: number
 *       403:
 *         description: Permission denied (requires VIEW_ANALYTICS)
 */
router.get(
  "/system-stats",
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  getSystemStatsHandler
);

/**
 * @swagger
 * /admin/monitoring/analytics/student-performance:
 *   get:
 *     summary: Get student performance analytics
 *     description: View student performance metrics with average scores and pass rates
 *     tags: [Phase 3 - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *         description: Filter by student ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *     responses:
 *       200:
 *         description: Student performance analytics retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_ANALYTICS)
 */
router.get(
  "/student-performance",
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  getStudentPerformanceHandler
);

/**
 * @swagger
 * /admin/monitoring/analytics/exam-statistics:
 *   get:
 *     summary: Get exam statistics
 *     description: View exam statistics with completion rates, pass rates, and averages
 *     tags: [Phase 3 - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: examId
 *         schema:
 *           type: string
 *         description: Filter by exam ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *         description: Filter by teacher ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Exam statistics retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_ANALYTICS)
 */
router.get(
  "/exam-statistics",
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  getExamStatisticsHandler
);

/**
 * @swagger
 * /admin/monitoring/analytics/classes/{classId}/performance:
 *   get:
 *     summary: Get class performance metrics
 *     description: View performance metrics for a specific class
 *     tags: [Phase 3 - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class performance metrics retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_ANALYTICS)
 *       404:
 *         description: Class not found
 */
router.get(
  "/classes/:classId/performance",
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  getClassPerformanceHandler
);

/**
 * @swagger
 * /admin/monitoring/analytics/teachers/{teacherId}/activity:
 *   get:
 *     summary: Get teacher activity analytics
 *     description: View teacher activity statistics (classes, exams, questions created)
 *     tags: [Phase 3 - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
 *     responses:
 *       200:
 *         description: Teacher activity analytics retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_ANALYTICS)
 */
router.get(
  "/teachers/:teacherId/activity",
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  getTeacherActivityHandler
);

/**
 * @swagger
 * /admin/monitoring/analytics/submission-trends:
 *   get:
 *     summary: Get submission trends
 *     description: View submission trends over time (hourly, daily, weekly, monthly)
 *     tags: [Phase 3 - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hourly, daily, weekly, monthly]
 *           default: daily
 *         description: Time period for trends
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 7
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: Submission trends retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_ANALYTICS)
 */
router.get(
  "/submission-trends",
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  getSubmissionTrendsHandler
);

/**
 * @swagger
 * /admin/monitoring/analytics/leaderboard:
 *   get:
 *     summary: Get leaderboard (top performers)
 *     description: View top performing students based on average percentage
 *     tags: [Phase 3 - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: examId
 *         schema:
 *           type: string
 *         description: Filter by exam ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Number of top students to return
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: number
 *                       studentName:
 *                         type: string
 *                       studentEmail:
 *                         type: string
 *                       studentRollNo:
 *                         type: string
 *                       totalExams:
 *                         type: number
 *                       averagePercentage:
 *                         type: number
 *                 totalStudents:
 *                   type: number
 *       403:
 *         description: Permission denied (requires VIEW_ANALYTICS)
 */
router.get(
  "/leaderboard",
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  getLeaderboardHandler
);

/**
 * @swagger
 * /admin/monitoring/analytics/exams/{examId}/summary:
 *   get:
 *     summary: Get exam analytics summary
 *     description: View detailed analytics for a specific exam
 *     tags: [Phase 3 - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     responses:
 *       200:
 *         description: Exam analytics summary retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_ANALYTICS)
 *       404:
 *         description: Exam not found
 */
router.get(
  "/exams/:examId/summary",
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  getExamAnalyticsSummaryHandler
);

/**
 * @swagger
 * /admin/monitoring/analytics/classes/compare:
 *   post:
 *     summary: Compare multiple classes
 *     description: Compare performance metrics across multiple classes
 *     tags: [Phase 3 - Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classIds
 *             properties:
 *               classIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *     responses:
 *       200:
 *         description: Class comparison retrieved successfully
 *       400:
 *         description: classIds array is required
 *       403:
 *         description: Permission denied (requires VIEW_ANALYTICS)
 */
router.post(
  "/classes/compare",
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  compareClassesHandler
);

module.exports = router;