/**
 * Co-Faculty Parser Utility
 * Handles parsing of co-faculty names from various formats
 */

/**
 * Parse co-faculty string to extract individual faculty names
 * Handles formats like:
 * - "Mrs. K. Jeeva, Dr. P. Nalini(Main)"
 * - "Dr. A. Kumar"
 * - "Dr. X, Dr. Y, Dr. Z(Main)"
 */
const parseCoFacultyString = (coFacultyString) => {
  if (!coFacultyString || coFacultyString.trim() === '') {
    return {
      facultyList: [],
      mainFaculty: null
    };
  }

  const result = {
    facultyList: [],
    mainFaculty: null
  };

  // Split by comma
  const names = coFacultyString.split(',').map(name => name.trim());

  names.forEach(name => {
    // Check if this is marked as (Main)
    const isMain = name.includes('(Main)');
    
    // Clean the name (remove (Main) notation)
    let cleanName = name.replace(/\(Main\)/gi, '').trim();

    if (cleanName) {
      result.facultyList.push(cleanName);
      
      if (isMain) {
        result.mainFaculty = cleanName;
      }
    }
  });

  return result;
};

/**
 * Extract co-faculty from teacher row data
 * Handles Co-Faculty and Co-Faculty_1 fields
 */
const extractCoFacultyFromRow = (teacherRow) => {
  const result = {
    coFaculty: null,      // For Group 1 (Slot 1)
    coFaculty1: null,     // For Group 2 (Slot 2)
    allCoFaculty: [],     // All co-faculty mentioned
    errors: []
  };

  // Parse Co-Faculty field (for Group 1)
  if (teacherRow['Co-Faculty']) {
    const parsed = parseCoFacultyString(teacherRow['Co-Faculty']);
    
    if (parsed.facultyList.length > 0) {
      // Use the first one as primary co-faculty for Group 1
      result.coFaculty = parsed.facultyList[0];
      result.allCoFaculty.push(...parsed.facultyList);
    }
  }

  // Parse Co-Faculty_1 field (for Group 2)
  if (teacherRow['Co-Faculty_1'] || teacherRow['Co-Faculty 1']) {
    const coFacultyField = teacherRow['Co-Faculty_1'] || teacherRow['Co-Faculty 1'];
    const parsed = parseCoFacultyString(coFacultyField);
    
    if (parsed.facultyList.length > 0) {
      // Use the first one as primary co-faculty for Group 2
      result.coFaculty1 = parsed.facultyList[0];
      result.allCoFaculty.push(...parsed.facultyList);
    }
  }

  // Remove duplicates from allCoFaculty
  result.allCoFaculty = [...new Set(result.allCoFaculty)];

  return result;
};

/**
 * Clean faculty name
 * Removes extra spaces, titles, etc.
 */
const cleanFacultyName = (name) => {
  if (!name) return null;

  return name
    .trim()
    .replace(/\s+/g, ' ')  // Multiple spaces to single
    .replace(/\(Main\)/gi, '')  // Remove (Main)
    .trim();
};

/**
 * Normalize faculty name for matching
 * Used for fuzzy matching with email list
 */
const normalizeFacultyName = (name) => {
  if (!name) return '';

  return cleanFacultyName(name)
    .toLowerCase()
    .replace(/\./g, '')  // Remove dots
    .replace(/dr\s+/gi, '')  // Remove Dr.
    .replace(/mrs?\s+/gi, '')  // Remove Mr./Mrs.
    .replace(/ms\s+/gi, '')  // Remove Ms.
    .replace(/prof\s+/gi, '')  // Remove Prof.
    .trim();
};

/**
 * Check if co-faculty field has (Main) notation
 */
const hasMainNotation = (coFacultyString) => {
  if (!coFacultyString) return false;
  return /\(Main\)/i.test(coFacultyString);
};

/**
 * Get all unique faculty names from teacher data
 */
const getAllFacultyNames = (teacherRows) => {
  const facultySet = new Set();

  teacherRows.forEach(row => {
    // Add main faculty
    if (row['Faculty Name']) {
      facultySet.add(cleanFacultyName(row['Faculty Name']));
    }

    // Add co-faculty
    const coFaculty = extractCoFacultyFromRow(row);
    coFaculty.allCoFaculty.forEach(name => {
      facultySet.add(cleanFacultyName(name));
    });
  });

  return Array.from(facultySet).filter(name => name);
};

module.exports = {
  parseCoFacultyString,
  extractCoFacultyFromRow,
  cleanFacultyName,
  normalizeFacultyName,
  hasMainNotation,
  getAllFacultyNames
};