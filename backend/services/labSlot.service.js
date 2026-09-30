const LabSlot = require("../models/labSlot.model");

/**
 * Create a single lab slot
 */
const createLabSlot = async (data) => {
  const { slotCode, day, startTime, endTime, batch, hourOrder, isActive, adminId } = data;

  // Check if slot code already exists
  const existingSlot = await LabSlot.findOne({ slotCode });

  if (existingSlot) {
    throw new Error(`Lab slot with code "${slotCode}" already exists`);
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    throw new Error("Time must be in HH:MM format (24-hour)");
  }

  // Validate start time is before end time
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes >= endMinutes) {
    throw new Error("Start time must be before end time");
  }

  const labSlot = await LabSlot.create({
    slotCode: slotCode.toUpperCase(),
    day,
    startTime,
    endTime,
    batch,
    hourOrder,
    isActive: isActive !== undefined ? isActive : true,
    createdBy: adminId
  });

  return labSlot;
};

/**
 * Create multiple lab slots in bulk
 */
const createLabSlotsBulk = async (slotsArray, adminId) => {
  const results = {
    created: [],
    skipped: [],
    errors: []
  };

  for (const slotData of slotsArray) {
    try {
      // Check if slot already exists
      const existing = await LabSlot.findOne({ slotCode: slotData.slotCode.toUpperCase() });

      if (existing) {
        results.skipped.push({
          slotCode: slotData.slotCode,
          reason: "Slot code already exists"
        });
        continue;
      }

      const labSlot = await createLabSlot({
        ...slotData,
        adminId
      });

      results.created.push(labSlot);
    } catch (error) {
      results.errors.push({
        slotCode: slotData.slotCode,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Get all lab slots with optional filters
 */
const getAllLabSlots = async (filters = {}, options = {}) => {
  const { batch, day, isActive } = filters;
  const { page = 1, limit = 50, sort = "batch hourOrder" } = options;

  const query = {};

  if (batch) {
    query.batch = parseInt(batch);
  }

  if (day) {
    query.day = day;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === "true" || isActive === true;
  }

  const skip = (page - 1) * limit;

  const [labSlots, total] = await Promise.all([
    LabSlot.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email role")
      .lean(),
    LabSlot.countDocuments(query)
  ]);

  return {
    labSlots,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get lab slot by ID
 */
const getLabSlotById = async (slotId) => {
  const labSlot = await LabSlot.findById(slotId)
    .populate("createdBy", "name email role")
    .lean();

  if (!labSlot) {
    throw new Error("Lab slot not found");
  }

  return labSlot;
};

/**
 * Update lab slot
 */
const updateLabSlot = async (slotId, data) => {
  const { slotCode, day, startTime, endTime, batch, hourOrder, isActive } = data;

  const labSlot = await LabSlot.findById(slotId);

  if (!labSlot) {
    throw new Error("Lab slot not found");
  }

  // If changing slot code, check for duplicates
  if (slotCode && slotCode.toUpperCase() !== labSlot.slotCode) {
    const existing = await LabSlot.findOne({
      _id: { $ne: slotId },
      slotCode: slotCode.toUpperCase()
    });

    if (existing) {
      throw new Error(`Lab slot with code "${slotCode}" already exists`);
    }
    labSlot.slotCode = slotCode.toUpperCase();
  }

  // Validate time format if provided
  if (startTime || endTime) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    const start = startTime || labSlot.startTime;
    const end = endTime || labSlot.endTime;

    if (!timeRegex.test(start) || !timeRegex.test(end)) {
      throw new Error("Time must be in HH:MM format (24-hour)");
    }

    // Validate start time is before end time
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      throw new Error("Start time must be before end time");
    }

    if (startTime) labSlot.startTime = startTime;
    if (endTime) labSlot.endTime = endTime;
  }

  // Update other fields
  if (day) labSlot.day = day;
  if (batch) labSlot.batch = batch;
  if (hourOrder !== undefined) labSlot.hourOrder = hourOrder;
  if (isActive !== undefined) labSlot.isActive = isActive;

  await labSlot.save();

  return labSlot;
};

/**
 * Delete lab slot
 */
const deleteLabSlot = async (slotId) => {
  const labSlot = await LabSlot.findById(slotId);

  if (!labSlot) {
    throw new Error("Lab slot not found");
  }

  // TODO: Check if slot is being used in any class schedule templates
  // For now, just delete

  await LabSlot.findByIdAndDelete(slotId);

  return {
    message: "Lab slot deleted successfully",
    slotId
  };
};

/**
 * Get lab slots by batch
 */
const getLabSlotsByBatch = async (batch) => {
  const labSlots = await LabSlot.find({ batch })
    .sort("day hourOrder")
    .lean();

  return labSlots;
};

/**
 * Get timetable view (formatted as grid)
 */
const getTimetableView = async (batch) => {
  const labSlots = await LabSlot.find({ batch, isActive: true })
    .sort("day hourOrder")
    .lean();

  // Group by day
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timetable = {};

  days.forEach(day => {
    timetable[day] = labSlots.filter(slot => slot.day === day);
  });

  return {
    batch,
    timetable,
    totalSlots: labSlots.length
  };
};

/**
 * Validate slot code format
 */
const validateSlotCode = (slotCode) => {
  // Slot code should be P followed by 1-2 digits (P1, P47, etc.)
  const slotCodeRegex = /^P\d{1,2}$/i;
  
  if (!slotCodeRegex.test(slotCode)) {
    throw new Error("Slot code must be in format: P1, P2, P47, etc.");
  }

  return slotCode.toUpperCase();
};

/**
 * Get lab slot statistics
 */
const getLabSlotStats = async () => {
  const [total, batch1Count, batch2Count, byDay] = await Promise.all([
    LabSlot.countDocuments(),
    LabSlot.countDocuments({ batch: 1 }),
    LabSlot.countDocuments({ batch: 2 }),
    LabSlot.aggregate([
      {
        $group: {
          _id: "$day",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ])
  ]);

  return {
    total,
    batch1: batch1Count,
    batch2: batch2Count,
    byDay
  };
};

module.exports = {
  createLabSlot,
  createLabSlotsBulk,
  getAllLabSlots,
  getLabSlotById,
  updateLabSlot,
  deleteLabSlot,
  getLabSlotsByBatch,
  getTimetableView,
  validateSlotCode,
  getLabSlotStats
};