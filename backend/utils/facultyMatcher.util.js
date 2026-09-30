/**
 * Fuzzy match faculty names (handles slight variations)
 */
const fuzzyMatchFacultyName = (name1, name2) => {
  // Normalize names
  const normalize = (name) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/\./g, "") // Remove periods
      .trim();
  };

  const normalized1 = normalize(name1);
  const normalized2 = normalize(name2);

  // Exact match after normalization
  if (normalized1 === normalized2) {
    return true;
  }

  // Check if one name contains the other (for partial matches)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return true;
  }

  return false;
};

/**
 * Match faculty name to email mapping
 */
const matchFacultyToEmail = (facultyName, facultyEmailMap) => {
  if (!facultyName) return null;

  // Normalize lookup key to match the normalized keys built in parseFacultyEmailJSON
  const normalizedKey = String(facultyName)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  // Try exact match first
  if (facultyEmailMap[normalizedKey]) {
    return facultyEmailMap[normalizedKey];
  }

  // No match found 
  return null;
};

/**
 * Extract unique faculty names from teacher data
 */
const extractUniqueFaculty = (teacherData) => {
  const facultySet = new Set();

  teacherData.forEach(teacher => {
    // Add main faculty
    if (teacher.facultyName) {
      facultySet.add(teacher.facultyName);
    }

    // Add co-faculty for Group 1
    if (teacher.coFaculty && teacher.coFaculty.trim() !== "") {
      facultySet.add(teacher.coFaculty);
    }

    // Add co-faculty for Group 2
    if (teacher.coFaculty1 && teacher.coFaculty1.trim() !== "") {
      facultySet.add(teacher.coFaculty1);
    }
  });

  return Array.from(facultySet);
};

/**
 * Match all faculty to emails and identify missing
 */
const matchAllFaculty = (teacherData, facultyEmailMap) => {
  const uniqueFaculty = extractUniqueFaculty(teacherData);
  
  const matched = [];
  const missing = [];

  uniqueFaculty.forEach(facultyName => {
    const facultyInfo = matchFacultyToEmail(facultyName, facultyEmailMap);

    if (facultyInfo) {
      matched.push({
        facultyName,
        ...facultyInfo
      });
    } else {
      missing.push({
        facultyName,
        email: null,
        status: "MISSING_EMAIL"
      });
    }
  });

  return {
    matched,
    missing,
    totalUnique: uniqueFaculty.length,
    matchedCount: matched.length,
    missingCount: missing.length,
    matchRate: ((matched.length / uniqueFaculty.length) * 100).toFixed(2)
  };
};

/**
 * Generate placeholder email for missing faculty
 */
const generatePlaceholderEmail = (facultyName) => {
  const normalized = facultyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 20);
  
  const timestamp = Date.now();
  
  return `${normalized}.${timestamp}@placeholder.srmist.edu.in`;
};

/**
 * Create placeholder faculty info
 */
const createPlaceholderFaculty = (facultyName) => {
  return {
    facultyId: null,
    facultyName,
    email: generatePlaceholderEmail(facultyName),
    mobile: null,
    designation: null,
    isPlaceholder: true,
    needsEmailUpdate: true
  };
};

module.exports = {
  fuzzyMatchFacultyName,
  matchFacultyToEmail,
  extractUniqueFaculty,
  matchAllFaculty,
  generatePlaceholderEmail,
  createPlaceholderFaculty
};