const express = require("express");
const {
  publishResultsHandler
} = require("../controllers/resultPublish.controller");
const {
  authenticate,
  authorize
} = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * /teacher/exams/{examId}/publish-results:
 *   post:
 *     summary: Publish exam results immediately
 *     description: Publishes the results of an exam so students can view them immediately. This makes all evaluated results visible to students. Use this after completing manual or auto-evaluation.
 *     tags: [Teacher Result]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID whose results should be published
 *         example: "697994f50b2d55e2878d747c"
 *     responses:
 *       200:
 *         description: Results published successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Results published successfully"
 *                 publishedCount:
 *                   type: number
 *                   example: 45
 *                   description: Number of student results published
 *                 publishedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-01-30T16:00:00Z"
 *       400:
 *         description: Invalid request (results already published, no evaluations found)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Results already published for this exam"
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       403:
 *         description: Forbidden (teacher only or not exam owner)
 *       404:
 *         description: Exam not found
 */
router.post(
  "/exams/:examId/publish-results",
  authenticate,
  authorize("teacher"),
  publishResultsHandler
);

module.exports = router;