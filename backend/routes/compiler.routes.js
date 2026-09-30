const express = require("express");
const {
  getLanguages,
  runSubmission,
  getSubmissionResult // ✨ NEW
} = require("../controllers/compiler.controller");

const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * /compiler/languages:
 *   get:
 *     summary: Get supported programming languages
 *     description: Fetch all programming languages supported by the compiler
 *     tags: [Compiler]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Languages fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/languages", authenticate, getLanguages);

/**
 * @swagger
 * /compiler/run:
 *   post:
 *     summary: Run code in playground mode
 *     description: Execute code for testing without creating exam submission. Returns execution results.
 *     tags: [Compiler]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - language_id
 *               - source_code
 *             properties:
 *               language_id:
 *                 type: number
 *                 example: 71
 *                 description: Judge0 language ID (71=Python, 62=Java, 63=JavaScript, 50=C, 54=C++)
 *               source_code:
 *                 type: string
 *                 example: "print('Hello World')"
 *               stdin:
 *                 type: string
 *                 example: "5 10"
 *                 description: Input to provide to the program
 *     responses:
 *       200:
 *         description: Code executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stdout:
 *                   type: string
 *                   description: Program output
 *                 stderr:
 *                   type: string
 *                   description: Error output
 *                 compile_output:
 *                   type: string
 *                   description: Compilation errors (if any)
 *                 status:
 *                   type: string
 *                   description: Execution status (e.g., "Accepted", "Wrong Answer")
 *                 time:
 *                   type: string
 *                   description: Execution time in seconds
 *                 memory:
 *                   type: number
 *                   description: Memory used in kilobytes
 *       400:
 *         description: Invalid request (missing required fields)
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       500:
 *         description: Execution failed or Judge0 error
 */

router.post("/run", authenticate, runSubmission);

/**
 * @swagger
 * /compiler/status/{token}:
 *   get:
 *     summary: Get submission status
 *     description: Poll this endpoint to check if code execution is complete
 *     tags: [Compiler]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission token received from /run
 *     responses:
 *       200:
 *         description: Submission result or status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Processing"
 *                 stdout:
 *                   type: string
 *                 stderr:
 *                   type: string
 */
router.get("/status/:token", authenticate, getSubmissionResult); // ✨ NEW

module.exports = router;