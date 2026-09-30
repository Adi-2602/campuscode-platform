const express = require("express");
const {
  startExamHandler,
  getAssignedQuestionsHandler,
  submitExamHandler,
  getPublishedExamsHandler,
  getStudentProfileHandler
} = require("../controllers/student.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

// All student exam actions are protected
router.use(authenticate, authorizeRoles("student"));

/**
 * @swagger
 * /student/exams/{examId}/start:
 *   post:
 *     summary: Start or resume an exam
 *     description: Allows a student to start or resume an assigned exam
 *     tags: [Student Exam]
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
 *         description: Exam started or resumed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (student only)
 *       404:
 *         description: Exam not found
 */
router.post("/exams/:examId/start", startExamHandler);

/**
 * @swagger
 * /student/exams/{examId}/questions:
 *   get:
 *     summary: Get assigned exam questions
 *     description: Fetch all questions assigned to the student for a specific exam
 *     tags: [Student Exam]
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
 *         description: Questions fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (student only)
 *       404:
 *         description: Exam or questions not found
 */
router.get("/exams/:examId/questions", getAssignedQuestionsHandler);

/**
 * @swagger
 * /student/exams/{examId}/submit:
 *   post:
 *     summary: Submit exam
 *     description: Submits the exam and triggers auto-evaluation
 *     tags: [Student Exam]
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
 *         description: Exam submitted successfully
 *       400:
 *         description: Exam already submitted or submission closed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (student only)
 */
router.post("/exams/:examId/submit", submitExamHandler);

/**
 * @swagger
 * /student/classes/{classId}/exams:
 *   get:
 *     summary: Get published exams for a class
 *     description: Fetch all published and ongoing exams for a class the student is enrolled in
 *     tags: [Student Exam]
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
 *         description: List of published exams
 *       400:
 *         description: Not enrolled in class
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (student only)
 */
router.get("/classes/:classId/exams", getPublishedExamsHandler);

/**
 * @swagger
 * /student/profile:
 *   get:
 *     summary: Get student profile
 *     description: Fetch the current logged in student's profile details
 *     tags: [Student Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 */
router.get("/profile", getStudentProfileHandler);

module.exports = router;