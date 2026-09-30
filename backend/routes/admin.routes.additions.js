/**
 * PHASE 7: TEACHER VERIFICATION ENHANCEMENTS
 * 
 * Add these routes to your existing routes/admin.routes.js
 */

// Import the new handlers
const {
  getUnverifiedTeachersHandler,
  bulkVerifyTeachersHandler,
  resendTeacherCredentialsHandler,
  rejectTeacherHandler,
  updateTeacherEmailHandler,
  getTeacherVerificationStatsHandler
} = require("../controllers/admin.controller");

/**
 * @swagger
 * /admin/teachers/verification-stats:
 *   get:
 *     summary: Get teacher verification statistics
 *     description: Get stats about verified/unverified teachers
 *     tags: [Admin - Teacher Verification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/teachers/verification-stats", getTeacherVerificationStatsHandler);

/**
 * @swagger
 * /admin/teachers/unverified:
 *   get:
 *     summary: Get unverified teachers
 *     description: Get list of teachers pending verification
 *     tags: [Admin - Teacher Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isPlaceholder
 *         schema:
 *           type: boolean
 *         description: Filter by placeholder accounts
 *       - in: query
 *         name: needsEmailUpdate
 *         schema:
 *           type: boolean
 *         description: Filter by accounts needing email update
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Unverified teachers retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/teachers/unverified", getUnverifiedTeachersHandler);

/**
 * @swagger
 * /admin/teachers/verify-bulk:
 *   post:
 *     summary: Bulk verify teachers
 *     description: Verify multiple teachers at once
 *     tags: [Admin - Teacher Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teacherIds]
 *             properties:
 *               teacherIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *     responses:
 *       200:
 *         description: Teachers verified successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.post("/teachers/verify-bulk", bulkVerifyTeachersHandler);

/**
 * @swagger
 * /admin/teachers/{teacherId}/resend-credentials:
 *   post:
 *     summary: Resend teacher credentials
 *     description: Generate new password and resend credentials email
 *     tags: [Admin - Teacher Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
 *     responses:
 *       200:
 *         description: Credentials sent successfully
 *       400:
 *         description: Teacher not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.post("/teachers/:teacherId/resend-credentials", resendTeacherCredentialsHandler);

/**
 * @swagger
 * /admin/teachers/{teacherId}/reject:
 *   post:
 *     summary: Reject teacher account
 *     description: Reject/block a teacher account
 *     tags: [Admin - Teacher Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Invalid faculty information"
 *     responses:
 *       200:
 *         description: Teacher account rejected
 *       400:
 *         description: Teacher not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.post("/teachers/:teacherId/reject", rejectTeacherHandler);

/**
 * @swagger
 * /admin/teachers/{teacherId}/email:
 *   put:
 *     summary: Update teacher email
 *     description: Update email for placeholder teacher accounts
 *     tags: [Admin - Teacher Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "faculty@srmist.edu.in"
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       400:
 *         description: Validation error or email already in use
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.put("/teachers/:teacherId/email", updateTeacherEmailHandler);

// Export or add to existing router exports