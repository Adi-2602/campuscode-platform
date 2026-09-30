const {
  getLogFiles,
  readLogFile,
  searchLogs,
  getAppLogs,
  getErrorLogs,
  getAccessLogs,
  getParsedLogs,
  getLogStats,
  clearLogFile
} = require("../services/serverLogs.service");

const { manualLog } = require("../middlewares/auditLog.middleware");

/**
 * Get list of all log files
 * GET /admin/monitoring/logs/files
 * Permission: VIEW_SERVER_LOGS
 */
const getLogFilesHandler = async (req, res) => {
  try {
    const result = await getLogFiles();

    await manualLog({
      user: req.user,
      req,
      action: "view_log_files",
      permissionUsed: "VIEW_SERVER_LOGS",
      targetType: "system",
      metadata: {
        totalFiles: result.totalFiles || 0
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Read a specific log file
 * GET /admin/monitoring/logs/files/:filename
 * Permission: VIEW_SERVER_LOGS
 */
const readLogFileHandler = async (req, res) => {
  try {
    const { filename } = req.params;
    const { lines, fromEnd } = req.query;

    const options = {
      lines: parseInt(lines) || 100,
      fromEnd: fromEnd !== "false"
    };

    const result = await readLogFile(filename, options);

    await manualLog({
      user: req.user,
      req,
      action: "read_log_file",
      permissionUsed: "VIEW_SERVER_LOGS",
      targetType: "system",
      metadata: {
        filename,
        linesRead: result.returnedLines
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Search logs for a pattern
 * GET /admin/monitoring/logs/search
 * Permission: VIEW_SERVER_LOGS
 */
const searchLogsHandler = async (req, res) => {
  try {
    const { filename, query, caseSensitive, limit } = req.query;

    if (!filename || !query) {
      return res.status(400).json({
        error: "filename and query parameters are required"
      });
    }

    const options = {
      caseSensitive: caseSensitive === "true",
      limit: parseInt(limit) || 100
    };

    const result = await searchLogs(filename, query, options);

    await manualLog({
      user: req.user,
      req,
      action: "search_logs",
      permissionUsed: "VIEW_SERVER_LOGS",
      targetType: "system",
      metadata: {
        filename,
        searchQuery: query,
        matchesFound: result.totalMatches
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Get application logs
 * GET /admin/monitoring/logs/app
 * Permission: VIEW_SERVER_LOGS
 */
const getAppLogsHandler = async (req, res) => {
  try {
    const { lines } = req.query;

    const options = {
      lines: parseInt(lines) || 100
    };

    const result = await getAppLogs(options);

    await manualLog({
      user: req.user,
      req,
      action: "view_app_logs",
      permissionUsed: "VIEW_SERVER_LOGS",
      targetType: "system",
      metadata: {
        linesRead: result.returnedLines || 0
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get error logs
 * GET /admin/monitoring/logs/error
 * Permission: VIEW_SERVER_LOGS
 */
const getErrorLogsHandler = async (req, res) => {
  try {
    const { lines } = req.query;

    const options = {
      lines: parseInt(lines) || 100
    };

    const result = await getErrorLogs(options);

    await manualLog({
      user: req.user,
      req,
      action: "view_error_logs",
      permissionUsed: "VIEW_SERVER_LOGS",
      targetType: "system",
      metadata: {
        linesRead: result.returnedLines || 0
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get access logs
 * GET /admin/monitoring/logs/access
 * Permission: VIEW_SERVER_LOGS
 */
const getAccessLogsHandler = async (req, res) => {
  try {
    const { lines } = req.query;

    const options = {
      lines: parseInt(lines) || 100
    };

    const result = await getAccessLogs(options);

    await manualLog({
      user: req.user,
      req,
      action: "view_access_logs",
      permissionUsed: "VIEW_SERVER_LOGS",
      targetType: "system",
      metadata: {
        linesRead: result.returnedLines || 0
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get parsed logs with structured data
 * GET /admin/monitoring/logs/parsed/:filename
 * Permission: VIEW_SERVER_LOGS
 */
const getParsedLogsHandler = async (req, res) => {
  try {
    const { filename } = req.params;
    const { lines } = req.query;

    const options = {
      lines: parseInt(lines) || 100
    };

    const result = await getParsedLogs(filename, options);

    await manualLog({
      user: req.user,
      req,
      action: "view_parsed_logs",
      permissionUsed: "VIEW_SERVER_LOGS",
      targetType: "system",
      metadata: {
        filename,
        linesRead: result.returnedLines
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Get log file statistics
 * GET /admin/monitoring/logs/stats/:filename
 * Permission: VIEW_SERVER_LOGS
 */
const getLogStatsHandler = async (req, res) => {
  try {
    const { filename } = req.params;

    const result = await getLogStats(filename);

    await manualLog({
      user: req.user,
      req,
      action: "view_log_stats",
      permissionUsed: "VIEW_SERVER_LOGS",
      targetType: "system",
      metadata: {
        filename,
        totalLines: result.totalLines
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Clear/truncate a log file
 * DELETE /admin/monitoring/logs/files/:filename
 * Permission: VIEW_SERVER_LOGS (Note: This is a sensitive operation)
 */
const clearLogFileHandler = async (req, res) => {
  try {
    const { filename } = req.params;

    // Additional safety check - only allow clearing log files
    if (!filename.endsWith(".log")) {
      return res.status(400).json({
        error: "Can only clear .log files"
      });
    }

    const result = await clearLogFile(filename);

    await manualLog({
      user: req.user,
      req,
      action: "clear_log_file",
      permissionUsed: "VIEW_SERVER_LOGS",
      targetType: "system",
      metadata: {
        filename,
        previousSize: result.previousSizeKB + " KB"
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

module.exports = {
  getLogFilesHandler,
  readLogFileHandler,
  searchLogsHandler,
  getAppLogsHandler,
  getErrorLogsHandler,
  getAccessLogsHandler,
  getParsedLogsHandler,
  getLogStatsHandler,
  clearLogFileHandler
};