const rateLimit = require("express-rate-limit");

// General API limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per windowMs (Increased for Admin operations)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: 429,
        error: "Too many requests, please try again later."
    }
});

// Auth limiter (stricter)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 login attempts per hour
    message: {
        status: 429,
        error: "Too many login attempts, please try again later."
    }
});

module.exports = {
    apiLimiter,
    authLimiter
};
