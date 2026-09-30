/**
 * Slot Parser Utility
 * Handles parsing of slot codes from various formats
 */

/**
 * Parse slot string to array of slot codes
 * Handles formats like: "P29,P30", "P47, P48", "P29, P30, P31"
 */
const parseSlotString = (slotString) => {
  if (!slotString || slotString.trim() === '') {
    return {
      valid: [],
      invalid: [],
      allValid: true
    };
  }

  // Split by comma and clean up
  const parts = slotString
    .split(',')
    .map(slot => slot.trim())
    .filter(slot => slot !== '');

  const validSlots = [];
  const invalidSlots = [];
  let lastPrefix = 'P'; // Default prefix if none is found

  parts.forEach(part => {
    let currentSlot = part;
    
    // Check if it starts with a letter (e.g., "P43")
    const match = part.match(/^([a-z]+)(\d+)$/i);
    if (match) {
      lastPrefix = match[1].toUpperCase();
      currentSlot = part.toUpperCase();
    } else if (/^\d+$/.test(part)) {
      // If it's just a number (e.g., "44"), prepend lastPrefix
      currentSlot = lastPrefix + part;
    }

    // Validate the resulting slot code (Letter(s) followed by optional digits)
    if (/^[A-Z]+\d*$/i.test(currentSlot)) {
      validSlots.push(currentSlot.toUpperCase());
    } else {
      invalidSlots.push(part);
    }
  });

  return {
    valid: validSlots,
    invalid: invalidSlots,
    allValid: invalidSlots.length === 0
  };
};

/**
 * Extract slot codes from teacher assignment data
 * Handles both Slot 1 and Slot 2 from the same row
 */
const extractSlotsFromTeacherData = (teacherRow) => {
  const result = {
    slot1: [],
    slot2: [],
    errors: []
  };

  // Parse Slot 1 (for Group 1)
  if (teacherRow['Slot 1']) {
    const parsed = parseSlotString(teacherRow['Slot 1']);
    if (parsed.allValid) {
      result.slot1 = parsed.valid;
    } else {
      result.errors.push(`Invalid slot codes in Slot 1: ${parsed.invalid.join(', ')}`);
    }
  }

  // Parse Slot 2 (for Group 2)
  if (teacherRow['Slot 2']) {
    const parsed = parseSlotString(teacherRow['Slot 2']);
    if (parsed.allValid) {
      result.slot2 = parsed.valid;
    } else {
      result.errors.push(`Invalid slot codes in Slot 2: ${parsed.invalid.join(', ')}`);
    }
  }

  return result;
};

/**
 * Validate slot code format
 */
const isValidSlotCode = (slotCode) => {
  // Relaxed: Letter(s) followed by digits (e.g., P1, B2, A1, C2)
  return /^[A-Z]+\d*$/i.test(slotCode);
};

/**
 * Normalize slot code (ensure uppercase, proper format)
 */
const normalizeSlotCode = (slotCode) => {
  if (!slotCode) return null;
  
  const normalized = slotCode.trim().toUpperCase();
  return isValidSlotCode(normalized) ? normalized : null;
};

/**
 * Parse multiple slot formats
 * Handles: "P29,P30", ["P29", "P30"], "P29"
 */
const parseSlots = (slots) => {
  // Already an array
  if (Array.isArray(slots)) {
    return slots.map(normalizeSlotCode).filter(s => s !== null);
  }

  // String format
  if (typeof slots === 'string') {
    const parsed = parseSlotString(slots);
    return parsed.valid;
  }

  // Invalid format
  return [];
};

/**
 * Format slot codes for display
 * ["P29", "P30"] → "P29, P30"
 */
const formatSlotsForDisplay = (slots) => {
  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    return 'No slots';
  }

  return slots.join(', ');
};

/**
 * Get slot range description
 * ["P47", "P48"] → "P47-P48"
 */
const getSlotRange = (slots) => {
  if (!slots || slots.length === 0) return '';
  if (slots.length === 1) return slots[0];

  // Sort slots numerically
  const sorted = [...slots].sort((a, b) => {
    const numA = parseInt(a.substring(1));
    const numB = parseInt(b.substring(1));
    return numA - numB;
  });

  // Check if consecutive
  const isConsecutive = sorted.every((slot, index) => {
    if (index === 0) return true;
    const currentNum = parseInt(slot.substring(1));
    const prevNum = parseInt(sorted[index - 1].substring(1));
    return currentNum === prevNum + 1;
  });

  if (isConsecutive) {
    return `${sorted[0]}-${sorted[sorted.length - 1]}`;
  }

  return sorted.join(', ');
};

module.exports = {
  parseSlotString,
  extractSlotsFromTeacherData,
  isValidSlotCode,
  normalizeSlotCode,
  parseSlots,
  formatSlotsForDisplay,
  getSlotRange
};