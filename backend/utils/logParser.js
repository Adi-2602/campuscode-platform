/**
 * Log Parser Utility
 * Parse and analyze log files in various formats
 */

/**
 * Parse log line with multiple format support
 */
const parseLogLine = (line) => {
  if (!line || line.trim() === "") {
    return null;
  }

  // Try different log formats
  const parsers = [
    parseISOFormat,
    parseStandardFormat,
    parseSimpleFormat,
    parseJSONFormat,
    parseNginxFormat,
    parseApacheFormat
  ];

  for (const parser of parsers) {
    const result = parser(line);
    if (result) {
      return result;
    }
  }

  // If no format matched, return raw
  return {
    timestamp: null,
    level: "UNKNOWN",
    message: line,
    raw: line,
    format: "unknown"
  };
};

/**
 * ISO timestamp format: 2026-01-29T10:30:00.000Z [ERROR] Message
 */
const parseISOFormat = (line) => {
  const pattern = /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+\[(\w+)\]\s+(.+)$/;
  const match = line.match(pattern);

  if (match) {
    return {
      timestamp: match[1],
      level: match[2],
      message: match[3],
      raw: line,
      format: "iso"
    };
  }
  return null;
};

/**
 * Standard format: 2026-01-29 10:30:00 ERROR: Message
 */
const parseStandardFormat = (line) => {
  const pattern = /^(\d{4}-\d{2}-\d{2}\s+[\d:]+)\s+(\w+):\s+(.+)$/;
  const match = line.match(pattern);

  if (match) {
    return {
      timestamp: match[1],
      level: match[2],
      message: match[3],
      raw: line,
      format: "standard"
    };
  }
  return null;
};

/**
 * Simple format: [ERROR] Message
 */
const parseSimpleFormat = (line) => {
  const pattern = /^\[(\w+)\]\s+(.+)$/;
  const match = line.match(pattern);

  if (match) {
    return {
      timestamp: null,
      level: match[1],
      message: match[2],
      raw: line,
      format: "simple"
    };
  }
  return null;
};

/**
 * JSON format: {"timestamp":"...","level":"ERROR","message":"..."}
 */
const parseJSONFormat = (line) => {
  try {
    const json = JSON.parse(line);

    if (json.level || json.message) {
      return {
        timestamp: json.timestamp || json.time || null,
        level: json.level || json.severity || "INFO",
        message: json.message || json.msg || line,
        raw: line,
        format: "json",
        metadata: json
      };
    }
  } catch (error) {
    // Not JSON
  }
  return null;
};

/**
 * Nginx format: 127.0.0.1 - - [29/Jan/2026:10:30:00 +0000] "GET / HTTP/1.1" 200
 */
const parseNginxFormat = (line) => {
  const pattern = /^(\S+)\s+-\s+-\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)\s+(\S+)"\s+(\d+)/;
  const match = line.match(pattern);

  if (match) {
    return {
      timestamp: match[2],
      level: "INFO",
      message: `${match[3]} ${match[4]} - ${match[6]}`,
      raw: line,
      format: "nginx",
      ip: match[1],
      method: match[3],
      path: match[4],
      status: match[6]
    };
  }
  return null;
};

/**
 * Apache format: 127.0.0.1 - - [29/Jan/2026:10:30:00 +0000] "GET /index.html HTTP/1.1" 200 2326
 */
const parseApacheFormat = (line) => {
  const pattern = /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"([^"]+)"\s+(\d+)\s+(\d+)/;
  const match = line.match(pattern);

  if (match) {
    return {
      timestamp: match[2],
      level: "INFO",
      message: `${match[3]} - ${match[4]}`,
      raw: line,
      format: "apache",
      ip: match[1],
      request: match[3],
      status: match[4],
      size: match[5]
    };
  }
  return null;
};

/**
 * Parse multiple log lines
 */
const parseLogLines = (lines) => {
  return lines
    .map((line) => parseLogLine(line))
    .filter((parsed) => parsed !== null);
};

/**
 * Filter logs by level
 */
const filterByLevel = (parsedLogs, level) => {
  return parsedLogs.filter(
    (log) => log.level.toUpperCase() === level.toUpperCase()
  );
};

/**
 * Filter logs by date range
 */
const filterByDateRange = (parsedLogs, startDate, endDate) => {
  return parsedLogs.filter((log) => {
    if (!log.timestamp) return false;

    const logDate = new Date(log.timestamp);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && logDate < start) return false;
    if (end && logDate > end) return false;

    return true;
  });
};

/**
 * Search logs by keyword
 */
const searchLogs = (parsedLogs, keyword, caseSensitive = false) => {
  const regex = new RegExp(
    keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    caseSensitive ? "g" : "gi"
  );

  return parsedLogs.filter((log) => regex.test(log.message));
};

/**
 * Get log statistics
 */
const getLogStats = (parsedLogs) => {
  const stats = {
    total: parsedLogs.length,
    byLevel: {
      ERROR: 0,
      WARN: 0,
      INFO: 0,
      DEBUG: 0,
      UNKNOWN: 0,
      OTHER: 0
    },
    byFormat: {},
    dateRange: {
      earliest: null,
      latest: null
    }
  };

  parsedLogs.forEach((log) => {
    // Count by level
    const level = log.level?.toUpperCase();
    if (level in stats.byLevel) {
      stats.byLevel[level]++;
    } else {
      stats.byLevel.OTHER++;
    }

    // Count by format
    if (log.format) {
      stats.byFormat[log.format] = (stats.byFormat[log.format] || 0) + 1;
    }

    // Track date range
    if (log.timestamp) {
      const logDate = new Date(log.timestamp);
      if (!stats.dateRange.earliest || logDate < stats.dateRange.earliest) {
        stats.dateRange.earliest = logDate;
      }
      if (!stats.dateRange.latest || logDate > stats.dateRange.latest) {
        stats.dateRange.latest = logDate;
      }
    }
  });

  return stats;
};

/**
 * Group logs by time interval
 */
const groupByTimeInterval = (parsedLogs, interval = "hour") => {
  const groups = {};

  parsedLogs.forEach((log) => {
    if (!log.timestamp) return;

    const date = new Date(log.timestamp);
    let key;

    switch (interval) {
      case "minute":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
        break;
      case "hour":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:00`;
        break;
      case "day":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        break;
      case "month":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
      default:
        key = date.toISOString();
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(log);
  });

  return groups;
};

/**
 * Detect error patterns
 */
const detectErrorPatterns = (parsedLogs) => {
  const errorLogs = filterByLevel(parsedLogs, "ERROR");
  const patterns = {};

  errorLogs.forEach((log) => {
    // Extract error type/pattern (first word after ERROR)
    const words = log.message.split(/\s+/);
    const errorType = words[0] || "Unknown";

    if (!patterns[errorType]) {
      patterns[errorType] = {
        count: 0,
        examples: []
      };
    }

    patterns[errorType].count++;
    if (patterns[errorType].examples.length < 3) {
      patterns[errorType].examples.push(log.message);
    }
  });

  return Object.entries(patterns)
    .map(([type, data]) => ({ type, ...data }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Extract IP addresses from logs
 */
const extractIPAddresses = (parsedLogs) => {
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const ips = new Set();

  parsedLogs.forEach((log) => {
    const matches = log.raw.match(ipRegex);
    if (matches) {
      matches.forEach((ip) => ips.add(ip));
    }
  });

  return Array.from(ips);
};

/**
 * Get log level severity
 */
const getLevelSeverity = (level) => {
  const severityMap = {
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    WARNING: 3,
    ERROR: 4,
    FATAL: 5,
    CRITICAL: 5
  };

  return severityMap[level?.toUpperCase()] || 0;
};

/**
 * Sort logs by severity
 */
const sortBySeverity = (parsedLogs) => {
  return [...parsedLogs].sort((a, b) => {
    return getLevelSeverity(b.level) - getLevelSeverity(a.level);
  });
};

module.exports = {
  parseLogLine,
  parseLogLines,
  filterByLevel,
  filterByDateRange,
  searchLogs,
  getLogStats,
  groupByTimeInterval,
  detectErrorPatterns,
  extractIPAddresses,
  getLevelSeverity,
  sortBySeverity,
  // Format-specific parsers
  parseISOFormat,
  parseStandardFormat,
  parseSimpleFormat,
  parseJSONFormat,
  parseNginxFormat,
  parseApacheFormat
};