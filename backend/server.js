const cluster = require("cluster");
require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./config/logger.config");
const { initializeSocket, setSocketInstance } = require("./config/socket.config");

// ✨ NEW: Import Redis for graceful shutdown
const { closeRedisConnection, createRedisClient } = require("./config/redis");

const PORT = process.env.PORT || 5000;
// Number of worker processes. Free hosts (e.g. Render) have little RAM, so default to 1.
// Socket.IO needs sticky sessions if you run more than one worker behind a load balancer.
const numWorkers = Math.max(1, parseInt(process.env.WEB_CONCURRENCY, 10) || 1);

if (cluster.isPrimary) {
  console.log(`🚀 Master process ${process.pid} is running`);
  console.log(`🔥 Forking ${numWorkers} worker(s)...`);

  // Fork workers
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  // Handle worker exit
  cluster.on("exit", (worker, code, signal) => {
    // Only respawn if the exit wasn't voluntary (code 0) or manually killed
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.log(`❌ Worker ${worker.process.pid} died. Forking a new one...`);
      cluster.fork();
    }
  });

  const stopWorkers = () => {
    console.log('🛑 Master stopping... killing all workers');
    for (const id in cluster.workers) {
      cluster.workers[id].kill(); // send SIGTERM to worker
    }
    process.exit(0);
  };

  process.on('SIGTERM', stopWorkers);
  process.on('SIGINT', stopWorkers);

  // ✨ NEW: Connect Master to DB for scheduled worker
  connectDB();

  // ✨ NEW: Scheduled result publication (Master only)
  const publishScheduledResults = require("./scripts/publishResults.worker");
  setInterval(publishScheduledResults, 60 * 1000); // Check every minute
  publishScheduledResults(); // Run once on startup

} else {
  // WORKER PROCESS

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.IO (Each worker needs its own instance)
  // Note: We need Redis Adapter for them to talk to each other (next step)
  const io = initializeSocket(server);
  setSocketInstance(io);

  // Connect to MongoDB
  connectDB();

  // Initialize Redis for this worker
  // createRedisClient(); // Moved to inside app.js or specific configs to avoid connection limit issues? 
  // keeping it here if app.js doesn't cover it sufficiently for the worker context, 
  // but app.js calls createRedisClient() on line 57.

  // Start server
  server.listen(PORT, () => {
    logger.info(`Worker ${process.pid} started`, {
      port: PORT,
      judge0Url: process.env.JUDGE0_URL
    });
    console.log(`✅ Worker ${process.pid} listening on port ${PORT}`);
  });

  // ✨ NEW: Graceful shutdown handler for Workers
  const gracefulShutdown = async (signal) => {
    logger.info(`Worker ${process.pid} received ${signal}. Shutting down...`);

    // Close HTTP server (stops accepting new connections)
    server.close(async () => {
      try {
        // Close Socket.IO connections
        io.close(() => { });

        // Close Redis connection
        await closeRedisConnection();

        // Close MongoDB connection
        const mongoose = require('mongoose');
        await mongoose.connection.close();

        logger.info(`Worker ${process.pid} shutdown complete`);
        process.exit(0);
      } catch (error) {
        logger.error(`Error during worker ${process.pid} shutdown:`, error);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      logger.error(`Worker ${process.pid} forced shutdown`);
      process.exit(1);
    }, 10000);
  };

  // ✨ NEW: Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught errors
  process.on("uncaughtException", (error) => {
    try {
      logger.error(`Worker ${process.pid} Uncaught Exception`, {
        error: error.message,
        stack: error.stack
      });
    } catch (e) {
      console.error("🔥 CRITICAL: Logger failed during uncaughtException!");
      console.error(error);
    }
    // Give some time for logs to be written
    setTimeout(() => process.exit(1), 500);
  });

  process.on("unhandledRejection", (error) => {
    try {
      logger.error(`Worker ${process.pid} Unhandled Rejection`, {
        error: error.message,
        stack: error.stack
      });
    } catch (e) {
      console.error("🔥 CRITICAL: Logger failed during unhandledRejection!");
      console.error(error);
    }
    setTimeout(() => process.exit(1), 500);
  });
}