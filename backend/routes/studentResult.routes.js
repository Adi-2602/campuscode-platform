const express = require("express");
const {
  getStudentResultHandler
} = require("../controllers/studentResult.controller");
const {
  authenticate,
  authorize
} = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * /student/exams/{examId}/result:
 *   get:
 *     summary: Get student exam result
 *     description: Student views their result for a specific exam. Results are only visible after teacher publishes them or after scheduled publication time. Supports lazy publishing (results become visible automatically at scheduled time).
 *     tags: [Student Result]
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
 *     responses:
 *       200:
 *         description: Result fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exam:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                       example: "Algorithm Fundamentals - Week 1"
 *                     totalMarks:
 *                       type: number
 *                       example: 100
 *                 totalMarks:
 *                   type: number
 *                   example: 85
 *                   description: Total marks obtained by student
 *                 status:
 *                   type: string
 *                   example: "passed"
 *                   description: Result status (passed/failed)
 *                 questionResults:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                       marksObtained:
 *                         type: number
 *                       maxMarks:
 *                         type: number
 *                       feedback:
 *                         type: string
 *                 publishedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-01-30T16:00:00Z"
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       403:
 *         description: Result scheduled but not yet released (returns scheduled time)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Result scheduled. Please wait."
 *                 publishAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-02-05T10:00:00Z"
 *       404:
 *         description: Result not published or exam not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Result not published"
 */
router.get(
  "/exams/:examId/result",
  authenticate,
  authorize("student"),
  getStudentResultHandler
);

module.exports = router;