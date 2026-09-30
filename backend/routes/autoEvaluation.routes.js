const express = require("express");

const {
  triggerAutoEvaluationHandler,
  getExamAutoEvaluationsHandler,
  getStudentAutoEvaluationHandler,
  getAutoEvaluationStatsHandler
} = require("../controllers/autoEvaluation.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auto Evaluation
 *   description: Automatic code evaluation APIs for teachers
 */

/**
 * @swagger
 * /teacher/exams/{examId}/students/{studentId}/auto-evaluate:
 *   post:
 *     summary: Manually trigger auto-evaluation for a student
 *     description: Teacher manually triggers automatic evaluation for a student who has submitted an exam. Runs code against hidden test cases.
 *     tags: [Auto Evaluation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Auto-evaluation triggered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Auto-evaluation triggered successfully"
 *                 examId:
 *                   type: string
 *                 studentId:
 *                   type: string
 *       400:
 *         description: Student has not submitted exam or exam not started
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher only)
 *       404:
 *         description: Exam not found or unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/exams/:examId/students/:studentId/auto-evaluate",
  authenticate,
  authorizeRoles("teacher"),
  triggerAutoEvaluationHandler
);

/**
 * @swagger
 * /teacher/exams/{examId}/auto-evaluations:
 *   get:
 *     summary: Get all auto-evaluation results for an exam
 *     description: Retrieve all automatic evaluation results for all students who took the exam, grouped by student
 *     tags: [Auto Evaluation]
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
 *         description: Auto-evaluations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exam:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     totalMarks:
 *                       type: number
 *                 evaluations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       student:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           rollNo:
 *                             type: string
 *                       totalMarksObtained:
 *                         type: number
 *                       totalTestCasesPassed:
 *                         type: number
 *                       totalTestCases:
 *                         type: number
 *                       questions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             question:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                 title:
 *                                   type: string
 *                                 difficulty:
 *                                   type: string
 *                             passedTestCases:
 *                               type: number
 *                             totalTestCases:
 *                               type: number
 *                             marksObtained:
 *                               type: number
 *                             executionStats:
 *                               type: object
 *                               properties:
 *                                 time:
 *                                   type: string
 *                                 memory:
 *                                   type: number
 *                             evaluatedAt:
 *                               type: string
 *                               format: date-time
 *                 totalStudentsEvaluated:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher only)
 *       404:
 *         description: Exam not found or unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/exams/:examId/auto-evaluations",
  authenticate,
  authorizeRoles("teacher"),
  getExamAutoEvaluationsHandler
);

/**
 * @swagger
 * /teacher/students/{studentId}/exams/{examId}/auto-evaluation:
 *   get:
 *     summary: Get auto-evaluation results for a specific student's exam
 *     description: Retrieve detailed automatic evaluation results for a specific student's exam submission
 *     tags: [Auto Evaluation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     responses:
 *       200:
 *         description: Auto-evaluation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exam:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     totalMarks:
 *                       type: number
 *                 studentId:
 *                   type: string
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalMarksObtained:
 *                       type: number
 *                     totalTestCasesPassed:
 *                       type: number
 *                     totalTestCases:
 *                       type: number
 *                     percentage:
 *                       type: string
 *                       example: "85.50"
 *                 questionResults:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       question:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           difficulty:
 *                             type: string
 *                       passedTestCases:
 *                         type: number
 *                       totalTestCases:
 *                         type: number
 *                       marksObtained:
 *                         type: number
 *                       executionStats:
 *                         type: object
 *                         properties:
 *                           time:
 *                             type: string
 *                           memory:
 *                             type: number
 *                       evaluatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher only)
 *       404:
 *         description: Exam or auto-evaluation not found
 *       500:
 *         description: Server error
 */
router.get(
  "/students/:studentId/exams/:examId/auto-evaluation",
  authenticate,
  authorizeRoles("teacher"),
  getStudentAutoEvaluationHandler
);

/**
 * @swagger
 * /teacher/exams/{examId}/auto-evaluation-stats:
 *   get:
 *     summary: Get auto-evaluation statistics for an exam
 *     description: Retrieve statistical summary of automatic evaluation results for an exam (average marks, highest/lowest, pass rates)
 *     tags: [Auto Evaluation]
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
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exam:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     totalMarks:
 *                       type: number
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalStudents:
 *                       type: number
 *                       example: 45
 *                     averageMarks:
 *                       type: string
 *                       example: "72.50"
 *                     highestMarks:
 *                       type: number
 *                       example: 95
 *                     lowestMarks:
 *                       type: number
 *                       example: 35
 *                     averageTestCasePassRate:
 *                       type: string
 *                       example: "78.25%"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher only)
 *       404:
 *         description: Exam not found or unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/exams/:examId/auto-evaluation-stats",
  authenticate,
  authorizeRoles("teacher"),
  getAutoEvaluationStatsHandler
);

module.exports = router;