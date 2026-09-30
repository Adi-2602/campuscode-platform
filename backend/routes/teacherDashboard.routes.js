const express = require("express");

const {
  getWeeklyScheduleHandler,
  getDailyScheduleHandler,
  getUpcomingClassesHandler,
  getAllClassesHandler,
  getLoadSummaryHandler
} = require("../controllers/teacherDashboard.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

// All teacher dashboard routes require teacher authentication
router.use(authenticate, authorizeRoles("teacher"));

/**
 * @swagger
 * tags:
 *   name: Teacher Dashboard
 *   description: Teacher schedule and class management APIs
 */

/**
 * @swagger
 * /teacher/schedule/weekly:
 *   get:
 *     summary: Get weekly schedule
 *     description: Get teacher's complete weekly schedule with all assigned classes
 *     tags: [Teacher Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly schedule retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 schedule:
 *                   type: object
 *                   description: Classes grouped by day (Monday-Saturday)
 *                 formatted:
 *                   type: array
 *                   description: Formatted schedule for UI display
 *                 totalClasses:
 *                   type: integer
 *                   description: Total number of assigned classes
 *                 daysWithClasses:
 *                   type: array
 *                   description: Days that have classes
 *                 weeklyHours:
 *                   type: object
 *                   description: Total weekly teaching hours
 *                 currentDay:
 *                   type: object
 *                   description: Today's classes
 *                 nextClass:
 *                   type: object
 *                   description: Next upcoming class
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teachers only)
 */
router.get("/schedule/weekly", getWeeklyScheduleHandler);

/**
 * @swagger
 * /teacher/schedule/day/{day}:
 *   get:
 *     summary: Get daily schedule
 *     description: Get schedule for a specific day of the week
 *     tags: [Teacher Dashboard]
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
 *         description: Forbidden (teachers only)
 */
router.get("/schedule/day/:day", getDailyScheduleHandler);

/**
 * @swagger
 * /teacher/classes/upcoming:
 *   get:
 *     summary: Get upcoming classes
 *     description: Get all classes scheduled in the next 7 days
 *     tags: [Teacher Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming classes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 upcoming:
 *                   type: array
 *                   description: List of upcoming class sessions with dates
 *                 totalUpcoming:
 *                   type: integer
 *                   description: Total number of upcoming classes
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
 *         description: Forbidden (teachers only)
 */
router.get("/classes/upcoming", getUpcomingClassesHandler);

/**
 * @swagger
 * /teacher/classes/all:
 *   get:
 *     summary: Get all assigned classes
 *     description: Get complete list of all classes teacher is assigned to (as main or co-faculty)
 *     tags: [Teacher Dashboard]
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
 *                   description: List of assigned classes with student counts
 *                 total:
 *                   type: integer
 *                   description: Total number of classes
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teachers only)
 */
router.get("/classes/all", getAllClassesHandler);

/**
 * @swagger
 * /teacher/load/summary:
 *   get:
 *     summary: Get teaching load summary
 *     description: Get summary of teacher's workload (hours, classes, batches, sections)
 *     tags: [Teacher Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Load summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClasses:
 *                   type: integer
 *                   description: Total number of classes
 *                 asMainFaculty:
 *                   type: integer
 *                   description: Classes as main faculty
 *                 asCoFaculty:
 *                   type: integer
 *                   description: Classes as co-faculty
 *                 weeklyHours:
 *                   type: object
 *                   description: Total weekly teaching hours
 *                 uniqueBatches:
 *                   type: integer
 *                   description: Number of unique batches taught
 *                 uniqueSections:
 *                   type: integer
 *                   description: Number of unique sections taught
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teachers only)
 */
router.get("/load/summary", getLoadSummaryHandler);

module.exports = router;