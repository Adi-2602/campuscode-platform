const fs = require("fs");
const path = require("path");

/**
 * Parse JSON data (from file path or buffer/string)
 */
const parseJSONFile = async (input) => {
  try {
    let fileContent;

    if (Buffer.isBuffer(input)) {
      fileContent = input.toString();
    } else if (typeof input === "string") {
      // Check if it's a file path or JSON content
      if (input.trim().startsWith('[') || input.trim().startsWith('{')) {
        fileContent = input;
      } else {
        // Assume it's a file path
        if (!fs.existsSync(input)) {
          throw new Error(`File not found: ${input}`);
        }
        fileContent = fs.readFileSync(input, "utf8");
      }
    } else {
      throw new Error("Invalid input type for JSON parsing");
    }

    const data = JSON.parse(fileContent);
    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Parse student JSON (Fake.json)
 * Expected structure: Array of student objects
 */
const parseStudentJSON = async (filePath) => {
  const data = await parseJSONFile(filePath);

  if (!Array.isArray(data)) {
    throw new Error("Student data must be an array");
  }

  // Validate required fields
  const requiredFields = [
    "Registration Number",
    "Student Name",
    "Semester",
    "Batch",
    "Section",
    "Group"
  ];

  const students = [];
  const errors = [];

  data.forEach((student, index) => {
    const missing = requiredFields.filter(field => !student[field]);

    if (missing.length > 0) {
      errors.push({
        row: index + 1,
        error: `Missing required fields: ${missing.join(", ")}`,
        data: student
      });
      return;
    }

    students.push({
      registrationNumber: String(student["Registration Number"]).trim(),
      studentName: String(student["Student Name"]).trim(),
      email: student["Official Email"] ? String(student["Official Email"]).trim().toLowerCase() : null,
      semester: parseInt(student["Semester"]),
      batch: parseInt(student["Batch"]),
      section: String(student["Section"]).trim().toUpperCase(),
      group: parseInt(student["Group"]),
      department: student["Department"] ? String(student["Department"]).trim() : null,

      program: student["Program"] ? String(student["Program"]).trim() : null,
      branch: student["Branch"] ? String(student["Branch"]).trim() : null,
      specialization: student["Specialization"] ? String(student["Specialization"]).trim() : null,

      facultyAdvisor: student["Faculty Advisor"] ? String(student["Faculty Advisor"]).trim() : null,
      facultyAdvisorMobile: student["Mobile No. (FA)"] ? String(student["Mobile No. (FA)"]).trim() : null,

      mobile: student["Mobile Number"] ? String(student["Mobile Number"]).trim() : null,
      gender: student["Gender"] ? String(student["Gender"]).trim() : null,
      campus: student["Campus"] ? String(student["Campus"]).trim() : null,

      dob: student["Date of Birth"] ? parseExcelDate(parseInt(student["Date of Birth"])) : null,
      bloodGroup: student["Blood Group"] ? String(student["Blood Group"]).trim() : null,

      address: student["Communication Address"] ? String(student["Communication Address"]).trim() : null,

      parentName: student["Parent Name"] ? String(student["Parent Name"]).trim() : null,
      parentMobile: student["Parent's Contact Number"] ? String(student["Parent's Contact Number"]).trim() : null,
      parentEmail: student["Parent Email"] ? String(student["Parent Email"]).trim().toLowerCase() : null,

      rawData: student
    });
  });

  return {
    students,
    errors,
    total: data.length,
    valid: students.length,
    invalid: errors.length
  };
};

// Helper: Convert Excel Serial Date to JS Date
const parseExcelDate = (serial) => {
  if (!serial) return null;
  // Excel base date is Dec 30, 1899
  const excelBaseDate = new Date(1899, 11, 30);
  // Add days (serial - 1 for leap year bug in 1900 if serial > 60, but simplified here)
  // Usually serial is number of days since 1900-01-01
  // Simple approximation:
  const date = new Date((serial - 25569) * 86400 * 1000);
  return !isNaN(date) ? date : null;
};

/**
 * Parse teacher JSON (FilteredTeachers.json)
 * Expected structure: Array of teacher assignment objects
 */
const parseTeacherJSON = async (filePath) => {
  const { parseSlots } = require("./slotParser.util");
  const { extractCoFacultyFromRow } = require("./coFacultyParser.util");

  const data = await parseJSONFile(filePath);

  if (!Array.isArray(data)) {
    throw new Error("Teacher data must be an array");
  }

  // Required fields for teacher assignments
  const requiredFields = [
    "Faculty Name",
    "Section",
    "Course Code"
  ];

  const teachers = [];
  const errors = [];
  const warnings = [];

  data.forEach((teacher, index) => {
    const missing = requiredFields.filter(field => !teacher[field]);

    if (missing.length > 0) {
      errors.push({
        row: index + 1,
        error: `Missing required fields: ${missing.join(", ")}`,
        data: teacher
      });
      return;
    }

    // Parse slot information (handles "P29,P30" format)
    let slot1Raw = teacher["Slot 1"] ? String(teacher["Slot 1"]).trim() : null;
    let slot2Raw = teacher["Slot 2"] ? String(teacher["Slot 2"]).trim() : null;

    // Fallback to "Slot" if Slot 1 & 2 are missing
    if (!slot1Raw && !slot2Raw && teacher["Slot"]) {
      slot1Raw = String(teacher["Slot"]).trim();
    }

    const slot1 = slot1Raw ? parseSlots(slot1Raw) : [];
    const slot2 = slot2Raw ? parseSlots(slot2Raw) : [];

    // Parse co-faculty information (handles comma-separated with (Main))
    const coFacultyInfo = extractCoFacultyFromRow(teacher);

    // Add warnings for co-faculty parsing errors
    if (coFacultyInfo.errors.length > 0) {
      warnings.push({
        row: index + 1,
        warnings: coFacultyInfo.errors,
        data: teacher
      });
    }

    // Get venue (check multiple possible field names)
    const venue = teacher["Venue"] || teacher["Venue 1"] || null;

    // Parse Batch (handle "1&2", "1,2" etc.)
    const rawBatch = teacher["Batch"];
    let batchNumbers = [1]; // Default
    
    if (typeof rawBatch === 'number') {
      batchNumbers = [rawBatch];
    } else if (typeof rawBatch === 'string') {
      // Split by common delimiters and extract digits
      const splitMatches = rawBatch.split(/[&,]/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      if (splitMatches.length > 0) {
        batchNumbers = splitMatches;
      }
    }

    // Process each batch as a separate assignment
    batchNumbers.forEach(batchNum => {
      teachers.push({
        facultyName: String(teacher["Faculty Name"]).trim(),
        facultyId: teacher["Faculty ID"] ? parseInt(teacher["Faculty ID"]) : null,
        batch: batchNum,
        section: String(teacher["Section"]).trim(), // Allow any section format
        courseCode: String(teacher["Course Code"]).trim().toUpperCase(),
        courseName: teacher["Course"] ? String(teacher["Course"]).trim() : null,

        // Group 1 (Slot 1) - now arrays of slot codes
        slot1,
        slot1Raw, // Keep original for reference
        coFaculty: coFacultyInfo.coFaculty,

        // Group 2 (Slot 2) - now arrays of slot codes
        slot2,
        slot2Raw, // Keep original for reference
        coFaculty1: coFacultyInfo.coFaculty1,

        // All co-faculty mentioned
        allCoFaculty: coFacultyInfo.allCoFaculty,

        venue: venue ? String(venue).trim() : null,
        rawData: teacher
      });
    });
  });

  return {
    teachers,
    errors,
    warnings,
    total: data.length,
    valid: teachers.length,
    invalid: errors.length
  };
};

/**
 * Parse faculty email mapping JSON (FacultyEmailMapping.json)
 * Expected structure: Array of faculty objects with email
 */
const parseFacultyEmailJSON = async (filePath) => {
  const data = await parseJSONFile(filePath);

  if (!Array.isArray(data)) {
    throw new Error("Faculty email data must be an array");
  }

  const facultyMap = {};
  const errors = [];

  data.forEach((faculty, index) => {
    const facultyName = faculty["Faculty Name"];
    const email = faculty["Email ID"];

    if (!facultyName) {
      errors.push({
        row: index + 1,
        error: "Missing Faculty Name",
        data: faculty
      });
      return;
    }

    if (!email) {
      errors.push({
        row: index + 1,
        error: "Missing Email ID",
        data: faculty
      });
      return;
    }

    const normalizedName = String(facultyName).replace(/\s+/g, ' ').trim().toLowerCase();
    facultyMap[normalizedName] = {
      facultyId: faculty["Faculty ID"] ? parseInt(faculty["Faculty ID"]) : null,
      facultyName: String(facultyName).trim(),
      email: String(email).trim().toLowerCase(),
      mobile: faculty["Mobile No"] ? String(faculty["Mobile No"]).trim() : null,
      designation: faculty["Designation"] ? String(faculty["Designation"]).trim() : null
    };
  });

  return {
    facultyMap,
    errors,
    total: data.length,
    valid: Object.keys(facultyMap).length,
    invalid: errors.length
  };
};

/**
 * Clean up uploaded files
 */
const cleanupFiles = (filePaths) => {
  filePaths.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error.message);
    }
  });
};

/**
 * Validate file existence
 */
const validateFiles = (files) => {
  const missing = [];

  Object.keys(files).forEach(key => {
    if (!files[key] || !fs.existsSync(files[key])) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required files: ${missing.join(", ")}`);
  }

  return true;
};

module.exports = {
  parseJSONFile,
  parseStudentJSON,
  parseTeacherJSON,
  parseFacultyEmailJSON,
  cleanupFiles,
  validateFiles
};