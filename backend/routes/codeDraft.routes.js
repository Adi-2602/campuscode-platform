const express = require('express');
const {
  autosaveHandler,
  recoverHandler,
  deleteDraftHandler
} = require('../controllers/codeDraft.controller');

const {
  authenticate,
  authorizeRoles
} = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Code Draft
 *   description: Auto-save and recover code drafts during exams
 */

/**
 * @swagger
 * /student/exams/{examId}/questions/{questionId}/autosave:
 *   post:
 *     summary: Auto-save code draft
 *     description: Automatically saves student's code to Redis with TTL based on exam duration. Called every 3 seconds from frontend.
 *     tags: [Code Draft]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *         example: "507f1f77bcf86cd799439012"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - languageId
 *             properties:
 *               code:
 *                 type: string
 *                 description: Source code to save
 *                 example: "print('Hello World')"
 *               languageId:
 *                 type: number
 *                 description: Judge0 language ID (71=Python, 62=Java, 63=JavaScript, 50=C, 54=C++)
 *                 example: 71
 *           examples:
 *             pythonCode:
 *               summary: Python code example
 *               value:
 *                 code: "def solve(n):\n    return n * 2\n\nprint(solve(5))"
 *                 languageId: 71
 *             javaCode:
 *               summary: Java code example
 *               value:
 *                 code: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello\");\n    }\n}"
 *                 languageId: 62
 *             cppCode:
 *               summary: C++ code example
 *               value:
 *                 code: "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello\";\n    return 0;\n}"
 *                 languageId: 54
 *     responses:
 *       200:
 *         description: Draft saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Draft saved successfully"
 *                 ttl:
 *                   type: number
 *                   description: Time to live in seconds
 *                   example: 14400
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   description: When the draft will expire
 *                   example: "2026-01-31T22:30:00.000Z"
 *       400:
 *         description: Bad request (missing fields, exam submitted, code too large)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   error: "code and languageId are required"
 *               examSubmitted:
 *                 summary: Exam already submitted
 *                 value:
 *                   error: "Exam already submitted. Auto-save is disabled."
 *               examNotStarted:
 *                 summary: Exam not started
 *                 value:
 *                   error: "You must start the exam before auto-saving"
 *               codeTooLarge:
 *                 summary: Code exceeds size limit
 *                 value:
 *                   error: "Code size (250000 bytes) exceeds limit (204800 bytes)"
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       403:
 *         description: Forbidden (question not assigned to student)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "This question is not assigned to you"
 *       404:
 *         description: Exam not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Exam not found"
 *       500:
 *         description: Server error (Redis connection failed, etc.)
 */
router.post(
  '/exams/:examId/questions/:questionId/autosave',
  authenticate,
  authorizeRoles('student'),
  autosaveHandler
);

/**
 * @swagger
 * /student/exams/{examId}/questions/{questionId}/recover:
 *   get:
 *     summary: Recover code draft
 *     description: Retrieves the last auto-saved code draft from Redis. Called when student opens question editor or refreshes page.
 *     tags: [Code Draft]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Draft recovered (or no draft found)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 draft:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     code:
 *                       type: string
 *                       description: Saved source code
 *                       example: "print('Hello World')"
 *                     languageId:
 *                       type: number
 *                       description: Language ID used
 *                       example: 71
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: When draft was last saved
 *                       example: "2026-01-31T18:30:00.000Z"
 *                     expiresIn:
 *                       type: number
 *                       description: Seconds until draft expires
 *                       example: 12000
 *                 message:
 *                   type: string
 *                   example: "Draft recovered successfully"
 *             examples:
 *               draftFound:
 *                 summary: Draft found and recovered
 *                 value:
 *                   success: true
 *                   draft:
 *                     code: "def solve(n):\n    return n * 2"
 *                     languageId: 71
 *                     updatedAt: "2026-01-31T18:30:00.000Z"
 *                     expiresIn: 12000
 *                   message: "Draft recovered successfully"
 *               noDraft:
 *                 summary: No draft found
 *                 value:
 *                   success: true
 *                   draft: null
 *                   message: "No draft found"
 *       400:
 *         description: Bad request (missing parameters)
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       403:
 *         description: Forbidden (student only)
 *       500:
 *         description: Server error
 */
router.get(
  '/exams/:examId/questions/:questionId/recover',
  authenticate,
  authorizeRoles('student'),
  recoverHandler
);

/**
 * @swagger
 * /student/exams/{examId}/questions/{questionId}/draft:
 *   delete:
 *     summary: Delete code draft (manual)
 *     description: Manually delete a saved draft. Useful if student wants to start fresh or clear their saved code.
 *     tags: [Code Draft]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Draft deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Draft deleted successfully"
 *       400:
 *         description: Bad request (missing parameters)
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       403:
 *         description: Forbidden (student only)
 *       500:
 *         description: Server error
 */
router.delete(
  '/exams/:examId/questions/:questionId/draft',
  authenticate,
  authorizeRoles('student'),
  deleteDraftHandler
);

module.exports = router;