const jwt = require("jsonwebtoken");

/**
 * Verify JWT token
 * 🔥 MODIFIED: Attach permissions, name, and email to req.user
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const err = new Error("Authentication token missing");
      err.statusCode = 401;
      return next(err);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 MODIFIED: Attach all user info including permissions
    req.user = {
      id: decoded.id,
      role: decoded.role,
      name: decoded.name || "Unknown", // 🔥 NEW
      email: decoded.email || "", // 🔥 NEW
      permissions: decoded.permissions || [] // 🔥 NEW - Empty array for non-admin users
    };

    next();
  } catch (error) {
    error.statusCode = 401;
    error.message = "Invalid or expired token";
    next(error);
  }
};

/**
 * Role-based access control
 * No changes needed - works with existing role check
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      return next(err);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const err = new Error("Access denied");
      err.statusCode = 403;
      return next(err);
    }

    next();
  };
};

/**
 * Backward compatibility alias
 */
const authorizeRoles = authorize;

module.exports = {
  authenticate,
  authorize,
  authorizeRoles
};