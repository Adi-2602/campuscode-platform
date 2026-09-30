const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  createLabSlotHandler,
  createLabSlotsBulkHandler,
  getAllLabSlotsHandler,
  getLabSlotByIdHandler,
  updateLabSlotHandler,
  deleteLabSlotHandler,
  getLabSlotsByBatchHandler,
  getTimetableViewHandler,
  getLabSlotStatsHandler
} = require("../controllers/labSlot.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Make sure this directory exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "labslots-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept Excel and CSV files only
  const allowedTypes = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only Excel (.xls, .xlsx) and CSV files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// All lab slot routes require admin/superadmin authentication
router.use(authenticate, authorizeRoles("admin", "superadmin"));

/**
 * @swagger
 * tags:
 *   name: Lab Slot Management
 *   description: Admin APIs for managing lab time slots
 */

/**
 * @swagger
 * /admin/lab-slots:
 *   post:
 *     summary: Create a single lab slot
 *     description: Create a new lab time slot (Admin/Superadmin only)
 *     tags: [Lab Slot Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slotCode, day, startTime, endTime, batch, hourOrder]
 *             properties:
 *               slotCode:
 *                 type: string
 *                 example: "P47"
 *                 description: Slot code (P1-P50)
 *               day:
 *                 type: string
 *                 enum: [Monday, Tuesday, Wednesday, Thursday, Friday]
 *                 example: "Friday"
 *               startTime:
 *                 type: string
 *                 example: "01:25"
 *                 description: Start time in HH:MM format (24-hour)
 *               endTime:
 *                 type: string
 *                 example: "02:15"
 *                 description: End time in HH:MM format (24-hour)
 *               batch:
 *                 type: integer
 *                 enum: [1, 2]
 *                 example: 1
 *               hourOrder:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 7
 *                 description: Hour order in the day (1-12)
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Lab slot created successfully
 *       400:
 *         description: Validation error or duplicate slot code
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.post("/", createLabSlotHandler);

/**
 * @swagger
 * /admin/lab-slots/bulk:
 *   post:
 *     summary: Bulk import lab slots from Excel/CSV
 *     description: Upload an Excel or CSV file to create multiple lab slots at once
 *     tags: [Lab Slot Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel (.xlsx, .xls) or CSV file with lab slot data
 *     responses:
 *       201:
 *         description: Bulk import completed
 *       400:
 *         description: Invalid file or data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.post("/bulk", upload.single("file"), createLabSlotsBulkHandler);

/**
 * @swagger
 * /admin/lab-slots/stats:
 *   get:
 *     summary: Get lab slot statistics
 *     description: Get statistics about lab slots (total, by batch, by day)
 *     tags: [Lab Slot Management]
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
router.get("/stats", getLabSlotStatsHandler);

/**
 * @swagger
 * /admin/lab-slots/batch/{batch}:
 *   get:
 *     summary: Get lab slots by batch
 *     description: Fetch all lab slots for a specific batch (1 or 2)
 *     tags: [Lab Slot Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batch
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [1, 2]
 *         description: Batch number (1 or 2)
 *     responses:
 *       200:
 *         description: Lab slots retrieved successfully
 *       400:
 *         description: Invalid batch number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/batch/:batch", getLabSlotsByBatchHandler);

/**
 * @swagger
 * /admin/lab-slots/timetable/{batch}:
 *   get:
 *     summary: Get timetable view for a batch
 *     description: Get lab slots formatted as a timetable grid (grouped by day)
 *     tags: [Lab Slot Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batch
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [1, 2]
 *         description: Batch number (1 or 2)
 *     responses:
 *       200:
 *         description: Timetable retrieved successfully
 *       400:
 *         description: Invalid batch number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/timetable/:batch", getTimetableViewHandler);

/**
 * @swagger
 * /admin/lab-slots:
 *   get:
 *     summary: Get all lab slots
 *     description: Fetch all lab slots with optional filters and pagination
 *     tags: [Lab Slot Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: batch
 *         schema:
 *           type: integer
 *           enum: [1, 2]
 *         description: Filter by batch
 *       - in: query
 *         name: day
 *         schema:
 *           type: string
 *           enum: [Monday, Tuesday, Wednesday, Thursday, Friday]
 *         description: Filter by day
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
 *         example: "batch hourOrder"
 *     responses:
 *       200:
 *         description: Lab slots retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/", getAllLabSlotsHandler);

/**
 * @swagger
 * /admin/lab-slots/{slotId}:
 *   get:
 *     summary: Get lab slot by ID
 *     description: Fetch details of a specific lab slot
 *     tags: [Lab Slot Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lab slot ID
 *     responses:
 *       200:
 *         description: Lab slot retrieved successfully
 *       404:
 *         description: Lab slot not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/:slotId", getLabSlotByIdHandler);

/**
 * @swagger
 * /admin/lab-slots/{slotId}:
 *   put:
 *     summary: Update lab slot
 *     description: Update lab slot details
 *     tags: [Lab Slot Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lab slot ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slotCode:
 *                 type: string
 *                 example: "P47"
 *               day:
 *                 type: string
 *                 enum: [Monday, Tuesday, Wednesday, Thursday, Friday]
 *                 example: "Friday"
 *               startTime:
 *                 type: string
 *                 example: "01:25"
 *               endTime:
 *                 type: string
 *                 example: "02:15"
 *               batch:
 *                 type: integer
 *                 enum: [1, 2]
 *                 example: 1
 *               hourOrder:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 7
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Lab slot updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Lab slot not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.put("/:slotId", updateLabSlotHandler);

/**
 * @swagger
 * /admin/lab-slots/{slotId}:
 *   delete:
 *     summary: Delete lab slot
 *     description: Delete a lab slot (will fail if slot is being used)
 *     tags: [Lab Slot Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lab slot ID
 *     responses:
 *       200:
 *         description: Lab slot deleted successfully
 *       400:
 *         description: Cannot delete slot in use
 *       404:
 *         description: Lab slot not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.delete("/:slotId", deleteLabSlotHandler);

module.exports = router;