const AuditLog = require("../models/auditLog.model");

/**
 * Middleware to automatically log successful admin actions
 * Use this AFTER the main controller logic
 * 
 * Usage:
 * router.get("/classes", 
 *   authenticate, 
 *   requirePermission("VIEW_CLASSES"),
 *   getClassesController,
 *   logAction("view_classes", "VIEW_CLASSES", "class")
 * );
 */
const logAction = (action, permissionUsed, targetType = null) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return next();
      }

      // Only log admin and superadmin actions
      if (user.role !== "admin" && user.role !== "superadmin") {
        return next();
      }

      // Extract target information from request
      let targetId = null;
      let targetEmail = null;
      let targetName = null;
      let metadata = {};

      // Try to get target from URL params
      if (req.params.id) targetId = req.params.id;
      if (req.params.studentId) targetId = req.params.studentId;
      if (req.params.teacherId) targetId = req.params.teacherId;
      if (req.params.adminId) targetId = req.params.adminId;
      if (req.params.classId) targetId = req.params.classId;
      if (req.params.examId) targetId = req.params.examId;

      // Try to get target from response body (for create/update operations)
      if (res.locals.targetId) targetId = res.locals.targetId;
      if (res.locals.targetEmail) targetEmail = res.locals.targetEmail;
      if (res.locals.targetName) targetName = res.locals.targetName;
      if (res.locals.metadata) metadata = res.locals.metadata;

      // Create audit log
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
        success: true,
        statusCode: res.statusCode
      });

      next();
    } catch (error) {
      console.error("Audit logging error:", error);
      // Don't fail the request if logging fails
      next();
    }
  };
};

/**
 * Middleware to log action with custom details
 * Use when you need to pass specific target information
 * 
 * Usage in controller:
 * req.auditLog = {
 *   action: "create_admin",
 *   permissionUsed: "CREATE_ADMIN",
 *   targetType: "admin",
 *   targetId: newAdmin._id,
 *   targetEmail: newAdmin.email,
 *   targetName: newAdmin.name,
 *   metadata: { permissions: newAdmin.permissions }
 * };
 */
const logCustomAction = () => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const auditData = req.auditLog;

      if (!user || !auditData) {
        return next();
      }

      // Only log admin and superadmin actions
      if (user.role !== "admin" && user.role !== "superadmin") {
        return next();
      }

      await AuditLog.createLog({
        actorId: user.id || user._id,
        actorRole: user.role,
        actorEmail: user.email,
        actorName: user.name,
        action: auditData.action,
        actionDescription: auditData.actionDescription,
        permissionUsed: auditData.permissionUsed,
        targetType: auditData.targetType,
        targetId: auditData.targetId,
        targetEmail: auditData.targetEmail,
        targetName: auditData.targetName,
        metadata: auditData.metadata,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("user-agent"),
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        success: auditData.success !== undefined ? auditData.success : true,
        errorMessage: auditData.errorMessage,
        statusCode: res.statusCode
      });

      // Clean up
      delete req.auditLog;

      next();
    } catch (error) {
      console.error("Custom audit logging error:", error);
      next();
    }
  };
};

/**
 * Helper function to manually log an action (use in controllers)
 */
const manualLog = async ({
  user,
  req,
  action,
  actionDescription,
  permissionUsed,
  targetType,
  targetId,
  targetEmail,
  targetName,
  metadata,
  success = true,
  errorMessage
}) => {
  try {
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return;
    }

    await AuditLog.createLog({
      actorId: user.id || user._id,
      actorRole: user.role,
      actorEmail: user.email,
      actorName: user.name,
      action,
      actionDescription,
      permissionUsed,
      targetType,
      targetId,
      targetEmail,
      targetName,
      metadata,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get("user-agent"),
      requestMethod: req?.method,
      requestUrl: req?.originalUrl,
      success,
      errorMessage,
      statusCode: success ? 200 : 400
    });
  } catch (error) {
    console.error("Manual audit logging error:", error);
    // Don't throw - logging failure shouldn't break the request
  }
};

/**
 * Wrapper function to log controller actions
 * Wraps the controller and automatically logs on success
 */
const withAuditLog = (action, permissionUsed, targetType) => {
  return (controller) => {
    return async (req, res, next) => {
      try {
        // Execute the controller
        await controller(req, res, next);

        // If controller was successful, log it
        if (res.headersSent && res.statusCode >= 200 && res.statusCode < 300) {
          const user = req.user;

          if (user && (user.role === "admin" || user.role === "superadmin")) {
            await AuditLog.createLog({
              actorId: user.id || user._id,
              actorRole: user.role,
              actorEmail: user.email,
              actorName: user.name,
              action,
              permissionUsed,
              targetType,
              targetId: req.params.id || res.locals.targetId,
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get("user-agent"),
              requestMethod: req.method,
              requestUrl: req.originalUrl,
              success: true,
              statusCode: res.statusCode
            });
          }
        }
      } catch (error) {
        next(error);
      }
    };
  };
};

module.exports = {
  logAction,
  logCustomAction,
  manualLog,
  withAuditLog
};