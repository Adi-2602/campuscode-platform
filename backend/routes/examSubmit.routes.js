const express = require("express");
const {
  submitExamHandler
} = require("../controllers/examSubmit.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * /student/exams/{examId}/submit-manual:
 *   post:
 *     summary: Submit exam for manual evaluation
 *     description: Student manually submits the exam when auto-evaluation is not used. This locks the exam and prevents further submissions. Used for exams that require manual grading by teachers.
 *     tags: [Student Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID to submit
 *         example: "697994f50b2d55e2878d747c"
 *     responses:
 *       200:
 *         description: Exam submitted successfully for manual evaluation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Exam submitted successfully"
 *                 submittedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-01-30T15:30:00Z"
 *       400:
 *         description: Exam already submitted, not started, or submission closed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Exam already submitted"
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       403:
 *         description: Forbidden (student only)
 *       404:
 *         description: Exam not found or not started by student
 */
router.post(
  "/exams/:examId/submit-manual",
  authenticate,
  authorizeRoles("student"),
  submitExamHandler
);

module.exports = router;