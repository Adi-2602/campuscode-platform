const {
  restartApplication,
  clearCache,
  clearDatabaseConnections,
  runGarbageCollection,
  getServiceStatus,
  healthCheckAndRecover,
  getPM2ProcessList,
  restartPM2Process
} = require("../services/serviceControl.service");

const { manualLog } = require("../middlewares/auditLog.middleware");

/**
 * Restart the application
 * POST /admin/monitoring/services/restart
 * Permission: RESTART_SERVICES
 */
const restartApplicationHandler = async (req, res) => {
  try {
    const result = await restartApplication();

    await manualLog({
      user: req.user,
      req,
      action: "restart_application",
      permissionUsed: "RESTART_SERVICES",
      targetType: "system",
      metadata: {
        method: result.method,
        success: result.success
      },
      success: result.success
    });

    res.json(result);
  } catch (error) {
    await manualLog({
      user: req.user,
      req,
      action: "restart_application_failed",
      permissionUsed: "RESTART_SERVICES",
      targetType: "system",
      success: false,
      errorMessage: error.message
    });

    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Clear application cache
 * POST /admin/monitoring/services/cache/clear
 * Permission: RESTART_SERVICES
 */
const clearCacheHandler = async (req, res) => {
  try {
    const result = await clearCache();

    await manualLog({
      user: req.user,
      req,
      action: "clear_cache",
      permissionUsed: "RESTART_SERVICES",
      targetType: "system",
      metadata: result.details,
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
 * Clear database connections
 * POST /admin/monitoring/services/database/reconnect
 * Permission: RESTART_SERVICES
 */
const clearDatabaseConnectionsHandler = async (req, res) => {
  try {
    const result = await clearDatabaseConnections();

    await manualLog({
      user: req.user,
      req,
      action: "clear_database_connections",
      permissionUsed: "RESTART_SERVICES",
      targetType: "system",
      metadata: { success: result.success },
      success: result.success
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Run garbage collection
 * POST /admin/monitoring/services/gc
 * Permission: RESTART_SERVICES
 */
const runGarbageCollectionHandler = async (req, res) => {
  try {
    const result = await runGarbageCollection();

    await manualLog({
      user: req.user,
      req,
      action: "run_garbage_collection",
      permissionUsed: "RESTART_SERVICES",
      targetType: "system",
      metadata: {
        success: result.success,
        freed: result.freed
      },
      success: result.success
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get service status
 * GET /admin/monitoring/services/status
 * Permission: RESTART_SERVICES
 */
const getServiceStatusHandler = async (req, res) => {
  try {
    const status = await getServiceStatus();

    await manualLog({
      user: req.user,
      req,
      action: "view_service_status",
      permissionUsed: "RESTART_SERVICES",
      targetType: "system",
      metadata: {
        uptime: status.application.uptimeFormatted,
        databaseConnected: status.database.connected
      },
      success: true
    });

    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Health check and auto-recovery
 * POST /admin/monitoring/services/health-check
 * Permission: RESTART_SERVICES
 */
const healthCheckAndRecoverHandler = async (req, res) => {
  try {
    const result = await healthCheckAndRecover();

    await manualLog({
      user: req.user,
      req,
      action: "health_check_and_recover",
      permissionUsed: "RESTART_SERVICES",
      targetType: "system",
      metadata: {
        healthy: result.healthy,
        issuesFound: result.issues.length,
        actionsPerformed: result.actionsPerformed.length
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
 * Get PM2 process list
 * GET /admin/monitoring/services/pm2/processes
 * Permission: RESTART_SERVICES
 */
const getPM2ProcessListHandler = async (req, res) => {
  try {
    const result = await getPM2ProcessList();

    await manualLog({
      user: req.user,
      req,
      action: "view_pm2_processes",
      permissionUsed: "RESTART_SERVICES",
      targetType: "system",
      metadata: {
        available: result.available,
        processCount: result.processes?.length || 0
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
 * Restart PM2 process
 * POST /admin/monitoring/services/pm2/restart/:processName
 * Permission: RESTART_SERVICES
 */
const restartPM2ProcessHandler = async (req, res) => {
  try {
    const { processName } = req.params;

    if (!processName) {
      return res.status(400).json({
        error: "Process name is required"
      });
    }

    const result = await restartPM2Process(processName);

    await manualLog({
      user: req.user,
      req,
      action: "restart_pm2_process",
      permissionUsed: "RESTART_SERVICES",
      targetType: "system",
      metadata: {
        processName,
        success: result.success
      },
      success: result.success
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Perform all maintenance tasks
 * POST /admin/monitoring/services/maintenance
 * Permission: RESTART_SERVICES
 */
const performMaintenanceHandler = async (req, res) => {
  try {
    const results = {
      timestamp: new Date(),
      tasks: []
    };

    // Clear cache
    try {
      const cacheResult = await clearCache();
      results.tasks.push({
        task: "clear_cache",
        success: true,
        result: cacheResult
      });
    } catch (error) {
      results.tasks.push({
        task: "clear_cache",
        success: false,
        error: error.message
      });
    }

    // Run garbage collection if available
    try {
      const gcResult = await runGarbageCollection();
      results.tasks.push({
        task: "garbage_collection",
        success: gcResult.success,
        result: gcResult
      });
    } catch (error) {
      results.tasks.push({
        task: "garbage_collection",
        success: false,
        error: error.message
      });
    }

    // Health check
    try {
      const healthResult = await healthCheckAndRecover();
      results.tasks.push({
        task: "health_check",
        success: healthResult.healthy,
        result: healthResult
      });
    } catch (error) {
      results.tasks.push({
        task: "health_check",
        success: false,
        error: error.message
      });
    }

    const allSuccess = results.tasks.every((task) => task.success);

    await manualLog({
      user: req.user,
      req,
      action: "perform_maintenance",
      permissionUsed: "RESTART_SERVICES",
      targetType: "system",
      metadata: {
        tasksCompleted: results.tasks.length,
        allSuccess
      },
      success: allSuccess
    });

    res.json({
      message: "Maintenance tasks completed",
      ...results
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  restartApplicationHandler,
  clearCacheHandler,
  clearDatabaseConnectionsHandler,
  runGarbageCollectionHandler,
  getServiceStatusHandler,
  healthCheckAndRecoverHandler,
  getPM2ProcessListHandler,
  restartPM2ProcessHandler,
  performMaintenanceHandler
};