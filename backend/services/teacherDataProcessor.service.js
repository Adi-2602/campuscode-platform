const { parseTeacherJSON, parseFacultyEmailJSON } = require("../utils/jsonParser.util");
const { matchAllFaculty, createPlaceholderFaculty } = require("../utils/facultyMatcher.util");
const { batchCreateTeacherCredentials } = require("./credentialGeneration.service");

/**
 * Process teacher data from uploaded JSON files
 */
const processTeacherData = async (teacherFilePath, facultyEmailFilePath, uploadId, semesterId = null) => {
  // Parse teacher assignments JSON
  const teacherParseResult = await parseTeacherJSON(teacherFilePath);

  if (teacherParseResult.errors.length > 0) {
    console.warn(`[OCR-DEBUG] First invalid row:`, JSON.stringify(teacherParseResult.errors[0]));
    console.warn(`Found ${teacherParseResult.errors.length} invalid teacher records`);
  }

  if (teacherParseResult.teachers.length === 0) {
    // Check if it looks like a student file was uploaded by mistake
    const looksLikeStudentFile = teacherParseResult.errors.some(e => e.data && (e.data["Student Name"] || e.data["Registration Number"]));
    if (looksLikeStudentFile) {
      throw new Error("It looks like you uploaded a Student data file (Fake.json) into the Teacher slot. Please double-check your file selections.");
    }
    throw new Error("No valid teacher data found in the uploaded file. Please ensure the file contains 'Faculty Name', 'Section', and 'Course Code' columns.");
  }

  // Find semester name if provided
  let semesterNameNum = null;
  if (semesterId) {
    const Semester = require("../models/semester.model");
    const semester = await Semester.findById(semesterId);
    if (semester) {
      // Convert Roman numerals or numbers to a standard search term
      // E.g. "Semester VI" -> "VI" or "6"
      const match = semester.name.match(/(?:Semester\s+)?([IVX\d]+)/i);
      semesterNameNum = match ? match[1].toUpperCase() : null;
      console.log(`[OCR] Filtering teacher data for semester: ${semesterNameNum}`);
    }
  }

  // Filter teachers by semester AND practical suffixes
  const validSuffixes = ['J'];
  const romanToNum = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10 };
  
  const filteredTeachers = teacherParseResult.teachers.filter(assignment => {
    // 1. Semester filtering (Relaxed: We log it, but we process EVERYTHING in the file)
    if (semesterNameNum && assignment.rawData.Semester) {
      const rowSem = String(assignment.rawData.Semester).toUpperCase();
      const rowSemNum = romanToNum[rowSem] || parseInt(rowSem);
      const targetSemNum = romanToNum[semesterNameNum] || parseInt(semesterNameNum);
      
      if (rowSem !== semesterNameNum && rowSemNum !== targetSemNum) {
        // Just a debug log, don't filter out. 
        // User likely wants to upload a master file into the selected semester bucket.
        if (assignment.facultyName.includes("Anto")) {
           console.log(`[OCR-DEBUG] Including ${assignment.facultyName} (${rowSem}) despite upload being targeted for ${semesterNameNum}`);
        }
      }
    }

    // 2. Ensure course code exists
    if (!assignment.courseCode) return false;
    
    // We purposely keep ALL courses here (T, P, J, etc) so that ALL faculty get accounts
    // and correctly appear in the Timetable. Active Class filtering happens later.
    return true;
  });

  console.log(`[OCR] Filter Stats for Semester ${semesterNameNum}:
  - Total Teacher Rows: ${teacherParseResult.teachers.length}
  - Relevant Practical/Lab (For Class Creation): ${filteredTeachers.length}`);

  // Parse faculty email mapping JSON
  const emailParseResult = await parseFacultyEmailJSON(facultyEmailFilePath);

  // Match faculty names to emails for ALL unique faculty in the Entire Upload Data
  // This ensures every teacher gets an account, even if they don't have a J Lab
  const matchResult = matchAllFaculty(
    teacherParseResult.teachers,
    emailParseResult.facultyMap
  );

  // Create faculty list with placeholders for missing
  const facultyList = [
    ...matchResult.matched,
    ...matchResult.missing.map(m => createPlaceholderFaculty(m.facultyName))
  ];

  // Create teacher accounts with credentials
  const credentialResults = await batchCreateTeacherCredentials(
    facultyList,
    uploadId
  );

  // Create a map of faculty name to User ID for easy linkage
  const facultyUserIdMap = new Map();
  credentialResults.created.forEach(u => facultyUserIdMap.set(u.facultyName, u._id));
  credentialResults.updated.forEach(u => facultyUserIdMap.set(u.facultyName, u._id));

  // Link User IDs back to teacher assignments
  filteredTeachers.forEach(assignment => {
    assignment.mainFacultyId = facultyUserIdMap.get(assignment.facultyName);
    assignment.coFacultyId = assignment.coFaculty ? facultyUserIdMap.get(assignment.coFaculty) : null;
    assignment.coFaculty1Id = assignment.coFaculty1 ? facultyUserIdMap.get(assignment.coFaculty1) : null;
  });

  return {
    teacherAssignments: filteredTeachers, // Only create classes for J courses
    totalAssignments: filteredTeachers.length,
    validAssignments: teacherParseResult.valid,
    invalidAssignments: teacherParseResult.invalid,
    parseErrors: teacherParseResult.errors,
    
    facultyMatched: matchResult.matchedCount,
    facultyMissing: matchResult.missingCount,
    facultyMatchRate: matchResult.matchRate,
    missingFacultyList: matchResult.missing,
    
    teachersCreated: credentialResults.created.length,
    teachersUpdated: credentialResults.updated.length,
    credentialErrors: credentialResults.errors.length,
    
    teachers: credentialResults.created, // Teachers with passwords
    updatedTeachers: credentialResults.updated,
    errors: [...teacherParseResult.errors, ...credentialResults.errors]
  };
};

/**
 * Extract unique faculty from teacher assignments
 * Returns faculty names with their role (main faculty or co-faculty)
 */
const extractFacultyRoles = (teacherAssignments) => {
  const facultyRoles = {};

  teacherAssignments.forEach(assignment => {
    // Main faculty
    if (assignment.facultyName) {
      if (!facultyRoles[assignment.facultyName]) {
        facultyRoles[assignment.facultyName] = {
          facultyName: assignment.facultyName,
          isMainFaculty: false,
          isCoFaculty: false,
          courses: new Set()
        };
      }
      facultyRoles[assignment.facultyName].isMainFaculty = true;
      facultyRoles[assignment.facultyName].courses.add(assignment.courseCode);
    }

    // Co-faculty for Group 1
    if (assignment.coFaculty && assignment.coFaculty.trim() !== "") {
      if (!facultyRoles[assignment.coFaculty]) {
        facultyRoles[assignment.coFaculty] = {
          facultyName: assignment.coFaculty,
          isMainFaculty: false,
          isCoFaculty: false,
          courses: new Set()
        };
      }
      facultyRoles[assignment.coFaculty].isCoFaculty = true;
      facultyRoles[assignment.coFaculty].courses.add(assignment.courseCode);
    }

    // Co-faculty for Group 2
    if (assignment.coFaculty1 && assignment.coFaculty1.trim() !== "") {
      if (!facultyRoles[assignment.coFaculty1]) {
        facultyRoles[assignment.coFaculty1] = {
          facultyName: assignment.coFaculty1,
          isMainFaculty: false,
          isCoFaculty: false,
          courses: new Set()
        };
      }
      facultyRoles[assignment.coFaculty1].isCoFaculty = true;
      facultyRoles[assignment.coFaculty1].courses.add(assignment.courseCode);
    }
  });

  // Convert Sets to Arrays
  Object.values(facultyRoles).forEach(faculty => {
    faculty.courses = Array.from(faculty.courses);
  });

  return facultyRoles;
};

/**
 * Extract batch-section-group-course combinations from teacher assignments
 * Now includes parsed slot codes for timetable lookup
 */
const extractTeacherCombinations = (teacherAssignments) => {
  const combinations = [];
  const seen = new Set();

  teacherAssignments.forEach(assignment => {
    // Group 1 (Slot 1)
    // Inclusive: Always create at least Group 1 if it's a valid teacher assignment (the filtering handled the "practical" check)
    if (true) {
      // Granular signature includes unique course AND faculty to prevent merging overlapping schedules
      const sig1 = `${assignment.batch || 0}-${assignment.section}-1-${assignment.courseCode}-${assignment.mainFacultyId || assignment.facultyName}`;
      if (!seen.has(sig1)) {
        seen.add(sig1);
        combinations.push({
          batch: assignment.batch || 1, // Fallback to 1 for database schema compatibility
          section: (assignment.section || assignment.Section || "").toUpperCase(),
          group: 1,
          courseCode: assignment.courseCode,
          courseName: assignment.courseName,
          mainFaculty: assignment.facultyName,
          mainFacultyId: assignment.mainFacultyId,
          coFaculty: assignment.coFaculty,
          coFacultyId: assignment.coFacultyId,
          slot: assignment.slot1Raw || assignment.slot1 || "TBD", // Fallback to TBD if no slot info
          slotCodes: (assignment.slot1 && assignment.slot1.length > 0) ? assignment.slot1 : [],
          venue: assignment.venue
        });
      }
    }

    // Group 2 (Slot 2)
    if (assignment.slot2 && assignment.slot2.length > 0) {
      const sig2 = `${assignment.batch || 0}-${assignment.section}-2-${assignment.courseCode}-${assignment.mainFacultyId || assignment.facultyName}`;
      if (!seen.has(sig2)) {
        seen.add(sig2);
        combinations.push({
          batch: assignment.batch || 1, // Fallback to 1 for database schema compatibility
          section: (assignment.section || assignment.Section || "").toUpperCase(),
          group: 2,
          courseCode: assignment.courseCode,
          courseName: assignment.courseName,
          mainFaculty: assignment.facultyName,
          mainFacultyId: assignment.mainFacultyId,
          coFaculty: assignment.coFaculty1,
          coFacultyId: assignment.coFaculty1Id,
          slot: assignment.slot2Raw || assignment.slot2 || "TBD", // Fallback to TBD if no slot info
          slotCodes: assignment.slot2, 
          venue: assignment.venue
        });
      }
    }
  });

  return combinations;
};

/**
 * Group teacher assignments by course
 */
const groupTeachersByCourse = (teacherAssignments) => {
  const courses = {};

  teacherAssignments.forEach(assignment => {
    const courseCode = assignment.courseCode;
    
    if (!courses[courseCode]) {
      courses[courseCode] = [];
    }
    
    courses[courseCode].push(assignment);
  });

  return courses;
};

/**
 * Validate teacher data
 */
const validateTeacherData = (teacherAssignments) => {
  const errors = [];
  const warnings = [];

  teacherAssignments.forEach((assignment, index) => {
    // Check required fields
    if (!assignment.facultyName) {
      errors.push({
        row: index + 1,
        field: "Faculty Name",
        error: "Missing faculty name"
      });
    }

    if (!assignment.courseCode) {
      errors.push({
        row: index + 1,
        field: "Course Code",
        error: "Missing course code"
      });
    }

    // Validate batch
    if (![1, 2].includes(assignment.batch)) {
      errors.push({
        row: index + 1,
        field: "Batch",
        error: `Invalid batch: ${assignment.batch}. Must be 1 or 2`
      });
    }

    // Check if at least one slot is provided
    if (!assignment.slot1 && !assignment.slot2) {
      errors.push({
        row: index + 1,
        field: "Slots",
        error: "At least one slot (Slot 1 or Slot 2) must be provided"
      });
    }

    // Warn if co-faculty is missing for a slot
    if (assignment.slot1 && (!assignment.coFaculty || assignment.coFaculty.trim() === "")) {
      warnings.push({
        row: index + 1,
        field: "Co-Faculty",
        warning: "Slot 1 has no co-faculty assigned"
      });
    }

    if (assignment.slot2 && (!assignment.coFaculty1 || assignment.coFaculty1.trim() === "")) {
      warnings.push({
        row: index + 1,
        field: "Co-Faculty_1",
        warning: "Slot 2 has no co-faculty assigned"
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Get teacher statistics
 */
const getTeacherStatistics = (teacherAssignments) => {
  const stats = {
    totalAssignments: teacherAssignments.length,
    uniqueFaculty: new Set(),
    byBatch: {},
    bySection: {},
    byCourse: {},
    withSlot1: 0,
    withSlot2: 0,
    withBothSlots: 0
  };

  teacherAssignments.forEach(assignment => {
    // Unique faculty
    stats.uniqueFaculty.add(assignment.facultyName);
    if (assignment.coFaculty) stats.uniqueFaculty.add(assignment.coFaculty);
    if (assignment.coFaculty1) stats.uniqueFaculty.add(assignment.coFaculty1);

    // By batch
    stats.byBatch[assignment.batch] = (stats.byBatch[assignment.batch] || 0) + 1;

    // By section
    stats.bySection[assignment.section] = (stats.bySection[assignment.section] || 0) + 1;

    // By course
    stats.byCourse[assignment.courseCode] = (stats.byCourse[assignment.courseCode] || 0) + 1;

    // Slot statistics
    if (assignment.slot1) stats.withSlot1++;
    if (assignment.slot2) stats.withSlot2++;
    if (assignment.slot1 && assignment.slot2) stats.withBothSlots++;
  });

  stats.uniqueFacultyCount = stats.uniqueFaculty.size;
  delete stats.uniqueFaculty; // Remove Set, keep count only

  return stats;
};

module.exports = {
  processTeacherData,
  extractFacultyRoles,
  extractTeacherCombinations,
  groupTeachersByCourse,
  validateTeacherData,
  getTeacherStatistics
};