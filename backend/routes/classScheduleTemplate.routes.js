const express = require("express");

const {
  createClassScheduleTemplateHandler,
  getAllClassScheduleTemplatesHandler,
  getClassScheduleTemplateByIdHandler,
  updateClassScheduleTemplateHandler,
  deleteClassScheduleTemplateHandler,
  getTemplatesBySemesterHandler,
  getTemplatesByBatchSectionHandler,
  duplicateTemplateHandler,
  getTemplateStatsHandler
} = require("../controllers/classScheduleTemplate.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

// All class schedule template routes require admin/superadmin authentication
router.use(authenticate, authorizeRoles("admin", "superadmin"));

/**
 * @swagger
 * tags:
 *   name: Class Schedule Templates
 *   description: Admin APIs for managing class schedule templates
 */

/**
 * @swagger
 * /admin/class-schedules:
 *   post:
 *     summary: Create a class schedule template
 *     description: Create a template for batch-section-group-course mapping with lab slots
 *     tags: [Class Schedule Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [semesterId, batch, section, group, courseCode, courseName]
 *             properties:
 *               semesterId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *                 description: Semester ID
 *               batch:
 *                 type: integer
 *                 enum: [1, 2]
 *                 example: 1
 *               section:
 *                 type: string
 *                 example: "A1"
 *                 description: Section code
 *               group:
 *                 type: integer
 *                 enum: [1, 2]
 *                 example: 1
 *               courseCode:
 *                 type: string
 *                 example: "21CSC204J"
 *                 description: Course code
 *               courseName:
 *                 type: string
 *                 example: "Design and Analysis of Algorithms"
 *                 description: Course name
 *               venue:
 *                 type: string
 *                 example: "TP008"
 *                 description: Lab venue
 *               labSlots:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *                 description: Array of lab slot IDs (system will auto-calculate day/time/duration)
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Validation error or duplicate template
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.post("/", createClassScheduleTemplateHandler);

/**
 * @swagger
 * /admin/class-schedules/stats:
 *   get:
 *     summary: Get template statistics
 *     description: Get statistics about templates (total, by semester, by batch, top courses)
 *     tags: [Class Schedule Templates]
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
router.get("/stats", getTemplateStatsHandler);

/**
 * @swagger
 * /admin/class-schedules/semester/{semesterId}:
 *   get:
 *     summary: Get templates by semester
 *     description: Fetch all templates for a specific semester
 *     tags: [Class Schedule Templates]
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
 *         description: Templates retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/semester/:semesterId", getTemplatesBySemesterHandler);

/**
 * @swagger
 * /admin/class-schedules/semester/{semesterId}/batch/{batch}/section/{section}:
 *   get:
 *     summary: Get templates by batch and section
 *     description: Fetch all templates for a specific batch and section
 *     tags: [Class Schedule Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *       - in: path
 *         name: batch
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [1, 2]
 *         description: Batch number
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *         description: Section code (e.g., A1, B2)
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *       400:
 *         description: Invalid batch number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/semester/:semesterId/batch/:batch/section/:section", getTemplatesByBatchSectionHandler);

/**
 * @swagger
 * /admin/class-schedules:
 *   get:
 *     summary: Get all class schedule templates
 *     description: Fetch all templates with optional filters and pagination
 *     tags: [Class Schedule Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semesterId
 *         schema:
 *           type: string
 *         description: Filter by semester ID
 *       - in: query
 *         name: batch
 *         schema:
 *           type: integer
 *           enum: [1, 2]
 *         description: Filter by batch
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *         description: Filter by section
 *       - in: query
 *         name: group
 *         schema:
 *           type: integer
 *           enum: [1, 2]
 *         description: Filter by group
 *       - in: query
 *         name: courseCode
 *         schema:
 *           type: string
 *         description: Filter by course code (partial match)
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
 *         example: 50
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field
 *         example: "batch section group"
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/", getAllClassScheduleTemplatesHandler);

/**
 * @swagger
 * /admin/class-schedules/{templateId}:
 *   get:
 *     summary: Get template by ID
 *     description: Fetch details of a specific template
 *     tags: [Class Schedule Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template retrieved successfully
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/:templateId", getClassScheduleTemplateByIdHandler);

/**
 * @swagger
 * /admin/class-schedules/{templateId}:
 *   put:
 *     summary: Update template
 *     description: Update template details (lab slots will trigger schedule recalculation)
 *     tags: [Class Schedule Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               batch:
 *                 type: integer
 *                 enum: [1, 2]
 *                 example: 1
 *               section:
 *                 type: string
 *                 example: "A1"
 *               group:
 *                 type: integer
 *                 enum: [1, 2]
 *                 example: 1
 *               courseCode:
 *                 type: string
 *                 example: "21CSC204J"
 *               courseName:
 *                 type: string
 *                 example: "Design and Analysis of Algorithms"
 *               venue:
 *                 type: string
 *                 example: "TP008"
 *               labSlots:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.put("/:templateId", updateClassScheduleTemplateHandler);

/**
 * @swagger
 * /admin/class-schedules/{templateId}/duplicate:
 *   post:
 *     summary: Duplicate template
 *     description: Create a copy of an existing template with modified fields
 *     tags: [Class Schedule Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID to duplicate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               semesterId:
 *                 type: string
 *                 description: New semester ID (optional, uses original if not provided)
 *               batch:
 *                 type: integer
 *                 enum: [1, 2]
 *                 description: New batch (optional)
 *               section:
 *                 type: string
 *                 description: New section (optional)
 *               group:
 *                 type: integer
 *                 enum: [1, 2]
 *                 description: New group (optional)
 *               courseCode:
 *                 type: string
 *                 description: New course code (optional)
 *               courseName:
 *                 type: string
 *                 description: New course name (optional)
 *               venue:
 *                 type: string
 *                 description: New venue (optional)
 *               labSlots:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: New lab slots (optional)
 *     responses:
 *       201:
 *         description: Template duplicated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Original template not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.post("/:templateId/duplicate", duplicateTemplateHandler);

/**
 * @swagger
 * /admin/class-schedules/{templateId}:
 *   delete:
 *     summary: Delete template
 *     description: Delete a class schedule template
 *     tags: [Class Schedule Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       400:
 *         description: Cannot delete template in use
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.delete("/:templateId", deleteClassScheduleTemplateHandler);

/**
 * @swagger
 * /admin/class-schedules/bulk-import:
 *   post:
 *     summary: Bulk import class schedules
 *     tags: [Admin - Class Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [semesterId, data]
 *     responses:
 *       200:
 *         description: Import results
 */
router.post("/bulk-import", require("../controllers/classScheduleTemplate.controller").bulkImportTemplatesHandler);

module.exports = router;