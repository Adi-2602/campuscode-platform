/**
 * Production Logger Configuration
 * Stores logs in MongoDB instead of local files
 */

const winston = require("winston");
require("winston-mongodb");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Console logging (always)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    // ✨ NEW: Application logs in file (for UI)
    new winston.transports.File({
      filename: "logs/app.log",
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
          let msg = `${timestamp} [${level.toUpperCase()}] ${message}`;
          if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
          }
          return msg;
        })
      )
    }),

    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    /* MongoDB error logging (separate collection)
    new winston.transports.MongoDB({
      db: process.env.MONGO_URI,
      collection: "error_logs",
      level: "error",
      storeHost: true,
      capped: true,
      cappedSize: 10485760,
      cappedMax: 1000
    }) */
  ]
});

// Export logger
module.exports = logger;