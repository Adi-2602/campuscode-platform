const { PERMISSIONS } = require("../constants/permissions");
const AuditLog = require("../models/auditLog.model");

/**
 * Helper function to log audit actions
 */
const logAuditAction = async ({
  req,
  user,
  action,
  permissionUsed,
  targetType,
  targetId,
  targetEmail,
  targetName,
  success,
  errorMessage,
  metadata
}) => {
  try {
    await AuditLog.createLog({
      actorId: user.id || user._id,
      actorRole: user.role,
      actorEmail: user.email,
      actorName: user.name,
      action,
      permissionUsed,
      targetType,
      targetId,
      targetEmail,
      targetName,
      metadata,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      success,
      errorMessage,
      statusCode: success ? 200 : 403
    });
  } catch (error) {
    console.error("Audit log error:", error);
    // Don't throw - logging failure shouldn't break the request
  }
};

/**
 * Middleware to check if user has required permission
 * @param {string} requiredPermission - The permission required for this route
 * @param {object} options - Additional options
 * @param {string} options.action - Description of the action being performed
 * @param {string} options.targetType - Type of resource being accessed
 */
const requirePermission = (requiredPermission, options = {}) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "Authentication required"
        });
      }

      // Superadmin has all permissions - bypass check
      if (user.role === "superadmin") {
        return next();
      }

      // Check if user is admin
      if (user.role !== "admin") {
        await logAuditAction({
          req,
          user,
          action: options.action || "access_attempt",
          permissionUsed: requiredPermission,
          targetType: options.targetType,
          success: false,
          errorMessage: "User role not authorized"
        });

        return res.status(403).json({
          error: "Access denied. Admin role required."
        });
      }

      // Check if admin has the required permission
      if (!user.permissions || !user.permissions.includes(requiredPermission)) {
        await logAuditAction({
          req,
          user,
          action: options.action || "access_attempt",
          permissionUsed: requiredPermission,
          targetType: options.targetType,
          success: false,
          errorMessage: "Permission denied"
        });

        return res.status(403).json({
          error: "Access denied. Required permission: " + requiredPermission,
          requiredPermission
        });
      }

      // Permission granted - continue
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({
        error: "Permission check failed"
      });
    }
  };
};

/**
 * Middleware to check if user has ANY of the required permissions
 * @param {Array<string>} requiredPermissions - Array of permissions (user needs at least one)
 * @param {object} options - Additional options
 */
const requireAnyPermission = (requiredPermissions, options = {}) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "Authentication required"
        });
      }

      // Superadmin has all permissions
      if (user.role === "superadmin") {
        return next();
      }

      // Check if user is admin
      if (user.role !== "admin") {
        await logAuditAction({
          req,
          user,
          action: options.action || "access_attempt",
          permissionUsed: requiredPermissions.join(", "),
          targetType: options.targetType,
          success: false,
          errorMessage: "User role not authorized"
        });

        return res.status(403).json({
          error: "Access denied. Admin role required."
        });
      }

      // Check if admin has any of the required permissions
      const hasPermission = requiredPermissions.some((perm) =>
        user.permissions.includes(perm)
      );

      if (!hasPermission) {
        await logAuditAction({
          req,
          user,
          action: options.action || "access_attempt",
          permissionUsed: requiredPermissions.join(", "),
          targetType: options.targetType,
          success: false,
          errorMessage: "None of required permissions found"
        });

        return res.status(403).json({
          error:
            "Access denied. Required any of: " + requiredPermissions.join(", "),
          requiredPermissions
        });
      }

      // Permission granted - continue
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({
        error: "Permission check failed"
      });
    }
  };
};

/**
 * Middleware to check if user has ALL of the required permissions
 * @param {Array<string>} requiredPermissions - Array of permissions (user needs all)
 * @param {object} options - Additional options
 */
const requireAllPermissions = (requiredPermissions, options = {}) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "Authentication required"
        });
      }

      // Superadmin has all permissions
      if (user.role === "superadmin") {
        return next();
      }

      // Check if user is admin
      if (user.role !== "admin") {
        await logAuditAction({
          req,
          user,
          action: options.action || "access_attempt",
          permissionUsed: requiredPermissions.join(", "),
          targetType: options.targetType,
          success: false,
          errorMessage: "User role not authorized"
        });

        return res.status(403).json({
          error: "Access denied. Admin role required."
        });
      }

      // Check if admin has all of the required permissions
      const hasAllPermissions = requiredPermissions.every((perm) =>
        user.permissions.includes(perm)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(
          (perm) => !user.permissions.includes(perm)
        );

        await logAuditAction({
          req,
          user,
          action: options.action || "access_attempt",
          permissionUsed: requiredPermissions.join(", "),
          targetType: options.targetType,
          success: false,
          errorMessage: `Missing permissions: ${missingPermissions.join(", ")}`
        });

        return res.status(403).json({
          error: "Access denied. Required all of: " + requiredPermissions.join(", "),
          requiredPermissions,
          missingPermissions
        });
      }

      // Permission granted - continue
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({
        error: "Permission check failed"
      });
    }
  };
};

/**
 * Middleware to ensure only superadmin can access
 */
const requireSuperAdmin = () => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "Authentication required"
        });
      }

      if (user.role !== "superadmin") {
        await logAuditAction({
          req,
          user,
          action: "superadmin_access_attempt",
          permissionUsed: "SUPERADMIN_ONLY",
          success: false,
          errorMessage: "Superadmin access required"
        });

        return res.status(403).json({
          error: "Access denied. Superadmin only."
        });
      }

      next();
    } catch (error) {
      console.error("Superadmin check error:", error);
      res.status(500).json({
        error: "Authorization check failed"
      });
    }
  };
};

/**
 * Middleware to ensure user is admin or superadmin (any admin)
 */
const requireAdminRole = () => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "Authentication required"
        });
      }

      if (user.role !== "admin" && user.role !== "superadmin") {
        await logAuditAction({
          req,
          user,
          action: "admin_access_attempt",
          permissionUsed: "ADMIN_ROLE",
          success: false,
          errorMessage: "Admin role required"
        });

        return res.status(403).json({
          error: "Access denied. Admin or Superadmin role required."
        });
      }

      next();
    } catch (error) {
      console.error("Admin role check error:", error);
      res.status(500).json({
        error: "Authorization check failed"
      });
    }
  };
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireSuperAdmin,
  requireAdminRole,
  logAuditAction
};