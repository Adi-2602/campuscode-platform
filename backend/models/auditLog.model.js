const mongoose = require("mongoose");

/**
 * AuditLog Model
 * Tracks every action performed by admins and superadmins
 * Used for security monitoring and compliance
 */
const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    actorRole: {
      type: String,
      enum: ["superadmin", "admin"],
      required: true,
      index: true
    },
    actorEmail: {
      type: String,
      required: true
    },
    actorName: {
      type: String,
      required: true
    },

    // What action was performed
    action: {
      type: String,
      required: true,
      index: true
      // Examples: "create_admin", "view_classes", "update_permissions", "view_student_details"
    },
    actionDescription: {
      type: String
      // Human-readable description of the action
    },

    // Which permission was used
    permissionUsed: {
      type: String,
      required: true,
      index: true
      // Examples: "CREATE_ADMIN", "VIEW_CLASSES", "MANAGE_ADMIN_PERMISSIONS"
    },

    // Target of the action
    targetType: {
      type: String,
      enum: [
        "user",
        "admin",
        "class",
        "exam",
        "student",
        "teacher",
        "submission",
        "system",
        "audit_log"
      ],
      index: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },
    targetEmail: {
      type: String
    },
    targetName: {
      type: String
    },

    // Additional context
    metadata: {
      type: mongoose.Schema.Types.Mixed
      // Can store any additional data related to the action
      // Examples: { permissionsAdded: [...], permissionsRemoved: [...] }
    },

    // Request information
    ipAddress: {
      type: String,
      index: true
    },
    userAgent: {
      type: String
    },
    requestMethod: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    },
    requestUrl: {
      type: String
    },

    // Result of the action
    success: {
      type: Boolean,
      default: true,
      index: true
    },
    errorMessage: {
      type: String
    },
    statusCode: {
      type: Number
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// Indexes for fast querying
auditLogSchema.index({ createdAt: -1 }); // Recent logs first
auditLogSchema.index({ actorId: 1, createdAt: -1 }); // Logs by specific admin
auditLogSchema.index({ permissionUsed: 1, createdAt: -1 }); // Logs by permission
auditLogSchema.index({ targetType: 1, targetId: 1 }); // Logs for specific target
auditLogSchema.index({ action: 1, createdAt: -1 }); // Logs by action type
auditLogSchema.index({ success: 1, createdAt: -1 }); // Failed actions
auditLogSchema.index({ ipAddress: 1, createdAt: -1 }); // Logs from specific IP

// Compound index for common queries
auditLogSchema.index({ actorId: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

/**
 * Static method to create audit log entry
 */
auditLogSchema.statics.createLog = async function ({
  actorId,
  actorRole,
  actorEmail,
  actorName,
  action,
  actionDescription,
  permissionUsed,
  targetType,
  targetId,
  targetEmail,
  targetName,
  metadata,
  ipAddress,
  userAgent,
  requestMethod,
  requestUrl,
  success = true,
  errorMessage,
  statusCode
}) {
  try {
    const log = await this.create({
      actorId,
      actorRole,
      actorEmail,
      actorName,
      action,
      actionDescription,
      permissionUsed,
      targetType,
      targetId,
      targetEmail,
      targetName,
      metadata,
      ipAddress,
      userAgent,
      requestMethod,
      requestUrl,
      success,
      errorMessage,
      statusCode
    });
    return log;
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw error - logging failure shouldn't break the app
    return null;
  }
};

/**
 * Static method to get logs with filters
 */
auditLogSchema.statics.getLogs = async function (filters = {}, options = {}) {
  const {
    actorId,
    action,
    permissionUsed,
    targetType,
    targetId,
    success,
    startDate,
    endDate,
    ipAddress
  } = filters;

  const { page = 1, limit = 50, sort = { createdAt: -1 } } = options;

  const query = {};

  if (actorId) query.actorId = actorId;
  if (action) query.action = action;
  if (permissionUsed) query.permissionUsed = permissionUsed;
  if (targetType) query.targetType = targetType;
  if (targetId) query.targetId = targetId;
  if (success !== undefined) query.success = success;
  if (ipAddress) query.ipAddress = ipAddress;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    this.find(query)
      .populate("actorId", "name email role")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;