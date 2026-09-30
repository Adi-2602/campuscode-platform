const express = require("express");
const {
  submitManualEvaluationHandler,
  getExamSubmissionsHandler
} = require("../controllers/manualEvaluation.controller");

const {
  authenticate,
  authorize
} = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * /teacher/exams/{examId}/submissions:
 *   get:
 *     summary: Get exam submissions for manual evaluation
 *     description: Teacher fetches all student submissions for a specific exam with auto-evaluation results
 *     tags: [Teacher Evaluation]
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
 *         description: Submissions fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   studentId:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                   questionId:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                   sourceCode:
 *                     type: string
 *                   languageId:
 *                     type: number
 *                   autoMarks:
 *                     type: number
 *                   passedTestCases:
 *                     type: number
 *                   totalTestCases:
 *                     type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher only)
 *       404:
 *         description: Exam or submissions not found
 */
router.get(
  "/exams/:examId/submissions",
  authenticate,
  authorize("teacher"),
  getExamSubmissionsHandler
);

/**
 * @swagger
 * /teacher/manual-evaluation:
 *   post:
 *     summary: Submit manual evaluation
 *     description: Teacher submits scores based on evaluation criteria (rubric) for a student's exam question
 *     tags: [Teacher Evaluation]
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
 *               - examId
 *               - questionId
 *               - scores
 *             properties:
 *               studentId:
 *                 type: string
 *                 example: "6979938b0b2d55e2878d7462"
 *                 description: Student user ID
 *               examId:
 *                 type: string
 *                 example: "697994f50b2d55e2878d747c"
 *                 description: Exam ID
 *               questionId:
 *                 type: string
 *                 example: "697994170b2d55e2878d746a"
 *                 description: Question ID
 *               scores:
 *                 type: array
 *                 description: Array of criterion scores based on evaluation criteria
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - marksAwarded
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Code Quality"
 *                       description: Criterion name (must match evaluation criteria)
 *                     marksAwarded:
 *                       type: number
 *                       example: 25
 *                       description: Marks awarded for this criterion (cannot exceed maxMarks)
 *                 example:
 *                   - name: "Code Quality"
 *                     marksAwarded: 25
 *                   - name: "Logic & Efficiency"
 *                     marksAwarded: 35
 *                   - name: "Comments & Readability"
 *                     marksAwarded: 20
 *               remarks:
 *                 type: string
 *                 example: "Good solution but needs better comments and code formatting"
 *                 description: Optional feedback for the student
 *     responses:
 *       201:
 *         description: Manual evaluation submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Manual evaluation submitted successfully"
 *                 manualEvaluation:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     studentId:
 *                       type: string
 *                     examId:
 *                       type: string
 *                     questionId:
 *                       type: string
 *                     scores:
 *                       type: array
 *                     totalMarks:
 *                       type: number
 *                       description: Auto-calculated sum of marksAwarded
 *                     remarks:
 *                       type: string
 *                     evaluatedBy:
 *                       type: string
 *       400:
 *         description: Missing or invalid fields, marks exceed maximum, or evaluation criteria not defined
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher only)
 */
router.post(
  "/manual-evaluation",
  authenticate,
  authorize("teacher"),
  submitManualEvaluationHandler
);

module.exports = router;