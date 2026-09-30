/**
 * CSV Generator Utility
 * Converts JSON data to CSV format
 */

/**
 * Convert JSON array to CSV string
 */
const jsonToCSV = (data) => {
  if (!data || data.length === 0) {
    return "";
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV header row
  const csvHeaders = headers.join(",");

  // Create CSV data rows
  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        let value = row[header];

        // Handle null/undefined
        if (value === null || value === undefined) {
          return "";
        }

        // Convert to string
        value = String(value);

        // Escape quotes and wrap in quotes if needed
        if (
          value.includes(",") ||
          value.includes('"') ||
          value.includes("\n")
        ) {
          value = '"' + value.replace(/"/g, '""') + '"';
        }

        return value;
      })
      .join(",");
  });

  // Combine headers and rows
  return [csvHeaders, ...csvRows].join("\n");
};

/**
 * Generate CSV file content with metadata
 */
const generateCSV = (data, metadata = {}) => {
  if (!data || data.length === 0) {
    return {
      content: "",
      filename: "export_empty.csv",
      totalRecords: 0
    };
  }

  // Generate CSV content
  const csvContent = jsonToCSV(data);

  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dataType = metadata.type || "data";
  const filename = `${dataType}_export_${timestamp}.csv`;

  return {
    content: csvContent,
    filename,
    totalRecords: data.length,
    exportedAt: new Date(),
    metadata
  };
};

/**
 * Convert object to CSV-friendly format (flatten nested objects)
 */
const flattenObject = (obj, prefix = "") => {
  const flattened = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (value === null || value === undefined) {
        flattened[prefix + key] = "";
      } else if (typeof value === "object" && !Array.isArray(value)) {
        // Recursively flatten nested objects
        Object.assign(
          flattened,
          flattenObject(value, prefix + key + "_")
        );
      } else if (Array.isArray(value)) {
        // Convert arrays to comma-separated strings
        flattened[prefix + key] = value.join("; ");
      } else {
        flattened[prefix + key] = value;
      }
    }
  }

  return flattened;
};

/**
 * Flatten array of objects before converting to CSV
 */
const flattenDataForCSV = (data) => {
  if (!data || data.length === 0) {
    return [];
  }

  return data.map((item) => flattenObject(item));
};

/**
 * Generate CSV with custom column order
 */
const generateCSVWithColumns = (data, columns) => {
  if (!data || data.length === 0) {
    return "";
  }

  // Create CSV header row with custom columns
  const csvHeaders = columns.map((col) => col.header || col.key).join(",");

  // Create CSV data rows
  const csvRows = data.map((row) => {
    return columns
      .map((col) => {
        let value = row[col.key];

        // Apply formatter if provided
        if (col.formatter && typeof col.formatter === "function") {
          value = col.formatter(value, row);
        }

        // Handle null/undefined
        if (value === null || value === undefined) {
          return "";
        }

        // Convert to string
        value = String(value);

        // Escape quotes and wrap in quotes if needed
        if (
          value.includes(",") ||
          value.includes('"') ||
          value.includes("\n")
        ) {
          value = '"' + value.replace(/"/g, '""') + '"';
        }

        return value;
      })
      .join(",");
  });

  // Combine headers and rows
  return [csvHeaders, ...csvRows].join("\n");
};

/**
 * Create CSV blob for download (Node.js - returns buffer)
 */
const createCSVBuffer = (csvContent) => {
  // Add BOM for UTF-8 to ensure Excel opens it correctly
  const BOM = "\uFEFF";
  return Buffer.from(BOM + csvContent, "utf-8");
};

/**
 * Get CSV MIME type
 */
const getCSVMimeType = () => {
  return "text/csv; charset=utf-8";
};

/**
 * Example column definitions for common exports
 */
const COLUMN_DEFINITIONS = {
  students: [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "rollNo", header: "Roll Number" },
    { key: "status", header: "Status" },
    { key: "enrolledClasses", header: "Enrolled Classes" },
    { key: "totalSubmissions", header: "Total Submissions" },
    {
      key: "createdAt",
      header: "Registered On",
      formatter: (value) => new Date(value).toLocaleString()
    }
  ],
  teachers: [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "status", header: "Status" },
    { key: "isVerified", header: "Verified" },
    { key: "verifiedBy", header: "Verified By" },
    { key: "classesCreated", header: "Classes Created" },
    { key: "examsCreated", header: "Exams Created" },
    { key: "questionsCreated", header: "Questions Created" },
    {
      key: "createdAt",
      header: "Registered On",
      formatter: (value) => new Date(value).toLocaleString()
    }
  ],
  classes: [
    { key: "id", header: "ID" },
    { key: "name", header: "Class Name" },
    { key: "code", header: "Class Code" },
    { key: "teacherName", header: "Teacher Name" },
    { key: "teacherEmail", header: "Teacher Email" },
    { key: "isLocked", header: "Locked" },
    { key: "studentCount", header: "Student Count" },
    { key: "examCount", header: "Exam Count" },
    {
      key: "createdAt",
      header: "Created On",
      formatter: (value) => new Date(value).toLocaleString()
    }
  ],
  exams: [
    { key: "id", header: "ID" },
    { key: "title", header: "Exam Title" },
    { key: "className", header: "Class Name" },
    { key: "teacherName", header: "Teacher Name" },
    { key: "state", header: "State" },
    {
      key: "startTime",
      header: "Start Time",
      formatter: (value) => new Date(value).toLocaleString()
    },
    {
      key: "endTime",
      header: "End Time",
      formatter: (value) => new Date(value).toLocaleString()
    },
    { key: "durationMinutes", header: "Duration (mins)" },
    { key: "totalMarks", header: "Total Marks" },
    { key: "totalSubmissions", header: "Submissions" }
  ],
  submissions: [
    { key: "id", header: "ID" },
    { key: "studentName", header: "Student Name" },
    { key: "studentEmail", header: "Student Email" },
    { key: "examTitle", header: "Exam Title" },
    { key: "questionTitle", header: "Question Title" },
    { key: "languageId", header: "Language ID" },
    { key: "status", header: "Status" },
    { key: "time", header: "Execution Time" },
    { key: "memory", header: "Memory Used" },
    {
      key: "submittedAt",
      header: "Submitted At",
      formatter: (value) => new Date(value).toLocaleString()
    }
  ],
  auditLogs: [
    { key: "id", header: "ID" },
    { key: "actorName", header: "Actor Name" },
    { key: "actorEmail", header: "Actor Email" },
    { key: "actorRole", header: "Actor Role" },
    { key: "action", header: "Action" },
    { key: "permissionUsed", header: "Permission Used" },
    { key: "targetType", header: "Target Type" },
    { key: "success", header: "Success" },
    { key: "errorMessage", header: "Error Message" },
    { key: "ipAddress", header: "IP Address" },
    {
      key: "timestamp",
      header: "Timestamp",
      formatter: (value) => new Date(value).toLocaleString()
    }
  ],
  results: [
    { key: "id", header: "ID" },
    { key: "studentName", header: "Student Name" },
    { key: "studentEmail", header: "Student Email" },
    { key: "studentRollNo", header: "Roll Number" },
    { key: "examTitle", header: "Exam Title" },
    { key: "totalMarks", header: "Total Marks" },
    { key: "marksObtained", header: "Marks Obtained" },
    { key: "percentage", header: "Percentage" },
    { key: "status", header: "Status" },
    { key: "published", header: "Published" },
    {
      key: "publishedAt",
      header: "Published At",
      formatter: (value) =>
        value !== "N/A" ? new Date(value).toLocaleString() : "N/A"
    }
  ]
};

module.exports = {
  jsonToCSV,
  generateCSV,
  flattenObject,
  flattenDataForCSV,
  generateCSVWithColumns,
  createCSVBuffer,
  getCSVMimeType,
  COLUMN_DEFINITIONS
};