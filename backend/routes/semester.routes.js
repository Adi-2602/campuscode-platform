const express = require("express");

const {
  createSemesterHandler,
  getAllSemestersHandler,
  getSemesterByIdHandler,
  updateSemesterHandler,
  deleteSemesterHandler,
  setActiveSemesterHandler,
  getActiveSemesterHandler,
  getSemesterStatsHandler
} = require("../controllers/semester.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

// All semester routes require admin/superadmin authentication
router.use(authenticate, authorizeRoles("admin", "superadmin"));

/**
 * @swagger
 * tags:
 *   name: Semester Management
 *   description: Admin APIs for managing academic semesters
 */

/**
 * @swagger
 * /admin/semesters:
 *   post:
 *     summary: Create a new semester
 *     description: Create a new academic semester (Admin/Superadmin only)
 *     tags: [Semester Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, academicYear, startDate, endDate]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Semester IV"
 *                 description: Semester name
 *               academicYear:
 *                 type: string
 *                 example: "2023-24"
 *                 description: Academic year
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *                 description: Semester start date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-05-30"
 *                 description: Semester end date
 *               isActive:
 *                 type: boolean
 *                 example: true
 *                 description: Set as active semester (will deactivate others)
 *     responses:
 *       201:
 *         description: Semester created successfully
 *       400:
 *         description: Validation error or duplicate semester
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.post("/", createSemesterHandler);

/**
 * @swagger
 * /admin/semesters/active:
 *   get:
 *     summary: Get currently active semester
 *     description: Fetch the currently active semester
 *     tags: [Semester Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active semester retrieved successfully
 *       404:
 *         description: No active semester found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/active", getActiveSemesterHandler);

/**
 * @swagger
 * /admin/semesters/stats:
 *   get:
 *     summary: Get semester statistics
 *     description: Get statistics about semesters (total, active, by academic year)
 *     tags: [Semester Management]
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
router.get("/stats", getSemesterStatsHandler);

/**
 * @swagger
 * /admin/semesters:
 *   get:
 *     summary: Get all semesters
 *     description: Fetch all semesters with optional filters and pagination
 *     tags: [Semester Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *         example: true
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Filter by academic year
 *         example: "2023-24"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *         example: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field (prefix with - for descending)
 *         example: "-createdAt"
 *     responses:
 *       200:
 *         description: Semesters retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/", getAllSemestersHandler);

/**
 * @swagger
 * /admin/semesters/{semesterId}:
 *   get:
 *     summary: Get semester by ID
 *     description: Fetch details of a specific semester
 *     tags: [Semester Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     responses:
 *       200:
 *         description: Semester retrieved successfully
 *       404:
 *         description: Semester not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/:semesterId", getSemesterByIdHandler);

/**
 * @swagger
 * /admin/semesters/{semesterId}:
 *   put:
 *     summary: Update semester
 *     description: Update semester details
 *     tags: [Semester Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Semester IV"
 *               academicYear:
 *                 type: string
 *                 example: "2023-24"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-05-30"
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Semester updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Semester not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.put("/:semesterId", updateSemesterHandler);

/**
 * @swagger
 * /admin/semesters/{semesterId}/activate:
 *   patch:
 *     summary: Set semester as active
 *     description: Activate this semester and deactivate all others
 *     tags: [Semester Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     responses:
 *       200:
 *         description: Semester activated successfully
 *       404:
 *         description: Semester not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.patch("/:semesterId/activate", setActiveSemesterHandler);

/**
 * @swagger
 * /admin/semesters/{semesterId}:
 *   delete:
 *     summary: Delete semester
 *     description: Delete a semester (will fail if semester has associated data)
 *     tags: [Semester Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     responses:
 *       200:
 *         description: Semester deleted successfully
 *       400:
 *         description: Cannot delete semester with associated data
 *       404:
 *         description: Semester not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.delete("/:semesterId", deleteSemesterHandler);

module.exports = router;