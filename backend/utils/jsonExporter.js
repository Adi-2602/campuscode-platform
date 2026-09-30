/**
 * JSON Exporter Utility
 * Formats and prepares JSON data for export
 */

/**
 * Format JSON data with pretty printing
 */
const formatJSON = (data, options = {}) => {
  const { indent = 2, sortKeys = false } = options;

  if (sortKeys) {
    data = sortObjectKeys(data);
  }

  return JSON.stringify(data, null, indent);
};

/**
 * Sort object keys recursively
 */
const sortObjectKeys = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  if (obj !== null && typeof obj === "object") {
    const sorted = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = sortObjectKeys(obj[key]);
      });
    return sorted;
  }

  return obj;
};

/**
 * Generate JSON export with metadata
 */
const generateJSON = (data, metadata = {}) => {
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      totalRecords: Array.isArray(data) ? data.length : 1,
      exportType: metadata.type || "data_export",
      filters: metadata.filters || {},
      ...metadata
    },
    data: data
  };

  return exportData;
};

/**
 * Generate JSON file content
 */
const generateJSONFile = (data, metadata = {}) => {
  if (!data) {
    return {
      content: JSON.stringify({ data: [], totalRecords: 0 }, null, 2),
      filename: "export_empty.json",
      totalRecords: 0
    };
  }

  const exportData = generateJSON(data, metadata);
  const content = formatJSON(exportData, { indent: 2 });

  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dataType = metadata.type || "data";
  const filename = `${dataType}_export_${timestamp}.json`;

  return {
    content,
    filename,
    totalRecords: Array.isArray(data) ? data.length : 1,
    exportedAt: new Date(),
    metadata
  };
};

/**
 * Create JSON buffer for download
 */
const createJSONBuffer = (jsonContent) => {
  return Buffer.from(jsonContent, "utf-8");
};

/**
 * Get JSON MIME type
 */
const getJSONMimeType = () => {
  return "application/json; charset=utf-8";
};

/**
 * Minify JSON (remove whitespace)
 */
const minifyJSON = (data) => {
  return JSON.stringify(data);
};

/**
 * Convert JSON to JSONL (JSON Lines format)
 * Each line is a separate JSON object
 */
const jsonToJSONL = (data) => {
  if (!Array.isArray(data)) {
    return JSON.stringify(data);
  }

  return data.map((item) => JSON.stringify(item)).join("\n");
};

/**
 * Filter sensitive fields from JSON export
 */
const filterSensitiveFields = (data, sensitiveFields = []) => {
  const defaultSensitiveFields = [
    "passwordHash",
    "password",
    "token",
    "apiKey",
    "secret"
  ];

  const allSensitiveFields = [
    ...defaultSensitiveFields,
    ...sensitiveFields
  ];

  const filterObject = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(filterObject);
    }

    if (obj !== null && typeof obj === "object") {
      const filtered = {};
      Object.keys(obj).forEach((key) => {
        if (!allSensitiveFields.includes(key)) {
          filtered[key] = filterObject(obj[key]);
        }
      });
      return filtered;
    }

    return obj;
  };

  return filterObject(data);
};

/**
 * Validate JSON structure
 */
const validateJSON = (jsonString) => {
  try {
    JSON.parse(jsonString);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

/**
 * Get JSON statistics
 */
const getJSONStats = (data) => {
  const stats = {
    type: Array.isArray(data) ? "array" : typeof data,
    recordCount: Array.isArray(data) ? data.length : 1,
    sizeInBytes: JSON.stringify(data).length,
    sizeInKB: (JSON.stringify(data).length / 1024).toFixed(2),
    sizeInMB: (JSON.stringify(data).length / (1024 * 1024)).toFixed(2)
  };

  // Get field statistics for array data
  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0];
    if (typeof firstItem === "object") {
      stats.fields = Object.keys(firstItem);
      stats.fieldCount = stats.fields.length;
    }
  }

  return stats;
};

/**
 * Chunk large JSON data for streaming
 */
const chunkJSONData = (data, chunkSize = 1000) => {
  if (!Array.isArray(data)) {
    return [data];
  }

  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }

  return chunks;
};

/**
 * Sanitize JSON for safe export
 * - Remove circular references
 * - Handle undefined values
 * - Convert dates to ISO strings
 */
const sanitizeJSON = (obj, seen = new WeakSet()) => {
  if (obj === null || typeof obj !== "object") {
    // Handle undefined
    if (obj === undefined) {
      return null;
    }
    return obj;
  }

  // Handle dates
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle circular references
  if (seen.has(obj)) {
    return "[Circular Reference]";
  }

  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeJSON(item, seen));
  }

  const sanitized = {};
  Object.keys(obj).forEach((key) => {
    sanitized[key] = sanitizeJSON(obj[key], seen);
  });

  return sanitized;
};

/**
 * Generate JSON schema from data
 */
const generateJSONSchema = (data) => {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return null;
  }

  const sample = Array.isArray(data) ? data[0] : data;

  const getType = (value) => {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    if (value instanceof Date) return "string"; // ISO date string
    return typeof value;
  };

  const buildSchema = (obj) => {
    if (typeof obj !== "object" || obj === null) {
      return { type: getType(obj) };
    }

    if (Array.isArray(obj)) {
      return {
        type: "array",
        items: obj.length > 0 ? buildSchema(obj[0]) : { type: "any" }
      };
    }

    const properties = {};
    Object.keys(obj).forEach((key) => {
      properties[key] = buildSchema(obj[key]);
    });

    return {
      type: "object",
      properties
    };
  };

  return buildSchema(sample);
};

module.exports = {
  formatJSON,
  sortObjectKeys,
  generateJSON,
  generateJSONFile,
  createJSONBuffer,
  getJSONMimeType,
  minifyJSON,
  jsonToJSONL,
  filterSensitiveFields,
  validateJSON,
  getJSONStats,
  chunkJSONData,
  sanitizeJSON,
  generateJSONSchema
};