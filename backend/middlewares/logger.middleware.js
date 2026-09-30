const logger = require('../config/logger.config');

/**
 * Middleware to log request activity to console and file with user identity
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Once the request is finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        const method = req.method;
        const url = req.originalUrl;
        const status = res.statusCode;

        // Get user info if authenticated
        const user = req.user;
        const userInfo = user ? `[${user.email} (${user.role})]` : '[ANONYMOUS]';

        const logMessage = `${userInfo} - ${method} ${url} - ${status} (${duration}ms)`;

        // 1. Log to console (colored for developers)
        let statusColor = status >= 400 ? '\x1b[31m' : (status >= 300 ? '\x1b[33m' : '\x1b[32m');
        const reset = '\x1b[0m';
        console.log(`\x1b[90m${new Date().toISOString()}\x1b[0m ${userInfo} - ${method} ${url} - ${statusColor}${status}${reset} (${duration}ms)`);

        // 2. Log to file (via Winston) for UI monitoring
        logger.info(logMessage);
    });

    next();
};

module.exports = requestLogger;
