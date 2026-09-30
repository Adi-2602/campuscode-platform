const {
  createLabSlot,
  createLabSlotsBulk,
  getAllLabSlots,
  getLabSlotById,
  updateLabSlot,
  deleteLabSlot,
  getLabSlotsByBatch,
  getTimetableView,
  getLabSlotStats
} = require("../services/labSlot.service");

const { parseExcelToLabSlots } = require("../utils/labSlotParser.util");

/**
 * Create a single lab slot
 * POST /admin/lab-slots
 */
const createLabSlotHandler = async (req, res) => {
  try {
    const { slotCode, day, startTime, endTime, batch, hourOrder, isActive } = req.body;

    if (!slotCode || !day || !startTime || !endTime || !batch || hourOrder === undefined) {
      return res.status(400).json({
        error: "Missing required fields: slotCode, day, startTime, endTime, batch, hourOrder"
      });
    }

    const labSlot = await createLabSlot({
      slotCode,
      day,
      startTime,
      endTime,
      batch,
      hourOrder,
      isActive,
      adminId: req.user.id
    });

    res.status(201).json({
      message: "Lab slot created successfully",
      labSlot
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Create multiple lab slots from uploaded file
 * POST /admin/lab-slots/bulk
 */
const createLabSlotsBulkHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded. Please upload an Excel or CSV file."
      });
    }

    // Parse the uploaded file
    const slotsArray = await parseExcelToLabSlots(req.file.path);

    if (!slotsArray || slotsArray.length === 0) {
      return res.status(400).json({
        error: "No valid lab slot data found in the uploaded file"
      });
    }

    // Create lab slots in bulk
    const results = await createLabSlotsBulk(slotsArray, req.user.id);

    res.status(201).json({
      message: "Bulk lab slot creation completed",
      results: {
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      details: results
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get all lab slots with optional filters
 * GET /admin/lab-slots
 */
const getAllLabSlotsHandler = async (req, res) => {
  try {
    const { batch, day, isActive, page, limit, sort } = req.query;

    const result = await getAllLabSlots(
      { batch, day, isActive },
      { page, limit, sort }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get lab slot by ID
 * GET /admin/lab-slots/:slotId
 */
const getLabSlotByIdHandler = async (req, res) => {
  try {
    const { slotId } = req.params;

    const labSlot = await getLabSlotById(slotId);

    res.json({
      labSlot
    });
  } catch (error) {
    res.status(404).json({
      error: error.message
    });
  }
};

/**
 * Update lab slot
 * PUT /admin/lab-slots/:slotId
 */
const updateLabSlotHandler = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { slotCode, day, startTime, endTime, batch, hourOrder, isActive } = req.body;

    const labSlot = await updateLabSlot(slotId, {
      slotCode,
      day,
      startTime,
      endTime,
      batch,
      hourOrder,
      isActive
    });

    res.json({
      message: "Lab slot updated successfully",
      labSlot
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Delete lab slot
 * DELETE /admin/lab-slots/:slotId
 */
const deleteLabSlotHandler = async (req, res) => {
  try {
    const { slotId } = req.params;

    const result = await deleteLabSlot(slotId);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get lab slots by batch
 * GET /admin/lab-slots/batch/:batch
 */
const getLabSlotsByBatchHandler = async (req, res) => {
  try {
    const { batch } = req.params;

    if (!batch || (batch !== "1" && batch !== "2")) {
      return res.status(400).json({
        error: "Batch must be 1 or 2"
      });
    }

    const labSlots = await getLabSlotsByBatch(parseInt(batch));

    res.json({
      batch: parseInt(batch),
      labSlots,
      total: labSlots.length
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get timetable view (formatted as grid)
 * GET /admin/lab-slots/timetable/:batch
 */
const getTimetableViewHandler = async (req, res) => {
  try {
    const { batch } = req.params;

    if (!batch || (batch !== "1" && batch !== "2")) {
      return res.status(400).json({
        error: "Batch must be 1 or 2"
      });
    }

    const timetable = await getTimetableView(parseInt(batch));

    res.json(timetable);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get lab slot statistics
 * GET /admin/lab-slots/stats
 */
const getLabSlotStatsHandler = async (req, res) => {
  try {
    const stats = await getLabSlotStats();

    res.json({
      stats
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  createLabSlotHandler,
  createLabSlotsBulkHandler,
  getAllLabSlotsHandler,
  getLabSlotByIdHandler,
  updateLabSlotHandler,
  deleteLabSlotHandler,
  getLabSlotsByBatchHandler,
  getTimetableViewHandler,
  getLabSlotStatsHandler
};