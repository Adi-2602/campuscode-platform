/**
 * PHASE 9: EXAM LAB SCHEDULE INTEGRATION
 * 
 * Add these routes to your existing routes/teacher.routes.js
 */

// Import the new handlers
const {
  getClassScheduleHandler,
  getSuggestedExamSlotsHandler,
  validateExamTimingHandler,
  getLabScheduleForExamHandler
} = require("../controllers/teacher.controller");

/**
 * @swagger
 * /teacher/classes/{classId}/schedule:
 *   get:
 *     summary: Get class lab schedule
 *     description: Get detailed lab schedule information for a specific class
 *     tags: [Teacher - Exam Lab Schedule]
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
 *         description: Schedule retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 classId:
 *                   type: string
 *                 className:
 *                   type: string
 *                 labSchedule:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                       example: "Friday"
 *                     startTime:
 *                       type: string
 *                       example: "01:25"
 *                     endTime:
 *                       type: string
 *                       example: "03:10"
 *                     duration:
 *                       type: integer
 *                       example: 105
 *       400:
 *         description: Class not found or access denied
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teachers only)
 */
router.get("/classes/:classId/schedule", getClassScheduleHandler);

/**
 * @swagger
 * /teacher/classes/{classId}/exam-slots/suggestions:
 *   get:
 *     summary: Get suggested exam time slots
 *     description: Get AI-suggested exam time slots based on regular lab schedule
 *     tags: [Teacher - Exam Lab Schedule]
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
 *         description: Suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: "same_as_lab"
 *                       description:
 *                         type: string
 *                       day:
 *                         type: string
 *                       startTime:
 *                         type: string
 *                       endTime:
 *                         type: string
 *                       duration:
 *                         type: integer
 *                       recommended:
 *                         type: boolean
 *       400:
 *         description: Class not found or access denied
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teachers only)
 */
router.get("/classes/:classId/exam-slots/suggestions", getSuggestedExamSlotsHandler);

/**
 * @swagger
 * /teacher/classes/{classId}/exam-slots/validate:
 *   post:
 *     summary: Validate exam timing
 *     description: Validate proposed exam timing against lab schedule
 *     tags: [Teacher - Exam Lab Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startTime, endTime]
 *             properties:
 *               startTime:
 *                 type: string
 *                 example: "01:25"
 *                 description: Exam start time (HH:MM format)
 *               endTime:
 *                 type: string
 *                 example: "03:10"
 *                 description: Exam end time (HH:MM format)
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 warnings:
 *                   type: array
 *                   items:
 *                     type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 examDuration:
 *                   type: integer
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teachers only)
 */
router.post("/classes/:classId/exam-slots/validate", validateExamTimingHandler);

/**
 * @swagger
 * /teacher/classes/{classId}/exam-prefill:
 *   get:
 *     summary: Get pre-fill data for exam creation
 *     description: Get lab schedule data to auto-fill exam creation form
 *     tags: [Teacher - Exam Lab Schedule]
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
 *         description: Pre-fill data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prefillData:
 *                   type: object
 *                   properties:
 *                     venue:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *                     duration:
 *                       type: integer
 *       400:
 *         description: Class not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teachers only)
 */
router.get("/classes/:classId/exam-prefill", getLabScheduleForExamHandler);

// Export or add to existing router exports