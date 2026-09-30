const express = require("express");

const {
  joinClassHandler,
  getJoinedClassesHandler,
  leaveClassHandler
} = require("../controllers/classStudent.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

// All student class routes are protected and student-only
router.use(authenticate, authorizeRoles("student"));

/**
 * @swagger
 * tags:
 *   name: Student Class
 *   description: Student class enrollment APIs
 */

/**
 * @swagger
 * /student/classes/join:
 *   post:
 *     summary: Join a class via code
 *     description: Student joins a class using the 6-digit alphanumeric code
 *     tags: [Student Class]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "A9F3K2"
 *                 description: 6-character alphanumeric class code
 *     responses:
 *       201:
 *         description: Successfully joined the class
 *       400:
 *         description: Invalid code, class locked, or already enrolled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (student only)
 *       500:
 *         description: Server error
 */
router.post("/join", joinClassHandler);

/**
 * @swagger
 * /student/classes:
 *   get:
 *     summary: Get all joined classes
 *     description: Fetch list of all classes the student has joined (active enrollments only)
 *     tags: [Student Class]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of joined classes retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (student only)
 *       500:
 *         description: Server error
 */
router.get("/", getJoinedClassesHandler);

/**
 * @swagger
 * /student/classes/{classId}/leave:
 *   delete:
 *     summary: Leave a class
 *     description: Student leaves a class (sets leftAt timestamp)
 *     tags: [Student Class]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID to leave
 *     responses:
 *       200:
 *         description: Successfully left the class
 *       400:
 *         description: Not enrolled in this class
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (student only)
 *       500:
 *         description: Server error
 */
router.delete("/:classId/leave", leaveClassHandler);

module.exports = router;