const { parseStudentJSON } = require("../utils/jsonParser.util");
const { batchCreateStudentCredentials } = require("./credentialGeneration.service");

/**
 * Process student data from uploaded JSON file
 */
const processStudentData = async (filePath, uploadId) => {
  // Parse the JSON file
  const parseResult = await parseStudentJSON(filePath);

  if (parseResult.errors.length > 0) {
    console.warn(`Found ${parseResult.errors.length} invalid student records`);
  }

  if (parseResult.students.length === 0) {
    throw new Error("No valid student data found in the uploaded file");
  }

  // Create student accounts with credentials
  const credentialResults = await batchCreateStudentCredentials(
    parseResult.students,
    uploadId
  );

  return {
    total: parseResult.total,
    valid: parseResult.valid,
    invalid: parseResult.invalid,
    parseErrors: parseResult.errors,
    studentsCreated: credentialResults.created.length,
    studentsUpdated: credentialResults.updated.length,
    credentialErrors: credentialResults.errors.length,
    students: credentialResults.created, // Students with passwords
    updatedStudents: credentialResults.updated,
    errors: [...parseResult.errors, ...credentialResults.errors]
  };
};

/**
 * Extract unique batch-section-group combinations from student data
 */
const extractStudentCombinations = (students) => {
  const combinations = new Set();

  students.forEach(student => {
    const key = `${student.batch}-${student.section}-${student.group}`;
    combinations.add(key);
  });

  return Array.from(combinations).map(key => {
    const [batch, section, group] = key.split("-");
    return {
      batch: parseInt(batch),
      section,
      group: parseInt(group)
    };
  });
};

/**
 * Group students by batch-section-group
 */
const groupStudentsByBatchSectionGroup = (students) => {
  const groups = {};

  students.forEach(student => {
    const key = `${student.batch}-${student.section}-${student.group}`;

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(student);
  });

  return groups;
};

/**
 * Validate student data against templates
 */
const validateStudentData = (students) => {
  const errors = [];
  const warnings = [];

  students.forEach((student, index) => {
    // Check required fields
    if (!student.registrationNumber) {
      errors.push({
        row: index + 1,
        field: "Registration Number",
        error: "Missing registration number"
      });
    }

    if (!student.studentName) {
      errors.push({
        row: index + 1,
        field: "Student Name",
        error: "Missing student name"
      });
    }

    // Validate batch
    if (![1, 2].includes(student.batch)) {
      errors.push({
        row: index + 1,
        field: "Batch",
        error: `Invalid batch: ${student.batch}. Must be 1 or 2`
      });
    }

    // Validate group
    if (student.group < 1 || student.group > 10) {
      errors.push({
        row: index + 1,
        field: "Group",
        error: `Invalid group: ${student.group}. Must be betweeen 1 and 10`
      });
    }

    // Validate section format (letter + number)
    if (!/^[A-Z][0-9]$/.test(student.section)) {
      warnings.push({
        row: index + 1,
        field: "Section",
        warning: `Unusual section format: ${student.section}. Expected format: A1, B2, etc.`
      });
    }

    // Check for missing email
    if (!student.email) {
      warnings.push({
        row: index + 1,
        field: "Email",
        warning: "Missing email - will be auto-generated"
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
 * Get student statistics
 */
const getStudentStatistics = (students) => {
  const stats = {
    total: students.length,
    byBatch: {},
    bySection: {},
    byGroup: {},
    bySemester: {}
  };

  students.forEach(student => {
    // By batch
    stats.byBatch[student.batch] = (stats.byBatch[student.batch] || 0) + 1;

    // By section
    stats.bySection[student.section] = (stats.bySection[student.section] || 0) + 1;

    // By group
    stats.byGroup[student.group] = (stats.byGroup[student.group] || 0) + 1;

    // By semester
    stats.bySemester[student.semester] = (stats.bySemester[student.semester] || 0) + 1;
  });

  return stats;
};

module.exports = {
  processStudentData,
  extractStudentCombinations,
  groupStudentsByBatchSectionGroup,
  validateStudentData,
  getStudentStatistics
};