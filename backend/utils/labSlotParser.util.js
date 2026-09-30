const xlsx = require("xlsx");
const fs = require("fs");

/**
 * Parse Excel file to lab slots array
 */
const parseExcelToLabSlots = async (filePath) => {
  try {
    // Read the Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    if (!jsonData || jsonData.length === 0) {
      throw new Error("No data found in the uploaded file");
    }

    // Parse and validate each row
    const labSlots = [];

    for (const row of jsonData) {
      try {
        const labSlot = parseLabSlotRow(row);
        labSlots.push(labSlot);
      } catch (error) {
        console.warn(`Skipping invalid row: ${error.message}`, row);
      }
    }

    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return labSlots;
  } catch (error) {
    // Clean up uploaded file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

/**
 * Parse a single row from Excel/CSV
 * Expected columns: SlotCode, Day, StartTime, EndTime, Batch, HourOrder
 */
const parseLabSlotRow = (row) => {
  // Handle different possible column names (case-insensitive)
  const slotCode = getColumnValue(row, ["SlotCode", "Slot Code", "Code", "slotCode"]);
  const day = getColumnValue(row, ["Day", "day"]);
  const startTime = getColumnValue(row, ["StartTime", "Start Time", "startTime"]);
  const endTime = getColumnValue(row, ["EndTime", "End Time", "endTime"]);
  const batch = getColumnValue(row, ["Batch", "batch"]);
  const hourOrder = getColumnValue(row, ["HourOrder", "Hour Order", "hourOrder", "Order"]);

  // Validate required fields
  if (!slotCode) throw new Error("SlotCode is required");
  if (!day) throw new Error("Day is required");
  if (!startTime) throw new Error("StartTime is required");
  if (!endTime) throw new Error("EndTime is required");
  if (!batch) throw new Error("Batch is required");
  if (hourOrder === undefined || hourOrder === null) throw new Error("HourOrder is required");

  // Validate and normalize data
  const normalizedSlotCode = String(slotCode).trim().toUpperCase();
  const normalizedDay = normalizeDay(String(day).trim());
  const normalizedStartTime = normalizeTime(String(startTime).trim());
  const normalizedEndTime = normalizeTime(String(endTime).trim());
  const normalizedBatch = parseInt(batch);
  const normalizedHourOrder = parseInt(hourOrder);

  // Validate slot code format (P1, P2, P47, etc.)
  if (!/^P\d{1,2}$/i.test(normalizedSlotCode)) {
    throw new Error(`Invalid slot code format: ${slotCode}. Expected: P1, P2, P47, etc.`);
  }

  // Validate day
  const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  if (!validDays.includes(normalizedDay)) {
    throw new Error(`Invalid day: ${day}. Must be one of: ${validDays.join(", ")}`);
  }

  // Validate batch
  if (normalizedBatch !== 1 && normalizedBatch !== 2) {
    throw new Error(`Invalid batch: ${batch}. Must be 1 or 2`);
  }

  // Validate hour order
  if (isNaN(normalizedHourOrder) || normalizedHourOrder < 1 || normalizedHourOrder > 12) {
    throw new Error(`Invalid hour order: ${hourOrder}. Must be between 1 and 12`);
  }

  return {
    slotCode: normalizedSlotCode,
    day: normalizedDay,
    startTime: normalizedStartTime,
    endTime: normalizedEndTime,
    batch: normalizedBatch,
    hourOrder: normalizedHourOrder,
    isActive: true
  };
};

/**
 * Get column value (case-insensitive column name matching)
 */
const getColumnValue = (row, possibleNames) => {
  for (const name of possibleNames) {
    // Check exact match
    if (row[name] !== undefined) {
      return row[name];
    }

    // Check case-insensitive match
    const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
    if (key) {
      return row[key];
    }
  }
  return null;
};

/**
 * Normalize day name
 */
const normalizeDay = (day) => {
  const dayMap = {
    "mon": "Monday",
    "monday": "Monday",
    "tue": "Tuesday",
    "tues": "Tuesday",
    "tuesday": "Tuesday",
    "wed": "Wednesday",
    "wednesday": "Wednesday",
    "thu": "Thursday",
    "thurs": "Thursday",
    "thursday": "Thursday",
    "fri": "Friday",
    "friday": "Friday"
  };

  return dayMap[day.toLowerCase()] || day;
};

/**
 * Normalize time format
 * Accepts: "8:00", "08:00", "1:25 PM", "13:25"
 * Returns: "HH:MM" in 24-hour format
 */
const normalizeTime = (time) => {
  // Remove spaces
  time = time.replace(/\s+/g, "");

  // Check if time contains AM/PM
  const isPM = /PM$/i.test(time);
  const isAM = /AM$/i.test(time);

  // Remove AM/PM
  time = time.replace(/AM|PM/gi, "");

  // Split hours and minutes
  const parts = time.split(":");
  if (parts.length !== 2) {
    throw new Error(`Invalid time format: ${time}. Expected HH:MM`);
  }

  let hours = parseInt(parts[0]);
  let minutes = parseInt(parts[1]);

  // Validate hours and minutes
  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Invalid time: ${time}`);
  }

  // Convert 12-hour to 24-hour format
  if (isPM && hours !== 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  // Validate 24-hour format
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time: ${time}`);
  }

  // Format as HH:MM
  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");

  return `${formattedHours}:${formattedMinutes}`;
};

/**
 * Validate lab slot data
 */
const validateLabSlotData = (slotData) => {
  const errors = [];

  if (!slotData.slotCode) {
    errors.push("Slot code is required");
  }

  if (!slotData.day) {
    errors.push("Day is required");
  }

  if (!slotData.startTime) {
    errors.push("Start time is required");
  }

  if (!slotData.endTime) {
    errors.push("End time is required");
  }

  if (!slotData.batch) {
    errors.push("Batch is required");
  }

  if (slotData.hourOrder === undefined) {
    errors.push("Hour order is required");
  }

  return errors;
};

module.exports = {
  parseExcelToLabSlots,
  parseLabSlotRow,
  validateLabSlotData
};