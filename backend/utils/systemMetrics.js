const os = require("os");

/**
 * Get formatted system metrics snapshot
 */
const getMetricsSnapshot = () => {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    timestamp: new Date(),
    cpu: {
      count: cpus.length,
      model: cpus[0]?.model || "Unknown",
      speed: cpus[0]?.speed || 0
    },
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usagePercent: ((usedMemory / totalMemory) * 100).toFixed(2),
      totalGB: (totalMemory / (1024 ** 3)).toFixed(2),
      freeGB: (freeMemory / (1024 ** 3)).toFixed(2),
      usedGB: (usedMemory / (1024 ** 3)).toFixed(2)
    },
    uptime: {
      system: os.uptime(),
      process: process.uptime(),
      systemFormatted: formatDuration(os.uptime()),
      processFormatted: formatDuration(process.uptime())
    },
    loadAverage: os.loadavg()
  };
};

/**
 * Calculate CPU usage over a time period
 */
const calculateCPUUsage = (startMeasure, endMeasure) => {
  const startTotal = startMeasure.reduce(
    (acc, cpu) => acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq,
    0
  );
  const endTotal = endMeasure.reduce(
    (acc, cpu) => acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq,
    0
  );

  const startIdle = startMeasure.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const endIdle = endMeasure.reduce((acc, cpu) => acc + cpu.times.idle, 0);

  const totalDiff = endTotal - startTotal;
  const idleDiff = endIdle - startIdle;

  const usage = ((totalDiff - idleDiff) / totalDiff) * 100;

  return usage.toFixed(2);
};

/**
 * Measure CPU usage over 1 second
 */
const measureCPUUsage = () => {
  return new Promise((resolve) => {
    const startMeasure = os.cpus();

    setTimeout(() => {
      const endMeasure = os.cpus();
      const usage = calculateCPUUsage(startMeasure, endMeasure);
      resolve(parseFloat(usage));
    }, 1000);
  });
};

/**
 * Get memory usage with thresholds
 */
const getMemoryStatus = () => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usagePercent = (usedMemory / totalMemory) * 100;

  let status = "healthy";
  if (usagePercent > 90) {
    status = "critical";
  } else if (usagePercent > 75) {
    status = "warning";
  }

  return {
    usagePercent: usagePercent.toFixed(2),
    status,
    usedGB: (usedMemory / (1024 ** 3)).toFixed(2),
    totalGB: (totalMemory / (1024 ** 3)).toFixed(2),
    freeGB: (freeMemory / (1024 ** 3)).toFixed(2)
  };
};

/**
 * Get process memory usage
 */
const getProcessMemory = () => {
  const memUsage = process.memoryUsage();

  return {
    rss: memUsage.rss,
    heapTotal: memUsage.heapTotal,
    heapUsed: memUsage.heapUsed,
    external: memUsage.external,
    rssMB: (memUsage.rss / (1024 ** 2)).toFixed(2),
    heapTotalMB: (memUsage.heapTotal / (1024 ** 2)).toFixed(2),
    heapUsedMB: (memUsage.heapUsed / (1024 ** 2)).toFixed(2),
    heapUsagePercent: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2)
  };
};

/**
 * Format bytes to human-readable format
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Format duration in seconds to human-readable format
 */
const formatDuration = (seconds) => {
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

/**
 * Get system health score (0-100)
 */
const getHealthScore = () => {
  const memStatus = getMemoryStatus();
  const memUsage = parseFloat(memStatus.usagePercent);

  let score = 100;

  // Deduct points for high memory usage
  if (memUsage > 90) {
    score -= 40;
  } else if (memUsage > 75) {
    score -= 20;
  } else if (memUsage > 60) {
    score -= 10;
  }

  // Load average check (for Unix-like systems)
  const loadAvg = os.loadavg();
  const cpuCount = os.cpus().length;
  const normalizedLoad = loadAvg[0] / cpuCount;

  if (normalizedLoad > 2) {
    score -= 30;
  } else if (normalizedLoad > 1.5) {
    score -= 20;
  } else if (normalizedLoad > 1) {
    score -= 10;
  }

  return Math.max(0, score);
};

/**
 * Get platform-specific information
 */
const getPlatformInfo = () => {
  return {
    platform: os.platform(),
    type: os.type(),
    release: os.release(),
    arch: os.arch(),
    hostname: os.hostname(),
    homeDir: os.homedir(),
    tmpDir: os.tmpdir()
  };
};

/**
 * Get network interface statistics
 */
const getNetworkStats = () => {
  const interfaces = os.networkInterfaces();
  const stats = {
    totalInterfaces: 0,
    ipv4Count: 0,
    ipv6Count: 0,
    internalCount: 0,
    externalCount: 0
  };

  Object.values(interfaces).forEach((iface) => {
    iface.forEach((config) => {
      stats.totalInterfaces++;
      if (config.family === "IPv4") stats.ipv4Count++;
      if (config.family === "IPv6") stats.ipv6Count++;
      if (config.internal) stats.internalCount++;
      else stats.externalCount++;
    });
  });

  return stats;
};

/**
 * Create metrics history tracker
 */
class MetricsHistory {
  constructor(maxSize = 60) {
    this.maxSize = maxSize;
    this.history = [];
  }

  add(metrics) {
    this.history.push({
      ...metrics,
      timestamp: new Date()
    });

    // Keep only last N entries
    if (this.history.length > this.maxSize) {
      this.history.shift();
    }
  }

  get() {
    return this.history;
  }

  getLatest() {
    return this.history[this.history.length - 1] || null;
  }

  clear() {
    this.history = [];
  }

  getAverage(field) {
    if (this.history.length === 0) return 0;

    const sum = this.history.reduce((acc, item) => {
      const value = field.split(".").reduce((obj, key) => obj?.[key], item);
      return acc + (parseFloat(value) || 0);
    }, 0);

    return (sum / this.history.length).toFixed(2);
  }
}

module.exports = {
  getMetricsSnapshot,
  calculateCPUUsage,
  measureCPUUsage,
  getMemoryStatus,
  getProcessMemory,
  formatBytes,
  formatDuration,
  getHealthScore,
  getPlatformInfo,
  getNetworkStats,
  MetricsHistory
};