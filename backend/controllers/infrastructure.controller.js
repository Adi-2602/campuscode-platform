const {
  getSystemInfo,
  getCPUUsage,
  getMemoryUsage,
  getDiskUsage,
  getNetworkInfo,
  getProcessInfo,
  getDatabaseInfo,
  getAllMetrics,
  getHealthStatus
} = require("../services/infrastructure.service");

const { manualLog } = require("../middlewares/auditLog.middleware");

/**
 * Get system information
 * GET /admin/monitoring/infrastructure/system
 * Permission: VIEW_INFRA
 */
const getSystemInfoHandler = async (req, res) => {
  try {
    const systemInfo = await getSystemInfo();

    await manualLog({
      user: req.user,
      req,
      action: "view_system_info",
      permissionUsed: "VIEW_INFRA",
      targetType: "system",
      metadata: {
        platform: systemInfo.platform,
        memoryUsagePercentage: systemInfo.memoryUsagePercentage
      },
      success: true
    });

    res.json({
      systemInfo
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get CPU usage
 * GET /admin/monitoring/infrastructure/cpu
 * Permission: VIEW_INFRA
 */
const getCPUUsageHandler = async (req, res) => {
  try {
    const cpuUsage = await getCPUUsage();

    await manualLog({
      user: req.user,
      req,
      action: "view_cpu_usage",
      permissionUsed: "VIEW_INFRA",
      targetType: "system",
      metadata: {
        averageUsage: cpuUsage.averageUsage,
        cpuCount: cpuUsage.cpuCount
      },
      success: true
    });

    res.json({
      cpu: cpuUsage
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get memory usage
 * GET /admin/monitoring/infrastructure/memory
 * Permission: VIEW_INFRA
 */
const getMemoryUsageHandler = async (req, res) => {
  try {
    const memoryUsage = await getMemoryUsage();

    await manualLog({
      user: req.user,
      req,
      action: "view_memory_usage",
      permissionUsed: "VIEW_INFRA",
      targetType: "system",
      metadata: {
        systemUsagePercentage: memoryUsage.system.usagePercentage,
        processHeapUsedMB: memoryUsage.process.heapUsedMB
      },
      success: true
    });

    res.json({
      memory: memoryUsage
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get disk usage
 * GET /admin/monitoring/infrastructure/disk
 * Permission: VIEW_INFRA
 */
const getDiskUsageHandler = async (req, res) => {
  try {
    const diskUsage = await getDiskUsage();

    await manualLog({
      user: req.user,
      req,
      action: "view_disk_usage",
      permissionUsed: "VIEW_INFRA",
      targetType: "system",
      metadata: {
        usagePercentage: diskUsage.usagePercentage || "N/A"
      },
      success: true
    });

    res.json({
      disk: diskUsage
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get network information
 * GET /admin/monitoring/infrastructure/network
 * Permission: VIEW_INFRA
 */
const getNetworkInfoHandler = async (req, res) => {
  try {
    const networkInfo = await getNetworkInfo();

    await manualLog({
      user: req.user,
      req,
      action: "view_network_info",
      permissionUsed: "VIEW_INFRA",
      targetType: "system",
      metadata: {
        totalInterfaces: networkInfo.totalInterfaces
      },
      success: true
    });

    res.json({
      network: networkInfo
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get process information
 * GET /admin/monitoring/infrastructure/process
 * Permission: VIEW_INFRA
 */
const getProcessInfoHandler = async (req, res) => {
  try {
    const processInfo = await getProcessInfo();

    await manualLog({
      user: req.user,
      req,
      action: "view_process_info",
      permissionUsed: "VIEW_INFRA",
      targetType: "system",
      metadata: {
        nodeVersion: processInfo.nodeVersion,
        uptime: processInfo.uptimeFormatted
      },
      success: true
    });

    res.json({
      process: processInfo
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get database information
 * GET /admin/monitoring/infrastructure/database
 * Permission: VIEW_INFRA
 */
const getDatabaseInfoHandler = async (req, res) => {
  try {
    const databaseInfo = await getDatabaseInfo();

    await manualLog({
      user: req.user,
      req,
      action: "view_database_info",
      permissionUsed: "VIEW_INFRA",
      targetType: "system",
      metadata: {
        state: databaseInfo.state,
        isConnected: databaseInfo.isConnected
      },
      success: true
    });

    res.json({
      database: databaseInfo
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get all infrastructure metrics
 * GET /admin/monitoring/infrastructure/metrics
 * Permission: VIEW_INFRA
 */
const getAllMetricsHandler = async (req, res) => {
  try {
    const metrics = await getAllMetrics();

    await manualLog({
      user: req.user,
      req,
      action: "view_all_infrastructure_metrics",
      permissionUsed: "VIEW_INFRA",
      targetType: "system",
      metadata: {
        memoryUsage: metrics.memory.system.usagePercentage,
        cpuUsage: metrics.cpu.averageUsage,
        databaseConnected: metrics.database.isConnected
      },
      success: true
    });

    res.json({
      metrics
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get health status
 * GET /admin/monitoring/infrastructure/health
 * Permission: VIEW_INFRA
 */
const getHealthStatusHandler = async (req, res) => {
  try {
    const health = await getHealthStatus();

    await manualLog({
      user: req.user,
      req,
      action: "view_health_status",
      permissionUsed: "VIEW_INFRA",
      targetType: "system",
      metadata: {
        status: health.status
      },
      success: true
    });

    res.json({
      health
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  getSystemInfoHandler,
  getCPUUsageHandler,
  getMemoryUsageHandler,
  getDiskUsageHandler,
  getNetworkInfoHandler,
  getProcessInfoHandler,
  getDatabaseInfoHandler,
  getAllMetricsHandler,
  getHealthStatusHandler
};