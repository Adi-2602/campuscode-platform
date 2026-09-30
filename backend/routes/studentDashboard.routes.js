const express = require("express");

const {
  getWeeklyTimetableHandler,
  getDailyScheduleHandler,
  getUpcomingLabsHandler,
  getAllClassesHandler,
  getDashboardStatsHandler
} = require("../controllers/studentDashboard.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

// All student dashboard routes require student authentication
router.use(authenticate, authorizeRoles("student"));

/**
 * @swagger
 * tags:
 *   name: Student Dashboard
 *   description: Student timetable and schedule APIs
 */

/**
 * @swagger
 * /student/timetable/weekly:
 *   get:
 *     summary: Get weekly timetable
 *     description: Get student's complete weekly timetable with all lab classes
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly timetable retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timetable:
 *                   type: object
 *                   description: Classes grouped by day (Monday-Saturday)
 *                 formatted:
 *                   type: array
 *                   description: Formatted timetable for UI display
 *                 totalClasses:
 *                   type: integer
 *                   description: Total number of enrolled classes
 *                 daysWithClasses:
 *                   type: array
 *                   description: Days that have classes
 *                 weeklyHours:
 *                   type: object
 *                   description: Total weekly hours calculation
 *                 currentDay:
 *                   type: object
 *                   description: Today's classes
 *                 nextClass:
 *                   type: object
 *                   description: Next upcoming class
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (students only)
 */
router.get("/timetable/weekly", getWeeklyTimetableHandler);

/**
 * @swagger
 * /student/timetable/day/{day}:
 *   get:
 *     summary: Get daily schedule
 *     description: Get schedule for a specific day of the week
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: day
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]
 *         description: Day of the week
 *     responses:
 *       200:
 *         description: Daily schedule retrieved successfully
 *       400:
 *         description: Invalid day
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (students only)
 */
router.get("/timetable/day/:day", getDailyScheduleHandler);

/**
 * @swagger
 * /student/labs/upcoming:
 *   get:
 *     summary: Get upcoming labs
 *     description: Get all labs scheduled in the next 7 days
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming labs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 upcoming:
 *                   type: array
 *                   description: List of upcoming lab sessions with dates
 *                 totalUpcoming:
 *                   type: integer
 *                   description: Total number of upcoming labs
 *                 startDate:
 *                   type: string
 *                   format: date
 *                   description: Start date of the 7-day window
 *                 endDate:
 *                   type: string
 *                   format: date
 *                   description: End date of the 7-day window
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (students only)
 */
router.get("/labs/upcoming", getUpcomingLabsHandler);

/**
 * @swagger
 * /student/classes:
 *   get:
 *     summary: Get all enrolled classes
 *     description: Get complete list of all classes student is enrolled in
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Classes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 classes:
 *                   type: array
 *                   description: List of enrolled classes
 *                 total:
 *                   type: integer
 *                   description: Total number of classes
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (students only)
 */
router.get("/classes", getAllClassesHandler);

/**
 * @swagger
 * /student/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Get aggregated metrics for student dashboard
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (students only)
 */
router.get("/stats", getDashboardStatsHandler);

module.exports = router;