const express = require("express");

const {
  createClassHandler,
  getMyClassesHandler,
  getClassByIdHandler,
  updateClassHandler,
  toggleClassLockHandler,
  deleteClassHandler,
  getStudentsInClassHandler
} = require("../controllers/class.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

// All class routes are protected and teacher-only
router.use(authenticate, authorizeRoles("teacher"));

/**
 * @swagger
 * tags:
 *   name: Class
 *   description: Teacher class management APIs
 */

/**
 * @swagger
 * /teacher/classes:
 *   post:
 *     summary: Create a new class
 *     description: Teacher creates a class with auto-generated unique 6-digit code
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "DSA Batch 2026"
 *               description:
 *                 type: string
 *                 example: "Evening practice batch for data structures"
 *     responses:
 *       201:
 *         description: Class created successfully with unique code
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher only)
 *       500:
 *         description: Server error
 */
router.post("/", createClassHandler);

/**
 * @swagger
 * /teacher/classes:
 *   get:
 *     summary: Get all classes created by teacher
 *     description: Fetch list of all classes created by the authenticated teacher
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classes retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher only)
 *       500:
 *         description: Server error
 */
router.get("/", getMyClassesHandler);

/**
 * @swagger
 * /teacher/classes/{classId}:
 *   get:
 *     summary: Get single class details
 *     description: Fetch details of a specific class by ID
 *     tags: [Class]
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
 *         description: Class details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher only)
 *       404:
 *         description: Class not found or unauthorized
 *       500:
 *         description: Server error
 */
router.get("/:classId", getClassByIdHandler);

/**
 * @swagger
 * /teacher/classes/{classId}:
 *   patch:
 *     summary: Update class details
 *     description: Update name and/or description of a class
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated DSA Batch 2026"
 *               description:
 *                 type: string
 *                 example: "Morning batch for advanced data structures"
 *     responses:
 *       200:
 *         description: Class updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher only)
 *       404:
 *         description: Class not found or unauthorized
 *       500:
 *         description: Server error
 */
router.patch("/:classId", updateClassHandler);

/**
 * @swagger
 * /teacher/classes/{classId}/lock:
 *   patch:
 *     summary: Lock or unlock a class
 *     description: Toggle the lock status to prevent/allow new student enrollments
 *     tags: [Class]
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
 *         description: Class lock status toggled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher only)
 *       404:
 *         description: Class not found or unauthorized
 *       500:
 *         description: Server error
 */
router.patch("/:classId/lock", toggleClassLockHandler);

/**
 * @swagger
 * /teacher/classes/{classId}:
 *   delete:
 *     summary: Delete a class
 *     description: Delete class and all associated student enrollments
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID to delete
 *     responses:
 *       200:
 *         description: Class and enrollments deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher only)
 *       404:
 *         description: Class not found or unauthorized
 *       500:
 *         description: Server error
 */
router.delete("/:classId", deleteClassHandler);

/**
 * @swagger
 * /teacher/classes/{classId}/students:
 *   get:
 *     summary: Get all students in a class
 *     description: Fetch list of all active students enrolled in the class
 *     tags: [Class]
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
 *         description: Student list retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher only)
 *       404:
 *         description: Class not found or unauthorized
 *       500:
 *         description: Server error
 */
router.get("/:classId/students", getStudentsInClassHandler);

module.exports = router;