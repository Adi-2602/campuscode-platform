const express = require("express");

const {
  createSlotMappingHandler,
  bulkCreateSlotsHandler,
  getAllSlotsHandler,
  getSlotByCodeHandler,
  updateSlotMappingHandler,
  deleteSlotMappingHandler,
  deleteAllSlotsHandler,
  getTimetableStatsHandler,
  exportTimetableHandler
} = require("../controllers/slotTimetable.controller");

const {
  authenticate,
  authorizeRoles
} = require("../middlewares/auth.middleware");

const router = express.Router();

// All slot timetable routes require admin authentication
router.use(authenticate, authorizeRoles("admin", "superadmin"));

/**
 * @swagger
 * tags:
 *   name: Admin - Slot Timetable
 *   description: Manage P1-P50 slot time mappings (database only)
 */

/**
 * @swagger
 * /admin/slot-timetable/bulk:
 *   post:
 *     summary: Bulk create/update slot mappings
 *     description: Upload complete timetable data (50 slots)
 *     tags: [Admin - Slot Timetable]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slots]
 *             properties:
 *               clearExisting:
 *                 type: boolean
 *                 description: Clear existing timetable before import
 *                 example: true
 *               slots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [slotCode, batch, day, dayNumber, hourOrder, startTime, endTime]
 *                   properties:
 *                     slotCode:
 *                       type: string
 *                       example: "P47"
 *                     batch:
 *                       type: integer
 *                       example: 1
 *                     day:
 *                       type: string
 *                       example: "Friday"
 *                     dayNumber:
 *                       type: integer
 *                       example: 5
 *                     hourOrder:
 *                       type: integer
 *                       example: 7
 *                     startTime:
 *                       type: string
 *                       example: "01:25"
 *                     endTime:
 *                       type: string
 *                       example: "02:15"
 *     responses:
 *       200:
 *         description: Slots imported successfully
 */
router.post("/bulk", bulkCreateSlotsHandler);

/**
 * @swagger
 * /admin/slot-timetable:
 *   post:
 *     summary: Create single slot mapping
 *     description: Manually add one slot to timetable
 *     tags: [Admin - Slot Timetable]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slotCode, batch, day, dayNumber, hourOrder, startTime, endTime]
 *             properties:
 *               slotCode:
 *                 type: string
 *                 example: "P51"
 *               batch:
 *                 type: integer
 *                 enum: [1, 2]
 *               day:
 *                 type: string
 *                 enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]
 *               dayNumber:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 6
 *               hourOrder:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               startTime:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                 example: "01:25"
 *               endTime:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                 example: "02:15"
 *     responses:
 *       201:
 *         description: Slot created successfully
 *       400:
 *         description: Slot already exists or validation error
 */
router.post("/", createSlotMappingHandler);

/**
 * @swagger
 * /admin/slot-timetable/stats:
 *   get:
 *     summary: Get timetable statistics
 *     tags: [Admin - Slot Timetable]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved
 */
router.get("/stats", getTimetableStatsHandler);

/**
 * @swagger
 * /admin/slot-timetable/export:
 *   get:
 *     summary: Export timetable as JSON
 *     tags: [Admin - Slot Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: batch
 *         schema:
 *           type: integer
 *           enum: [1, 2]
 *         description: Filter by batch (optional)
 *     responses:
 *       200:
 *         description: Timetable exported
 */
router.get("/export", exportTimetableHandler);

/**
 * @swagger
 * /admin/slot-timetable:
 *   get:
 *     summary: Get all slot mappings
 *     tags: [Admin - Slot Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: batch
 *         schema:
 *           type: integer
 *           enum: [1, 2]
 *       - in: query
 *         name: day
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Slots retrieved
 */
router.get("/", getAllSlotsHandler);

/**
 * @swagger
 * /admin/slot-timetable:
 *   delete:
 *     summary: Delete all slot mappings
 *     description: Clear entire timetable (use with caution!)
 *     tags: [Admin - Slot Timetable]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All slots deleted
 */
router.delete("/", deleteAllSlotsHandler);

/**
 * @swagger
 * /admin/slot-timetable/{slotCode}:
 *   get:
 *     summary: Get slot mapping by code
 *     tags: [Admin - Slot Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotCode
 *         required: true
 *         schema:
 *           type: string
 *         example: "P47"
 *     responses:
 *       200:
 *         description: Slot found
 *       404:
 *         description: Slot not found
 */
router.get("/:slotCode", getSlotByCodeHandler);

/**
 * @swagger
 * /admin/slot-timetable/{slotCode}:
 *   put:
 *     summary: Update slot mapping
 *     description: Modify existing slot time, day, etc.
 *     tags: [Admin - Slot Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotCode
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               day:
 *                 type: string
 *               dayNumber:
 *                 type: integer
 *               hourOrder:
 *                 type: integer
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               batch:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Slot updated
 *       400:
 *         description: Update failed
 *       404:
 *         description: Slot not found
 */
router.put("/:id", updateSlotMappingHandler);

/**
 * @swagger
 * /admin/slot-timetable/{slotCode}:
 *   delete:
 *     summary: Delete slot mapping
 *     tags: [Admin - Slot Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Slot deleted
 *       404:
 *         description: Slot not found
 */
router.delete("/:id", deleteSlotMappingHandler);

module.exports = router;