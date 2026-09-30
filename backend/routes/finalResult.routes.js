const express = require("express");
const {
  scheduleFinalResultHandler
} = require("../controllers/finalResult.controller");

const {
  authenticate,
  authorize
} = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * /teacher/exams/{examId}/schedule-result:
 *   post:
 *     summary: Schedule final result publication
 *     description: Teacher schedules when the final results of an exam will be published to students. This allows delayed result publication after evaluation is complete.
 *     tags: [Teacher Result]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *         example: "697994f50b2d55e2878d747c"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - evaluationType
 *               - publishAt
 *             properties:
 *               studentId:
 *                 type: string
 *                 example: "6979938b0b2d55e2878d7462"
 *                 description: Student ID whose result is being scheduled
 *               evaluationType:
 *                 type: string
 *                 enum: [auto, manual, hybrid]
 *                 example: "manual"
 *                 description: Type of evaluation performed (auto/manual/hybrid)
 *               publishAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-02-15T10:00:00Z"
 *                 description: Date and time when result should be published (ISO 8601 format)
 *           examples:
 *             scheduleForTomorrow:
 *               summary: Schedule result for tomorrow
 *               value:
 *                 studentId: "6979938b0b2d55e2878d7462"
 *                 evaluationType: "manual"
 *                 publishAt: "2026-02-01T09:00:00Z"
 *             scheduleForNextWeek:
 *               summary: Schedule result for next week
 *               value:
 *                 studentId: "6979938b0b2d55e2878d7462"
 *                 evaluationType: "hybrid"
 *                 publishAt: "2026-02-07T14:00:00Z"
 *             autoEvaluationSchedule:
 *               summary: Schedule auto-evaluated result
 *               value:
 *                 studentId: "6979938b0b2d55e2878d7462"
 *                 evaluationType: "auto"
 *                 publishAt: "2026-01-31T12:00:00Z"
 *     responses:
 *       201:
 *         description: Result scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Result scheduled successfully"
 *                 finalResult:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     studentId:
 *                       type: string
 *                     examId:
 *                       type: string
 *                     evaluationType:
 *                       type: string
 *                     publishAt:
 *                       type: string
 *                       format: date-time
 *                     published:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Invalid input (missing fields, invalid date format, past date)
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       403:
 *         description: Forbidden (teacher only)
 *       404:
 *         description: Exam not found or teacher doesn't own this exam
 */

router.post(
  "/exams/:examId/schedule-result",
  authenticate,
  authorize("teacher"),
  scheduleFinalResultHandler
);

module.exports = router;