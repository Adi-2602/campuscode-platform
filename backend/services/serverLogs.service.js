const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const readFileAsync = promisify(fs.readFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

// Define log file paths (customize based on your setup)
const LOG_DIRECTORY = process.env.LOG_DIR || path.join(process.cwd(), "logs");
const APP_LOG_FILE = path.join(LOG_DIRECTORY, "app.log");
const ERROR_LOG_FILE = path.join(LOG_DIRECTORY, "error.log");
const ACCESS_LOG_FILE = path.join(LOG_DIRECTORY, "access.log");

/**
 * Get list of all log files
 */
const getLogFiles = async () => {
  try {
    // Check if log directory exists
    if (!fs.existsSync(LOG_DIRECTORY)) {
      return {
        logDirectory: LOG_DIRECTORY,
        files: [],
        message: "Log directory not found. Logs may be disabled or in a different location."
      };
    }

    const files = await readdirAsync(LOG_DIRECTORY);

    // Filter only log files
    const logFiles = files.filter((file) => file.endsWith(".log"));

    // Get file stats
    const fileStats = await Promise.all(
      logFiles.map(async (file) => {
        const filePath = path.join(LOG_DIRECTORY, file);
        const stats = await statAsync(filePath);

        return {
          name: file,
          path: filePath,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(2),
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          lastModified: stats.mtime,
          created: stats.birthtime
        };
      })
    );

    return {
      logDirectory: LOG_DIRECTORY,
      files: fileStats,
      totalFiles: fileStats.length
    };
  } catch (error) {
    throw new Error(`Failed to get log files: ${error.message}`);
  }
};

/**
 * Read log file content
 */
const readLogFile = async (filename, options = {}) => {
  try {
    const { lines = 100, fromEnd = true } = options;

    const filePath = path.join(LOG_DIRECTORY, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Log file '${filename}' not found`);
    }

    // Read file content
    const content = await readFileAsync(filePath, "utf-8");

    // Split into lines
    const allLines = content.split("\n").filter((line) => line.trim() !== "");

    // Get requested lines
    let logLines;
    if (fromEnd) {
      // Get last N lines
      logLines = allLines.slice(-lines);
    } else {
      // Get first N lines
      logLines = allLines.slice(0, lines);
    }

    const stats = await statAsync(filePath);

    return {
      filename,
      lines: logLines,
      totalLines: allLines.length,
      returnedLines: logLines.length,
      fileSize: stats.size,
      fileSizeKB: (stats.size / 1024).toFixed(2),
      lastModified: stats.mtime
    };
  } catch (error) {
    throw new Error(`Failed to read log file: ${error.message}`);
  }
};

/**
 * Search logs for a specific pattern
 */
const searchLogs = async (filename, searchQuery, options = {}) => {
  try {
    const { caseSensitive = false, limit = 100 } = options;

    const filePath = path.join(LOG_DIRECTORY, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Log file '${filename}' not found`);
    }

    // Read file content
    const content = await readFileAsync(filePath, "utf-8");

    // Split into lines
    const allLines = content.split("\n").filter((line) => line.trim() !== "");

    // Search for pattern
    const regex = new RegExp(
      searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      caseSensitive ? "g" : "gi"
    );

    const matchingLines = allLines
      .map((line, index) => ({
        lineNumber: index + 1,
        content: line
      }))
      .filter((line) => regex.test(line.content))
      .slice(0, limit);

    return {
      filename,
      searchQuery,
      caseSensitive,
      matches: matchingLines,
      totalMatches: matchingLines.length,
      totalLines: allLines.length
    };
  } catch (error) {
    throw new Error(`Failed to search logs: ${error.message}`);
  }
};

/**
 * Get application logs (app.log)
 */
const getAppLogs = async (options = {}) => {
  try {
    const { lines = 100 } = options;

    if (!fs.existsSync(APP_LOG_FILE)) {
      return {
        logs: [],
        message: "Application log file not found. Logging may be disabled."
      };
    }

    return await readLogFile("app.log", { lines, fromEnd: true });
  } catch (error) {
    throw new Error(`Failed to get app logs: ${error.message}`);
  }
};

/**
 * Get error logs (error.log)
 */
const getErrorLogs = async (options = {}) => {
  try {
    const { lines = 100 } = options;

    if (!fs.existsSync(ERROR_LOG_FILE)) {
      return {
        logs: [],
        message: "Error log file not found. Error logging may be disabled."
      };
    }

    return await readLogFile("error.log", { lines, fromEnd: true });
  } catch (error) {
    throw new Error(`Failed to get error logs: ${error.message}`);
  }
};

/**
 * Get access logs (access.log)
 */
const getAccessLogs = async (options = {}) => {
  try {
    const { lines = 100 } = options;

    if (!fs.existsSync(ACCESS_LOG_FILE)) {
      return {
        logs: [],
        message: "Access log file not found. Access logging may be disabled."
      };
    }

    return await readLogFile("access.log", { lines, fromEnd: true });
  } catch (error) {
    throw new Error(`Failed to get access logs: ${error.message}`);
  }
};

/**
 * Parse log line (try to extract timestamp, level, message)
 */
const parseLogLine = (line) => {
  // Common log format patterns
  const patterns = [
    // ISO timestamp with level: 2026-01-29T10:30:00.000Z [ERROR] Message
    /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+\[(\w+)\]\s+(.+)$/,
    // Timestamp with level: 2026-01-29 10:30:00 ERROR: Message
    /^(\d{4}-\d{2}-\d{2}\s+[\d:]+)\s+(\w+):\s+(.+)$/,
    // Simple format: [ERROR] Message
    /^\[(\w+)\]\s+(.+)$/
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      if (match.length === 4) {
        return {
          timestamp: match[1],
          level: match[2],
          message: match[3],
          raw: line
        };
      } else if (match.length === 3) {
        return {
          timestamp: null,
          level: match[1],
          message: match[2],
          raw: line
        };
      }
    }
  }

  // If no pattern matches, return raw
  return {
    timestamp: null,
    level: "INFO",
    message: line,
    raw: line
  };
};

/**
 * Get parsed logs with structured data
 */
const getParsedLogs = async (filename, options = {}) => {
  try {
    const { lines = 100 } = options;

    const logData = await readLogFile(filename, { lines, fromEnd: true });

    // Parse each log line
    const parsedLogs = logData.lines.map((line, index) => ({
      lineNumber: logData.totalLines - logData.returnedLines + index + 1,
      ...parseLogLine(line)
    }));

    return {
      filename,
      logs: parsedLogs,
      totalLines: logData.totalLines,
      returnedLines: parsedLogs.length,
      lastModified: logData.lastModified
    };
  } catch (error) {
    throw new Error(`Failed to parse logs: ${error.message}`);
  }
};

/**
 * Get log statistics
 */
const getLogStats = async (filename) => {
  try {
    const filePath = path.join(LOG_DIRECTORY, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Log file '${filename}' not found`);
    }

    const content = await readFileAsync(filePath, "utf-8");
    const lines = content.split("\n").filter((line) => line.trim() !== "");

    // Count log levels
    const levelCounts = {
      ERROR: 0,
      WARN: 0,
      INFO: 0,
      DEBUG: 0,
      OTHER: 0
    };

    lines.forEach((line) => {
      const parsed = parseLogLine(line);
      const level = parsed.level?.toUpperCase();

      if (level in levelCounts) {
        levelCounts[level]++;
      } else {
        levelCounts.OTHER++;
      }
    });

    const stats = await statAsync(filePath);

    return {
      filename,
      totalLines: lines.length,
      fileSize: stats.size,
      fileSizeKB: (stats.size / 1024).toFixed(2),
      fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2),
      levelCounts,
      lastModified: stats.mtime,
      created: stats.birthtime
    };
  } catch (error) {
    throw new Error(`Failed to get log stats: ${error.message}`);
  }
};

/**
 * Clear/truncate log file (admin operation)
 */
const clearLogFile = async (filename) => {
  try {
    const filePath = path.join(LOG_DIRECTORY, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Log file '${filename}' not found`);
    }

    // Get stats before clearing
    const statsBefore = await statAsync(filePath);

    // Truncate file (keep file but remove content)
    fs.writeFileSync(filePath, "");

    return {
      filename,
      message: "Log file cleared successfully",
      previousSize: statsBefore.size,
      previousSizeKB: (statsBefore.size / 1024).toFixed(2),
      clearedAt: new Date()
    };
  } catch (error) {
    throw new Error(`Failed to clear log file: ${error.message}`);
  }
};

module.exports = {
  getLogFiles,
  readLogFile,
  searchLogs,
  getAppLogs,
  getErrorLogs,
  getAccessLogs,
  parseLogLine,
  getParsedLogs,
  getLogStats,
  clearLogFile
};