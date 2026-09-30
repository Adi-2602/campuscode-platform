const os = require("os");
const { exec } = require("child_process");
const { promisify } = require("util");
const mongoose = require("mongoose");

const execAsync = promisify(exec);

/**
 * Get system information
 */
const getSystemInfo = async () => {
  try {
    const systemInfo = {
      platform: os.platform(),
      architecture: os.arch(),
      hostname: os.hostname(),
      operatingSystem: os.type(),
      osRelease: os.release(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      usedMemory: os.totalmem() - os.freemem(),
      memoryUsagePercentage: (
        ((os.totalmem() - os.freemem()) / os.totalmem()) *
        100
      ).toFixed(2),
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || "Unknown",
      uptime: os.uptime(),
      nodeVersion: process.version,
      processUptime: process.uptime()
    };

    // Format memory values
    systemInfo.totalMemoryGB = (systemInfo.totalMemory / (1024 ** 3)).toFixed(2);
    systemInfo.freeMemoryGB = (systemInfo.freeMemory / (1024 ** 3)).toFixed(2);
    systemInfo.usedMemoryGB = (systemInfo.usedMemory / (1024 ** 3)).toFixed(2);

    // Format uptime
    systemInfo.uptimeFormatted = formatUptime(systemInfo.uptime);
    systemInfo.processUptimeFormatted = formatUptime(
      systemInfo.processUptime
    );

    return systemInfo;
  } catch (error) {
    throw new Error(`Failed to get system info: ${error.message}`);
  }
};

/**
 * Get CPU usage
 */
const getCPUUsage = async () => {
  try {
    const cpus = os.cpus();

    const cpuInfo = cpus.map((cpu, index) => {
      const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
      const idle = cpu.times.idle;
      const usage = ((total - idle) / total) * 100;

      return {
        core: index,
        model: cpu.model,
        speed: cpu.speed,
        usage: usage.toFixed(2),
        times: cpu.times
      };
    });

    // Calculate average CPU usage
    const avgUsage =
      cpuInfo.reduce((sum, cpu) => sum + parseFloat(cpu.usage), 0) /
      cpuInfo.length;

    return {
      cpuCount: cpus.length,
      averageUsage: avgUsage.toFixed(2),
      cores: cpuInfo
    };
  } catch (error) {
    throw new Error(`Failed to get CPU usage: ${error.message}`);
  }
};

/**
 * Get memory usage details
 */
const getMemoryUsage = async () => {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Process memory usage
    const processMemory = process.memoryUsage();

    return {
      system: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        usagePercentage: ((usedMemory / totalMemory) * 100).toFixed(2),
        totalGB: (totalMemory / (1024 ** 3)).toFixed(2),
        freeGB: (freeMemory / (1024 ** 3)).toFixed(2),
        usedGB: (usedMemory / (1024 ** 3)).toFixed(2)
      },
      process: {
        rss: processMemory.rss,
        heapTotal: processMemory.heapTotal,
        heapUsed: processMemory.heapUsed,
        external: processMemory.external,
        arrayBuffers: processMemory.arrayBuffers,
        rssMB: (processMemory.rss / (1024 ** 2)).toFixed(2),
        heapTotalMB: (processMemory.heapTotal / (1024 ** 2)).toFixed(2),
        heapUsedMB: (processMemory.heapUsed / (1024 ** 2)).toFixed(2),
        heapUsagePercentage: (
          (processMemory.heapUsed / processMemory.heapTotal) *
          100
        ).toFixed(2)
      }
    };
  } catch (error) {
    throw new Error(`Failed to get memory usage: ${error.message}`);
  }
};

/**
 * Get disk usage (Linux/Unix)
 */
const getDiskUsage = async () => {
  try {
    // Try to get disk usage using df command (Linux/Unix)
    try {
      const { stdout } = await execAsync("df -h /");
      const lines = stdout.trim().split("\n");
      
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        
        return {
          filesystem: parts[0],
          size: parts[1],
          used: parts[2],
          available: parts[3],
          usagePercentage: parts[4],
          mountPoint: parts[5]
        };
      }
    } catch (dfError) {
      // df command not available or failed
      return {
        error: "Disk usage information not available on this platform",
        platform: os.platform()
      };
    }

    return {
      error: "Unable to retrieve disk usage"
    };
  } catch (error) {
    throw new Error(`Failed to get disk usage: ${error.message}`);
  }
};

/**
 * Get network interfaces
 */
const getNetworkInfo = async () => {
  try {
    const interfaces = os.networkInterfaces();

    const networkInfo = [];

    Object.keys(interfaces).forEach((interfaceName) => {
      interfaces[interfaceName].forEach((iface) => {
        networkInfo.push({
          interface: interfaceName,
          family: iface.family,
          address: iface.address,
          netmask: iface.netmask,
          mac: iface.mac,
          internal: iface.internal
        });
      });
    });

    return {
      interfaces: networkInfo,
      totalInterfaces: networkInfo.length
    };
  } catch (error) {
    throw new Error(`Failed to get network info: ${error.message}`);
  }
};

/**
 * Get Node.js process info
 */
const getProcessInfo = async () => {
  try {
    return {
      pid: process.pid,
      version: process.version,
      nodeVersion: process.versions.node,
      v8Version: process.versions.v8,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      uptimeFormatted: formatUptime(process.uptime()),
      cwd: process.cwd(),
      execPath: process.execPath,
      argv: process.argv,
      env: {
        nodeEnv: process.env.NODE_ENV || "development"
      }
    };
  } catch (error) {
    throw new Error(`Failed to get process info: ${error.message}`);
  }
};

/**
 * Get database connection info
 */
const getDatabaseInfo = async () => {
  try {
    const connectionState = mongoose.connection.readyState;
    const stateMap = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting"
    };

    const dbInfo = {
      state: stateMap[connectionState] || "unknown",
      stateCode: connectionState,
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      isConnected: connectionState === 1
    };

    // Get database stats if connected
    if (connectionState === 1) {
      try {
        const stats = await mongoose.connection.db.stats();
        dbInfo.stats = {
          collections: stats.collections,
          views: stats.views,
          documents: stats.objects,
          dataSize: stats.dataSize,
          storageSize: stats.storageSize,
          indexes: stats.indexes,
          indexSize: stats.indexSize,
          dataSizeMB: (stats.dataSize / (1024 ** 2)).toFixed(2),
          storageSizeMB: (stats.storageSize / (1024 ** 2)).toFixed(2),
          indexSizeMB: (stats.indexSize / (1024 ** 2)).toFixed(2)
        };
      } catch (statsError) {
        dbInfo.statsError = "Unable to retrieve database statistics";
      }
    }

    return dbInfo;
  } catch (error) {
    throw new Error(`Failed to get database info: ${error.message}`);
  }
};

/**
 * Get all infrastructure metrics
 */
const getAllMetrics = async () => {
  try {
    const [
      systemInfo,
      cpuUsage,
      memoryUsage,
      diskUsage,
      networkInfo,
      processInfo,
      databaseInfo
    ] = await Promise.all([
      getSystemInfo(),
      getCPUUsage(),
      getMemoryUsage(),
      getDiskUsage(),
      getNetworkInfo(),
      getProcessInfo(),
      getDatabaseInfo()
    ]);

    return {
      timestamp: new Date(),
      system: systemInfo,
      cpu: cpuUsage,
      memory: memoryUsage,
      disk: diskUsage,
      network: networkInfo,
      process: processInfo,
      database: databaseInfo
    };
  } catch (error) {
    throw new Error(`Failed to get all metrics: ${error.message}`);
  }
};

/**
 * Get health check status
 */
const getHealthStatus = async () => {
  try {
    const memoryUsage = await getMemoryUsage();
    const databaseInfo = await getDatabaseInfo();
    const cpuUsage = await getCPUUsage();

    const health = {
      status: "healthy",
      checks: {
        memory: {
          status: "ok",
          usagePercentage: memoryUsage.system.usagePercentage
        },
        cpu: {
          status: "ok",
          averageUsage: cpuUsage.averageUsage
        },
        database: {
          status: databaseInfo.isConnected ? "ok" : "error",
          state: databaseInfo.state
        },
        process: {
          status: "ok",
          uptime: process.uptime()
        }
      },
      timestamp: new Date()
    };

    // Check if any critical issues
    if (parseFloat(memoryUsage.system.usagePercentage) > 90) {
      health.checks.memory.status = "warning";
      health.status = "degraded";
    }

    if (parseFloat(cpuUsage.averageUsage) > 90) {
      health.checks.cpu.status = "warning";
      health.status = "degraded";
    }

    if (!databaseInfo.isConnected) {
      health.checks.database.status = "error";
      health.status = "unhealthy";
    }

    return health;
  } catch (error) {
    return {
      status: "error",
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Helper: Format uptime in human-readable format
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
  getSystemInfo,
  getCPUUsage,
  getMemoryUsage,
  getDiskUsage,
  getNetworkInfo,
  getProcessInfo,
  getDatabaseInfo,
  getAllMetrics,
  getHealthStatus
};