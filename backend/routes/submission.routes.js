const express = require("express");
const {
  submitCodeHandler
} = require("../controllers/submission.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * /student/exams/{examId}/questions/{questionId}/submit:
 *   post:
 *     summary: Submit code for a question
 *     description: Student submits source code for a specific question in an exam
 *     tags: [Student Submission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - languageId
 *               - sourceCode
 *             properties:
 *               languageId:
 *                 type: number
 *               sourceCode:
 *                 type: string
 *               stdin:
 *                 type: string
 *     responses:
 *       201:
 *         description: Submission successful
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (student only)
 */

router.post(
  "/exams/:examId/questions/:questionId/submit",
  authenticate,
  authorizeRoles("student"),
  submitCodeHandler
);

module.exports = router;
