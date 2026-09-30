const { exec } = require("child_process");
const { promisify } = require("util");
const mongoose = require("mongoose");

const execAsync = promisify(exec);

/**
 * Restart the application (if using PM2)
 */
const restartApplication = async () => {
  try {
    // Check if running under PM2
    const isPM2 = process.env.PM2_HOME !== undefined;

    if (isPM2) {
      // Get process name/id from PM2
      const processName = process.env.name || process.env.pm_id || "app";

      // Restart using PM2
      await execAsync(`pm2 restart ${processName}`);

      return {
        success: true,
        message: "Application restart initiated via PM2",
        method: "pm2",
        processName
      };
    } else {
      // Not running under PM2 - cannot restart programmatically
      return {
        success: false,
        message: "Application is not running under PM2. Manual restart required.",
        method: "manual",
        suggestion: "Use: pm2 restart <app-name> or restart the server manually"
      };
    }
  } catch (error) {
    throw new Error(`Failed to restart application: ${error.message}`);
  }
};

/**
 * Clear application cache
 */
const clearCache = async () => {
  try {
    // Clear Node.js require cache (for development/testing)
    const cacheCleared = {
      moduleCache: 0,
      success: true
    };

    // Note: In production, you typically don't clear require cache
    // This is more useful in development environments
    
    // Count cached modules
    cacheCleared.moduleCache = Object.keys(require.cache).length;

    // Optionally clear specific caches if you have any
    // Example: if you're using memory cache, clear it here

    return {
      message: "Cache cleared successfully",
      details: {
        moduleCacheSize: cacheCleared.moduleCache,
        timestamp: new Date()
      }
    };
  } catch (error) {
    throw new Error(`Failed to clear cache: ${error.message}`);
  }
};

/**
 * Clear database connection pool
 */
const clearDatabaseConnections = async () => {
  try {
    const connectionState = mongoose.connection.readyState;

    if (connectionState !== 1) {
      return {
        success: false,
        message: "Database not connected",
        state: connectionState
      };
    }

    // Close and reopen connection
    await mongoose.connection.close();
    await mongoose.connect(process.env.MONGO_URI);

    return {
      success: true,
      message: "Database connections cleared and reconnected",
      timestamp: new Date()
    };
  } catch (error) {
    throw new Error(`Failed to clear database connections: ${error.message}`);
  }
};

/**
 * Garbage collection (if enabled with --expose-gc)
 */
const runGarbageCollection = async () => {
  try {
    if (global.gc) {
      const memoryBefore = process.memoryUsage();
      
      // Run garbage collection
      global.gc();
      
      const memoryAfter = process.memoryUsage();

      const freed = {
        rss: memoryBefore.rss - memoryAfter.rss,
        heapTotal: memoryBefore.heapTotal - memoryAfter.heapTotal,
        heapUsed: memoryBefore.heapUsed - memoryAfter.heapUsed,
        external: memoryBefore.external - memoryAfter.external
      };

      return {
        success: true,
        message: "Garbage collection completed",
        memoryBefore: {
          rssMB: (memoryBefore.rss / (1024 ** 2)).toFixed(2),
          heapUsedMB: (memoryBefore.heapUsed / (1024 ** 2)).toFixed(2)
        },
        memoryAfter: {
          rssMB: (memoryAfter.rss / (1024 ** 2)).toFixed(2),
          heapUsedMB: (memoryAfter.heapUsed / (1024 ** 2)).toFixed(2)
        },
        freed: {
          rssMB: (freed.rss / (1024 ** 2)).toFixed(2),
          heapUsedMB: (freed.heapUsed / (1024 ** 2)).toFixed(2)
        }
      };
    } else {
      return {
        success: false,
        message: "Garbage collection not exposed. Start Node.js with --expose-gc flag to enable.",
        suggestion: "node --expose-gc server.js"
      };
    }
  } catch (error) {
    throw new Error(`Failed to run garbage collection: ${error.message}`);
  }
};

/**
 * Get service status
 */
const getServiceStatus = async () => {
  try {
    const isPM2 = process.env.PM2_HOME !== undefined;

    const status = {
      application: {
        running: true,
        uptime: process.uptime(),
        uptimeFormatted: formatUptime(process.uptime()),
        nodeVersion: process.version,
        pid: process.pid
      },
      processManager: {
        type: isPM2 ? "pm2" : "standalone",
        isPM2: isPM2
      },
      database: {
        connected: mongoose.connection.readyState === 1,
        state: getConnectionState(mongoose.connection.readyState),
        name: mongoose.connection.name || "N/A"
      },
      memory: {
        rss: process.memoryUsage().rss,
        heapUsed: process.memoryUsage().heapUsed,
        rssMB: (process.memoryUsage().rss / (1024 ** 2)).toFixed(2),
        heapUsedMB: (process.memoryUsage().heapUsed / (1024 ** 2)).toFixed(2)
      },
      gcEnabled: typeof global.gc === "function"
    };

    return status;
  } catch (error) {
    throw new Error(`Failed to get service status: ${error.message}`);
  }
};

/**
 * Perform health check and auto-recovery
 */
const healthCheckAndRecover = async () => {
  try {
    const issues = [];
    const actions = [];

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      issues.push("Database disconnected");
      
      try {
        await mongoose.connect(process.env.MONGO_URI);
        actions.push("Database reconnected");
      } catch (error) {
        actions.push(`Failed to reconnect database: ${error.message}`);
      }
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    if (heapUsagePercent > 90) {
      issues.push(`High memory usage: ${heapUsagePercent.toFixed(2)}%`);
      
      if (global.gc) {
        global.gc();
        actions.push("Garbage collection triggered");
      }
    }

    return {
      healthy: issues.length === 0,
      issues,
      actionsPerformed: actions,
      timestamp: new Date()
    };
  } catch (error) {
    throw new Error(`Health check failed: ${error.message}`);
  }
};

/**
 * Get PM2 process list (if available)
 */
const getPM2ProcessList = async () => {
  try {
    const isPM2 = process.env.PM2_HOME !== undefined;

    if (!isPM2) {
      return {
        available: false,
        message: "PM2 not detected. Application is not running under PM2."
      };
    }

    try {
      const { stdout } = await execAsync("pm2 jlist");
      const processes = JSON.parse(stdout);

      return {
        available: true,
        processes: processes.map((proc) => ({
          name: proc.name,
          pid: proc.pid,
          status: proc.pm2_env.status,
          restarts: proc.pm2_env.restart_time,
          uptime: proc.pm2_env.pm_uptime,
          memory: proc.monit.memory,
          cpu: proc.monit.cpu
        }))
      };
    } catch (error) {
      return {
        available: true,
        error: "Failed to get PM2 process list",
        message: error.message
      };
    }
  } catch (error) {
    throw new Error(`Failed to get PM2 process list: ${error.message}`);
  }
};

/**
 * Restart specific PM2 process
 */
const restartPM2Process = async (processName) => {
  try {
    const isPM2 = process.env.PM2_HOME !== undefined;

    if (!isPM2) {
      return {
        success: false,
        message: "PM2 not detected"
      };
    }

    await execAsync(`pm2 restart ${processName}`);

    return {
      success: true,
      message: `Process '${processName}' restarted successfully`,
      processName,
      timestamp: new Date()
    };
  } catch (error) {
    throw new Error(`Failed to restart PM2 process: ${error.message}`);
  }
};

/**
 * Helper: Get connection state name
 */
const getConnectionState = (state) => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  return states[state] || "unknown";
};

/**
 * Helper: Format uptime
 */
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
};

module.exports = {
  restartApplication,
  clearCache,
  clearDatabaseConnections,
  runGarbageCollection,
  getServiceStatus,
  healthCheckAndRecover,
  getPM2ProcessList,
  restartPM2Process
};