const {
  createSlotMapping,
  bulkCreateSlotMappings,
  getAllSlots,
  getSlotByCode,
  getTimetableStatistics,
  updateSlotMapping,
  deleteSlotMapping,
  deleteAllSlotMappings
} = require("../services/slotTimetable.service");

/**
 * Create single slot mapping manually
 * POST /admin/slot-timetable
 */
const createSlotMappingHandler = async (req, res) => {
  try {
    const slotData = req.body;
    const slot = await createSlotMapping(slotData);

    res.status(201).json({
      success: true,
      message: "Slot mapping created successfully",
      slot
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Bulk create/update slot mappings
 * POST /admin/slot-timetable/bulk
 */
const bulkCreateSlotsHandler = async (req, res) => {
  try {
    const { semesterId, slots, clearExisting } = req.body;

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        error: "Slots array is required and must not be empty"
      });
    }

    if (!semesterId) {
      return res.status(400).json({ error: "semesterId is required for bulk creation" });
    }

    const result = await bulkCreateSlotMappings(semesterId, slots, clearExisting);

    res.json(result);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get all slot mappings
 * GET /admin/slot-timetable
 */
const getAllSlotsHandler = async (req, res) => {
  try {
    const { semesterId, batch, day } = req.query;
    const filters = {};

    if (semesterId) filters.semesterId = semesterId;
    if (batch) filters.batch = parseInt(batch);
    if (day) filters.day = day;

    const slots = await getAllSlots(filters);

    res.json({
      slots,
      total: slots.length,
      filters
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get slot by code
 * GET /admin/slot-timetable/:slotCode
 */
const getSlotByCodeHandler = async (req, res) => {
  try {
    const { slotCode } = req.params;
    const slot = await getSlotByCode(slotCode);
    res.json(slot);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

/**
 * Update slot mapping
 * PUT /admin/slot-timetable/:slotCode
 */
const updateSlotMappingHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const slot = await updateSlotMapping(id, updateData);

    res.json({
      success: true,
      message: `Slot updated successfully`,
      slot
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete slot mapping
 * DELETE /admin/slot-timetable/:slotCode
 */
const deleteSlotMappingHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteSlotMapping(id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

/**
 * Delete all slot mappings
 * DELETE /admin/slot-timetable
 */
const deleteAllSlotsHandler = async (req, res) => {
  try {
    const { semesterId } = req.query;
    const result = await deleteAllSlotMappings(semesterId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get timetable statistics
 * GET /admin/slot-timetable/stats
 */
const getTimetableStatsHandler = async (req, res) => {
  try {
    const { semesterId } = req.query;
    const stats = await getTimetableStatistics(semesterId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Export timetable as JSON
 * GET /admin/slot-timetable/export
 */
const exportTimetableHandler = async (req, res) => {
  try {
    const { semesterId, batch } = req.query;
    const filters = {};
    if (semesterId) filters.semesterId = semesterId;
    if (batch) filters.batch = parseInt(batch);

    const slots = await getAllSlots(filters);

    res.json({
      exportDate: new Date().toISOString(),
      totalSlots: slots.length,
      batch: batch || "all",
      slots: slots.map(s => ({
        slotCode: s.slotCode,
        batch: s.batch,
        day: s.day,
        dayNumber: s.dayNumber,
        hourOrder: s.hourOrder,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createSlotMappingHandler,
  bulkCreateSlotsHandler,
  getAllSlotsHandler,
  getSlotByCodeHandler,
  updateSlotMappingHandler,
  deleteSlotMappingHandler,
  deleteAllSlotsHandler,
  getTimetableStatsHandler,
  exportTimetableHandler
};