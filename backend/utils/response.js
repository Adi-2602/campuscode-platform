/**
 * Response Utility
 * Standardized response helpers for consistent API responses
 */

/**
 * Success response
 */
const success = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Created response (201)
 */
const created = (res, data, message = "Resource created successfully") => {
  return res.status(201).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Error response
 */
const error = (res, message, statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Bad request response (400)
 */
const badRequest = (res, message = "Bad request", details = null) => {
  return error(res, message, 400, details);
};

/**
 * Unauthorized response (401)
 */
const unauthorized = (res, message = "Unauthorized") => {
  return error(res, message, 401);
};

/**
 * Forbidden response (403)
 */
const forbidden = (res, message = "Forbidden") => {
  return error(res, message, 403);
};

/**
 * Not found response (404)
 */
const notFound = (res, message = "Resource not found") => {
  return error(res, message, 404);
};

/**
 * Conflict response (409)
 */
const conflict = (res, message = "Resource already exists") => {
  return error(res, message, 409);
};

/**
 * Validation error response (422)
 */
const validationError = (res, errors) => {
  return res.status(422).json({
    success: false,
    error: "Validation failed",
    errors,
    timestamp: new Date().toISOString()
  });
};

/**
 * Internal server error response (500)
 */
const serverError = (res, message = "Internal server error", details = null) => {
  return error(res, message, 500, details);
};

/**
 * Paginated response
 */
const paginated = (res, data, pagination, message = "Success") => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      total: pagination.total || 0,
      pages: pagination.pages || 0
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * No content response (204)
 */
const noContent = (res) => {
  return res.status(204).send();
};

/**
 * Redirect response (302)
 */
const redirect = (res, url) => {
  return res.redirect(302, url);
};

/**
 * File download response
 */
const download = (res, filePath, filename) => {
  return res.download(filePath, filename);
};

/**
 * JSON file response
 */
const json = (res, data, filename = "data.json") => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(JSON.stringify(data, null, 2));
};

/**
 * CSV file response
 */
const csv = (res, data, filename = "data.csv") => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(data);
};

/**
 * Custom response
 */
const custom = (res, statusCode, body) => {
  return res.status(statusCode).json(body);
};

/**
 * Send response with custom headers
 */
const withHeaders = (res, headers, data, statusCode = 200) => {
  Object.keys(headers).forEach((key) => {
    res.setHeader(key, headers[key]);
  });
  return res.status(statusCode).json(data);
};

/**
 * Rate limit exceeded response (429)
 */
const rateLimitExceeded = (res, retryAfter = null) => {
  const response = {
    success: false,
    error: "Rate limit exceeded",
    timestamp: new Date().toISOString()
  };

  if (retryAfter) {
    res.setHeader("Retry-After", retryAfter);
    response.retryAfter = retryAfter;
  }

  return res.status(429).json(response);
};

/**
 * Service unavailable response (503)
 */
const serviceUnavailable = (res, message = "Service temporarily unavailable") => {
  return error(res, message, 503);
};

/**
 * Accepted response (202)
 */
const accepted = (res, message = "Request accepted for processing") => {
  return res.status(202).json({
    success: true,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * Partial content response (206)
 */
const partialContent = (res, data, range) => {
  res.setHeader("Content-Range", range);
  return res.status(206).json({
    success: true,
    data,
    range,
    timestamp: new Date().toISOString()
  });
};

/**
 * Build response with metadata
 */
const withMetadata = (res, data, metadata, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    metadata,
    timestamp: new Date().toISOString()
  });
};

/**
 * Async handler wrapper (catch errors automatically)
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Try-catch wrapper for controllers
 */
const tryCatch = (controller) => {
  return async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (err) {
      if (err.name === "ValidationError") {
        return validationError(res, err.errors);
      }
      if (err.name === "CastError") {
        return badRequest(res, "Invalid ID format");
      }
      next(err);
    }
  };
};

module.exports = {
  success,
  created,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  serverError,
  paginated,
  noContent,
  redirect,
  download,
  json,
  csv,
  custom,
  withHeaders,
  rateLimitExceeded,
  serviceUnavailable,
  accepted,
  partialContent,
  withMetadata,
  asyncHandler,
  tryCatch
};