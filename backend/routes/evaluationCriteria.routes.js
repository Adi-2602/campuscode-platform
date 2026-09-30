const express = require("express");
const {
  createEvaluationCriteriaHandler,
  getEvaluationCriteriaHandler,
  updateEvaluationCriteriaHandler,
  deleteEvaluationCriteriaHandler
} = require("../controllers/evaluationCriteria.controller");

const {
  authenticate,
  authorize
} = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * /teacher/evaluation-criteria:
 *   post:
 *     summary: Create evaluation criteria (rubric) for manual evaluation
 *     description: Teacher defines evaluation criteria/rubric for manually grading exam questions. This is used when auto-evaluation is not sufficient and manual code review is needed.
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
 *               - examId
 *               - questionId
 *               - criteria
 *               - totalMarks
 *             properties:
 *               examId:
 *                 type: string
 *                 example: "697994f50b2d55e2878d747c"
 *                 description: The exam ID for which criteria is being created
 *               questionId:
 *                 type: string
 *                 example: "697994170b2d55e2878d746a"
 *                 description: The question ID within the exam
 *               totalMarks:
 *                 type: number
 *                 example: 100
 *                 description: Total marks for this question (sum of all criteria maxMarks)
 *               criteria:
 *                 type: array
 *                 description: Array of evaluation criteria (rubric items)
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - maxMarks
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Code Quality"
 *                       description: Name of the criterion
 *                     maxMarks:
 *                       type: number
 *                       example: 30
 *                       description: Maximum marks for this criterion
 *                 example:
 *                   - name: "Code Quality"
 *                     maxMarks: 30
 *                   - name: "Logic & Efficiency"
 *                     maxMarks: 40
 *                   - name: "Comments & Readability"
 *                     maxMarks: 30
 *           examples:
 *             basicRubric:
 *               summary: Basic code evaluation rubric
 *               value:
 *                 examId: "697994f50b2d55e2878d747c"
 *                 questionId: "697994170b2d55e2878d746a"
 *                 totalMarks: 100
 *                 criteria:
 *                   - name: "Code Quality"
 *                     maxMarks: 30
 *                   - name: "Logic & Efficiency"
 *                     maxMarks: 40
 *                   - name: "Comments & Readability"
 *                     maxMarks: 30
 *             detailedRubric:
 *               summary: Detailed evaluation rubric
 *               value:
 *                 examId: "697994f50b2d55e2878d747c"
 *                 questionId: "697994170b2d55e2878d746a"
 *                 totalMarks: 100
 *                 criteria:
 *                   - name: "Correctness"
 *                     maxMarks: 25
 *                   - name: "Code Structure"
 *                     maxMarks: 20
 *                   - name: "Algorithm Efficiency"
 *                     maxMarks: 25
 *                   - name: "Error Handling"
 *                     maxMarks: 15
 *                   - name: "Documentation"
 *                     maxMarks: 15
 *     responses:
 *       201:
 *         description: Evaluation criteria created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Evaluation criteria created successfully"
 *                 rubric:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     examId:
 *                       type: string
 *                     questionId:
 *                       type: string
 *                     criteria:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalMarks:
 *                       type: number
 *                     createdBy:
 *                       type: string
 *       400:
 *         description: Invalid input (missing fields, totalMarks mismatch)
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       403:
 *         description: Forbidden (teacher only)
 */

router.post(
  "/evaluation-criteria",
  authenticate,
  authorize("teacher"),
  createEvaluationCriteriaHandler
);

/**
 * @swagger
 * /teacher/evaluation-criteria/exam/{examId}/question/{questionId}:
 *   get:
 *     summary: Get evaluation criteria for an exam and question
 *     tags: [Teacher Evaluation]
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
 *     responses:
 *       200:
 *         description: Evaluation criteria retrieved
 *       404:
 *         description: Not found
 */
router.get(
  "/evaluation-criteria/exam/:examId/question/:questionId",
  authenticate,
  authorize("teacher"),
  getEvaluationCriteriaHandler
);

/**
 * @swagger
 * /teacher/evaluation-criteria/{id}:
 *   put:
 *     summary: Update evaluation criteria
 *     tags: [Teacher Evaluation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - criteria
 *               - totalMarks
 *     responses:
 *       200:
 *         description: Updated successfully
 */
router.put(
  "/evaluation-criteria/:id",
  authenticate,
  authorize("teacher"),
  updateEvaluationCriteriaHandler
);

/**
 * @swagger
 * /teacher/evaluation-criteria/{id}:
 *   delete:
 *     summary: Delete evaluation criteria
 *     tags: [Teacher Evaluation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted successfully
 */
router.delete(
  "/evaluation-criteria/:id",
  authenticate,
  authorize("teacher"),
  deleteEvaluationCriteriaHandler
);

module.exports = router;