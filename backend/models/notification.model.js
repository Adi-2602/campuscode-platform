const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Recipient
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    recipientRole: {
      type: String,
      enum: ["student", "teacher", "superadmin", "admin"],
      required: true
    },

    // Notification content
    type: {
      type: String,
      enum: [
        "exam_published",
        "exam_started",
        "exam_ended",
        "result_published",
        "submission_evaluated",
        "class_update",
        "system_alert",
        "custom",
        "permission_updated",
        "admin_action"
      ],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },

    // Related entities
    relatedEntity: {
      entityType: {
        type: String,
        enum: ["exam", "class", "submission", "result", "user", "system", "none"],
        default: "none"
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId
      }
    },

    // Action URL (optional - for deep linking)
    actionUrl: {
      type: String,
      maxlength: 500
    },

    // Status
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date
    },

    // Priority
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },

    // Sender (optional - for custom notifications)
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    // Metadata (flexible field for additional data)
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },

    // ✅ FIXED: Expiry (optional - auto-delete after this date)
    expiresAt: {
      type: Date
      // ❌ REMOVED: index: true (duplicate - TTL index below creates it)
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// ✅ KEEP: TTL index (this creates the index on expiresAt automatically)
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for time ago
notificationSchema.virtual("timeAgo").get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
});

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = function () {
  this.isRead = false;
  this.readAt = null;
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function (data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function (recipientId) {
  return this.countDocuments({ recipientId, isRead: false });
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = async function (recipientId) {
  return this.updateMany(
    { recipientId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to delete old read notifications (cleanup)
notificationSchema.statics.cleanupOldNotifications = async function (daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  return this.deleteMany({
    isRead: true,
    readAt: { $lt: cutoffDate }
  });
};

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;