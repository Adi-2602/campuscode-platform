const SlotTimetable = require("../models/slotTimetable.model");

/**
 * Calculate duration from start and end time
 */
const calculateDuration = (startTime, endTime) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return endMinutes - startMinutes;
};

/**
 * Create single slot mapping
 */
const createSlotMapping = async (slotData) => {
  // Check if a mapping already exists in this specific CELL
  const existing = await SlotTimetable.findOne({
    semesterId: slotData.semesterId,
    batch: slotData.batch,
    dayNumber: slotData.dayNumber,
    hourOrder: slotData.hourOrder
  });

  if (existing) {
    throw new Error(`Slot ${existing.slotCode} already exists at this time (Day ${slotData.dayNumber}, Hour ${slotData.hourOrder})`);
  }

  // Calculate duration
  const duration = calculateDuration(slotData.startTime, slotData.endTime);

  const slot = await SlotTimetable.create({
    ...slotData,
    slotCode: slotData.slotCode.toUpperCase(),
    duration,
    isLab: true,
    slotType: "lab",
    isActive: true
  });

  return slot;
};

/**
 * Bulk create slot mappings
 */
const bulkCreateSlotMappings = async (semesterId, slots, clearExisting = false) => {
  // Clear existing FOR THIS SEMESTER if requested
  if (clearExisting) {
    await SlotTimetable.deleteMany({ semesterId });
  }

  // Process slots and calculate duration
  const processedSlots = slots.map(slot => {
    const duration = calculateDuration(slot.startTime, slot.endTime);

    return {
      ...slot,
      semesterId,
      slotCode: slot.slotCode.toUpperCase(),
      duration,
      isLab: true,
      slotType: "lab",
      isActive: true
    };
  });

  // Validate no CELL collisions in input data
  const cellKeys = processedSlots.map(s => `${s.batch}-${s.dayNumber}-${s.hourOrder}`);
  const uniqueCells = new Set(cellKeys);

  if (cellKeys.length !== uniqueCells.size) {
    throw new Error("Duplicate grid cells found in input data");
  }

  // Bulk insert
  const result = await SlotTimetable.insertMany(processedSlots);

  return {
    success: true,
    imported: result.length,
    message: `Successfully imported ${result.length} slot mappings`
  };
};

/**
 * Get slot timetable by slot code
 */
const getSlotByCode = async (slotCode) => {
  const slot = await SlotTimetable.findOne({
    slotCode: slotCode.toUpperCase(),
    isActive: true
  });

  if (!slot) {
    throw new Error(`Slot ${slotCode} not found in timetable`);
  }

  return slot;
};

/**
 * Get slot timetable by multiple slot codes
 */
const getSlotsByCodes = async (slotCodes, semesterId, batch) => {
  const query = {
    slotCode: { $in: slotCodes.map(s => s.toUpperCase()) },
    isActive: true
  };
  if (semesterId) query.semesterId = semesterId;
  if (batch) query.batch = batch;

  const slots = await SlotTimetable.find(query).sort({ dayNumber: 1, hourOrder: 1 });
  return slots;
};

/**
 * Calculate combined schedule from multiple slots
 * Used when class uses multiple slots (e.g., P47, P48)
 */
const calculateCombinedSchedule = async (slotCodes, semesterId, batch) => {
  if (!slotCodes || slotCodes.length === 0) {
    return null;
  }

  const slots = await getSlotsByCodes(slotCodes, semesterId, batch);

  if (slots.length === 0) {
    throw new Error(`No slots found for codes: ${slotCodes.join(", ")}`);
  }

  if (slots.length !== slotCodes.length) {
    const foundCodes = slots.map(s => s.slotCode);
    const missingCodes = slotCodes.filter(code => !foundCodes.includes(code.toUpperCase()));
    throw new Error(`Slots not found: ${missingCodes.join(", ")}`);
  }

  // Check if all slots are on the same day
  const days = [...new Set(slots.map(s => s.day))];
  if (days.length > 1) {
    throw new Error(`Slots are on different days: ${days.join(", ")}. All slots must be on the same day.`);
  }

  // Sort by start time
  slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Calculate combined schedule
  const firstSlot = slots[0];
  const lastSlot = slots[slots.length - 1];

  const totalDuration = slots.reduce((sum, slot) => sum + slot.duration, 0);

  return {
    day: firstSlot.day,
    dayNumber: firstSlot.dayNumber,
    startTime: firstSlot.startTime,
    endTime: lastSlot.endTime,
    duration: totalDuration,
    slots: slots.map(s => ({
      slotCode: s.slotCode,
      startTime: s.startTime,
      endTime: s.endTime,
      duration: s.duration
    })),
    slotCodes: slots.map(s => s.slotCode)
  };
};

/**
 * Get all slot timetables
 */
const getAllSlots = async (filters = {}) => {
  const query = { isActive: true };

  if (filters.semesterId) {
    query.semesterId = filters.semesterId;
  }

  if (filters.batch) {
    query.batch = filters.batch;
  }

  if (filters.day) {
    query.day = filters.day;
  }

  if (filters.dayNumber) {
    query.dayNumber = filters.dayNumber;
  }

  const slots = await SlotTimetable.find(query)
    .sort({ batch: 1, dayNumber: 1, hourOrder: 1 });

  return slots;
};

/**
 * Get timetable organized by day
 */
const getTimetableByDay = async (semesterId, batch) => {
  const slots = await SlotTimetable.find({
    semesterId,
    batch,
    isActive: true
  }).sort({ dayNumber: 1, hourOrder: 1 });

  const byDay = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: []
  };

  slots.forEach(slot => {
    if (byDay[slot.day]) {
      byDay[slot.day].push(slot);
    }
  });

  return byDay;
};

/**
 * Check if timetable is imported
 */
const isTimetableImported = async () => {
  const count = await SlotTimetable.countDocuments({ isActive: true });
  return count > 0;
};

/**
 * Get timetable statistics
 */
const getTimetableStatistics = async (semesterId) => {
  const query = { isActive: true };
  if (semesterId) query.semesterId = semesterId;

  const [batch1Count, batch2Count, totalCount] = await Promise.all([
    SlotTimetable.countDocuments({ ...query, batch: 1 }),
    SlotTimetable.countDocuments({ ...query, batch: 2 }),
    SlotTimetable.countDocuments(query)
  ]);

  return {
    batch1: batch1Count,
    batch2: batch2Count,
    total: totalCount,
    isImported: totalCount > 0
  };
};

/**
 * Update slot mapping
 */
const updateSlotMapping = async (id, updateData) => {
  // Recalculate duration if times changed
  if (updateData.startTime && updateData.endTime) {
    updateData.duration = calculateDuration(updateData.startTime, updateData.endTime);
  }

  const slot = await SlotTimetable.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!slot) {
    throw new Error(`Slot mapping not found`);
  }

  return slot;
};

/**
 * Delete slot mapping
 */
const deleteSlotMapping = async (id) => {
  const slot = await SlotTimetable.findByIdAndDelete(id);

  if (!slot) {
    throw new Error(`Slot mapping not found`);
  }

  return {
    success: true,
    message: `Slot mapping deleted successfully`
  };
};

/**
 * Delete all slot mappings
 */
const deleteAllSlotMappings = async (semesterId) => {
  const query = {};
  if (semesterId) query.semesterId = semesterId;
  const result = await SlotTimetable.deleteMany(query);

  return {
    success: true,
    deleted: result.deletedCount,
    message: `Deleted ${result.deletedCount} slot mappings`
  };
};

module.exports = {
  createSlotMapping,
  bulkCreateSlotMappings,
  getSlotByCode,
  getSlotsByCodes,
  calculateCombinedSchedule,
  getAllSlots,
  getTimetableByDay,
  isTimetableImported,
  getTimetableStatistics,
  updateSlotMapping,
  deleteSlotMapping,
  deleteAllSlotMappings
};