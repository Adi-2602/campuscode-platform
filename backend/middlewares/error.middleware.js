/**
 * Global Error Handling Middleware
 * MUST be the last middleware in app.js
 */
const errorHandler = (err, req, res, next) => {
  // Default values
  const statusCode = err.statusCode || 500;
  const message =
    err.message || "Something went wrong. Please try again.";

  // Log error (dev-friendly)
  if (process.env.NODE_ENV !== "production") {
    console.error("🔥 Error:", {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method
    });
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: err.stack,
    details: err
  });
};

module.exports = errorHandler;
