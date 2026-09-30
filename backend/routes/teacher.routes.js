const express = require("express");

const {
  createQuestionWithTestCasesHandler,
  updateQuestionWithTestCasesHandler,
  deleteQuestionWithTestCasesHandler,
  createExamHandler,
  publishExamHandler,
  getExamsByClassHandler,
  getExamHandler, // 🔥 NEW
  updateExamHandler, // 🔥 NEW
  deleteExamHandler, // 🔥 NEW
  getMyQuestionsHandler,
  getQuestionWithTestCasesHandler,
  getQuestionsByClassHandler, // 🔥 NEW
  getSubmittedStudentsHandler,
  rerunAutoEvaluationHandler
} = require("../controllers/teacher.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Teacher
 *   description: Teacher APIs
 */

/**
 * @swagger
 * /teacher/questions:
 *   post:
 *     summary: Create a new question with test cases (MODIFIED - now requires classId)
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, title, description]
 *             properties:
 *               classId:
 *                 type: string
 *                 description: Class ID where question will be created (REQUIRED)
 *                 example: "6972567dcf63421420be47b0"
 *               title:
 *                 type: string
 *                 example: "Two Sum Problem"
 *               description:
 *                 type: string
 *                 example: "Find two numbers that add up to a target value"
 *               inputFormat:
 *                 type: string
 *                 example: "First line: array of integers, Second line: target integer"
 *               outputFormat:
 *                 type: string
 *                 example: "Array of two indices"
 *               constraints:
 *                 type: string
 *                 example: "1 <= array.length <= 1000"
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 example: "easy"
 *               testCases:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [input, expectedOutput]
 *                   properties:
 *                     input:
 *                       type: string
 *                       example: "[2,7,11,15]\n9"
 *                     expectedOutput:
 *                       type: string
 *                       example: "[0,1]"
 *                     isPublic:
 *                       type: boolean
 *                       example: true
 *                     weight:
 *                       type: number
 *                       example: 1
 *     responses:
 *       201:
 *         description: Question and test cases created successfully
 *       400:
 *         description: Validation error (missing classId, title, or description)
 *       404:
 *         description: Class not found or unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/questions",
  authenticate,
  authorizeRoles("teacher"),
  createQuestionWithTestCasesHandler
);

/**
 * @swagger
 * /teacher/questions:
 *   get:
 *     summary: Get all questions with their test cases (optionally filter by classId)
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Optional - Filter questions by class ID
 *         example: "6972567dcf63421420be47b0"
 *     responses:
 *       200:
 *         description: List of questions with test cases
 *       500:
 *         description: Server error
 */
router.get(
  "/questions",
  authenticate,
  authorizeRoles("teacher"),
  getMyQuestionsHandler
);

/**
 * @swagger
 * /teacher/classes/{classId}/questions:
 *   get:
 *     summary: Get all questions for a specific class
 *     description: Fetch all questions belonging to a specific class (NEW ENDPOINT)
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
 *         example: "6972567dcf63421420be47b0"
 *     responses:
 *       200:
 *         description: List of questions for the class
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 class:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     code:
 *                       type: string
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Class not found or unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/classes/:classId/questions",
  authenticate,
  authorizeRoles("teacher"),
  getQuestionsByClassHandler
);

/**
 * @swagger
 * /teacher/questions/{questionId}:
 *   get:
 *     summary: Get one question with its test cases
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The question ID
 *     responses:
 *       200:
 *         description: Question with test cases
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */
router.get(
  "/questions/:questionId",
  authenticate,
  authorizeRoles("teacher"),
  getQuestionWithTestCasesHandler
);

/**
 * @swagger
 * /teacher/questions/{questionId}:
 *   put:
 *     summary: Update a question and its test cases
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               inputFormat:
 *                 type: string
 *               outputFormat:
 *                 type: string
 *               constraints:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               testCases:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [input, expectedOutput]
 *                   properties:
 *                     input:
 *                       type: string
 *                     expectedOutput:
 *                       type: string
 *                     isPublic:
 *                       type: boolean
 *                     weight:
 *                       type: number
 *     responses:
 *       200:
 *         description: Question and test cases updated successfully
 *       403:
 *         description: Forbidden - You don't have permission to update questions in this class
 *       404:
 *         description: Question not found or unauthorized
 *       500:
 *         description: Server error
 */
router.put(
  "/questions/:questionId",
  authenticate,
  authorizeRoles("teacher"),
  updateQuestionWithTestCasesHandler
);

/**
 * @swagger
 * /teacher/questions/{questionId}:
 *   delete:
 *     summary: Delete a question and its test cases
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The question ID to delete
 *     responses:
 *       200:
 *         description: Question and test cases deleted successfully
 *       403:
 *         description: Forbidden - You don't have permission to delete questions from this class
 *       404:
 *         description: Question not found or unauthorized
 *       500:
 *         description: Server error
 */
router.delete(
  "/questions/:questionId",
  authenticate,
  authorizeRoles("teacher"),
  deleteQuestionWithTestCasesHandler
);

/**
 * @swagger
 * /teacher/exams:
 *   post:
 *     summary: Create a new exam for a class
 *     description: Create an exam using existing question IDs from the SAME class (MODIFIED - validates questions belong to class)
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - classId
 *               - questions
 *               - startTime
 *               - endTime
 *               - durationMinutes
 *               - totalMarks
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Algorithm Fundamentals - Week 1 Assessment"
 *               description:
 *                 type: string
 *                 example: "This exam covers basic arithmetic operations and array manipulation."
 *               classId:
 *                 type: string
 *                 example: "6972567dcf63421420be47b0"
 *                 description: Class ID (REQUIRED)
 *               questions:
 *                 type: array
 *                 description: Array of Question IDs (MUST all belong to the same class)
 *                 items:
 *                   type: string
 *                 example:
 *                   - "6972567dcf63421420be47b0"
 *                   - "6977290ebc20d3d750e9fc22"
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-01-28T09:00:00Z"
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-01-28T18:00:00Z"
 *               durationMinutes:
 *                 type: number
 *                 example: 90
 *               totalMarks:
 *                 type: number
 *                 example: 100
 *               isRandomized:
 *                 type: boolean
 *                 description: Whether question order should be randomized
 *                 example: true
 *               allowedLanguages:
 *                 type: array
 *                 description: Judge0 language IDs allowed for this exam
 *                 items:
 *                   type: number
 *                 example: [71]
 *               status:
 *                 type: string
 *                 description: Old status field (kept for compatibility)
 *                 enum: [draft, scheduled, published, active, completed]
 *                 example: "draft"
 *               state:
 *                 type: string
 *                 description: New state field
 *                 enum: [draft, published, ongoing, ended, resultPublished]
 *                 example: "draft"
 *               maxSubmissions:
 *                 type: number
 *                 description: Maximum submissions per question (null = unlimited)
 *                 example: 3
 *     responses:
 *       201:
 *         description: Exam created successfully
 *       400:
 *         description: Validation error - Questions don't belong to the class or missing required fields
 *       404:
 *         description: Class not found or unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/exams",
  authenticate,
  authorizeRoles("teacher"),
  createExamHandler
);

/**
 * @swagger
 * /teacher/exams/{examId}/publish:
 *   patch:
 *     summary: Publish an exam
 *     description: Change exam state from draft to published
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: The exam ID to publish
 *     responses:
 *       200:
 *         description: Exam published successfully
 *       400:
 *         description: Exam already published or invalid state
 *       404:
 *         description: Exam not found or unauthorized
 *       500:
 *         description: Server error
 */
router.patch(
  "/exams/:examId/publish",
  authenticate,
  authorizeRoles("teacher"),
  publishExamHandler
);

/**
 * @swagger
 * /teacher/classes/{classId}/exams:
 *   get:
 *     summary: Get all exams for a specific class
 *     description: Fetch all exams created for a class
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
 *     responses:
 *       200:
 *         description: List of exams retrieved successfully
 *       400:
 *         description: Class not found or unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/classes/:classId/exams",
  authenticate,
  authorizeRoles("teacher"),
  getExamsByClassHandler
);

/**
 * @swagger
 * /teacher/exams/{examId}:
 *   get:
 *     summary: Get one exam details
 *     description: Fetch details of a specific exam including its questions (NEW ENDPOINT)
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: The exam ID
 *     responses:
 *       200:
 *         description: Exam details retrieved successfully
 *       404:
 *         description: Exam not found or unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/exams/:examId",
  authenticate,
  authorizeRoles("teacher"),
  getExamHandler
);

/**
 * @swagger
 * /teacher/exams/{examId}:
 *   put:
 *     summary: Update an exam
 *     description: Update details of an existing exam (NEW ENDPOINT)
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: The exam ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               questions:
 *                 type: array
 *                 items:
 *                   type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               durationMinutes:
 *                 type: number
 *               totalMarks:
 *                 type: number
 *               isRandomized:
 *                 type: boolean
 *               allowedLanguages:
 *                 type: array
 *                 items:
 *                   type: number
 *               maxSubmissions:
 *                 type: number
 *     responses:
 *       200:
 *         description: Exam updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Exam not found or unauthorized
 *       500:
 *         description: Server error
 */
router.put(
  "/exams/:examId",
  authenticate,
  authorizeRoles("teacher"),
  updateExamHandler
);

router.delete(
  "/exams/:examId",
  authenticate,
  authorizeRoles("teacher"),
  deleteExamHandler
);

/**
 * @swagger
 * /teacher/exams/{examId}/submitted-students:
 *   get:
 *     summary: Get students who submitted a specific exam
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: The exam ID
 *     responses:
 *       200:
 *         description: List of students who submitted the exam
 *       404:
 *         description: Exam not found or unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/exams/:examId/submitted-students",
  authenticate,
  authorizeRoles("teacher"),
  getSubmittedStudentsHandler
);

router.post(
  "/exams/:examId/submissions/:studentId/rerun",
  authenticate,
  authorizeRoles("teacher"),
  rerunAutoEvaluationHandler
);

module.exports = router;