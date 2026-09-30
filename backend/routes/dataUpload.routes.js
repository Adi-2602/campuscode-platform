const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  uploadSemesterDataHandler,
  getUploadStatusHandler,
  getAllUploadsHandler,
  getUploadReportHandler,
  getUploadStatisticsHandler,
  sendEmailsHandler,
  clearSemesterDataHandler
} = require("../controllers/dataUpload.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept JSON files only
  if (file.mimetype === "application/json" || path.extname(file.originalname).toLowerCase() === ".json") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JSON files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// All upload routes require admin/superadmin authentication
router.use(authenticate, authorizeRoles("admin", "superadmin"));

/**
 * @swagger
 * tags:
 *   name: Data Upload
 *   description: Admin APIs for uploading semester data (students, teachers, faculty emails)
 */

/**
 * @swagger
 * /admin/upload/semester-data:
 *   post:
 *     summary: Upload semester data
 *     description: Upload 3 JSON files to create students, teachers, classes, and enrollments
 *     tags: [Data Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [semesterId, students, teachers, facultyEmails]
 *             properties:
 *               semesterId:
 *                 type: string
 *                 description: Semester ID
 *                 example: "507f1f77bcf86cd799439011"
 *               students:
 *                 type: string
 *                 format: binary
 *                 description: Student data JSON file (Fake.json)
 *               teachers:
 *                 type: string
 *                 format: binary
 *                 description: Teacher assignment JSON file (FilteredTeachers.json)
 *               facultyEmails:
 *                 type: string
 *                 format: binary
 *                 description: Faculty email mapping JSON file (FacultyEmailMapping.json)
 *     responses:
 *       201:
 *         description: Upload processed successfully
 *       400:
 *         description: Validation error or missing files/templates
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.post(
  "/semester-data",
  (req, res, next) => {
    console.log("[OCR] 🟢 Route hit: /semester-data");
    next();
  },
  upload.fields([
    { name: "students", maxCount: 1 },
    { name: "teachers", maxCount: 1 },
    { name: "facultyEmails", maxCount: 1 }
  ]),
  (req, res, next) => {
    console.log("[OCR] 🟡 Multer finished, calling handler...");
    next();
  },
  uploadSemesterDataHandler
);

/**
 * @swagger
 * /admin/uploads/stats:
 *   get:
 *     summary: Get upload statistics
 *     description: Get statistics about all uploads
 *     tags: [Data Upload]
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
router.get("/stats", getUploadStatisticsHandler);

/**
 * @swagger
 * /admin/uploads:
 *   get:
 *     summary: Get all uploads
 *     description: Get list of all uploads with optional filters
 *     tags: [Data Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semesterId
 *         schema:
 *           type: string
 *         description: Filter by semester
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *         description: Filter by status
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
 *         description: Sort field
 *         example: "-uploadedAt"
 *     responses:
 *       200:
 *         description: Uploads retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/", getAllUploadsHandler);

/**
 * @swagger
 * /admin/uploads/{uploadId}/status:
 *   get:
 *     summary: Get upload status
 *     description: Get status and details of a specific upload
 *     tags: [Data Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Upload ID
 *     responses:
 *       200:
 *         description: Upload status retrieved successfully
 *       404:
 *         description: Upload not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/:uploadId/status", getUploadStatusHandler);

/**
 * @swagger
 * /admin/uploads/{uploadId}/report:
 *   get:
 *     summary: Get upload report
 *     description: Get detailed report of upload processing (stats, warnings, errors)
 *     tags: [Data Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Upload ID
 *     responses:
 *       200:
 *         description: Upload report retrieved successfully
 *       404:
 *         description: Upload not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/:uploadId/report", getUploadReportHandler);

/**
 * @swagger
 * /admin/uploads/{uploadId}/send-emails:
 *   post:
 *     summary: Send credential emails
 *     description: Manually trigger credential emails for an upload
 *     tags: [Data Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Emails dispatched
 */
/**
 * @swagger
 * /admin/uploads/clear-data:
 *   post:
 *     summary: Clear semester data
 *     description: Clear all classes, templates, enrollments, and users (students/teachers) for a specific semester
 *     tags: [Data Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [semesterId]
 *             properties:
 *               semesterId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Data cleared successfully
 */
router.post("/clear-data", clearSemesterDataHandler);

module.exports = router;