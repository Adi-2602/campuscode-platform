const Notification = require("../models/notification.model");
const { broadcastNotification } = require("./realtime.service");

/**
 * Create a notification
 */
const createNotification = async (data) => {
  try {
    const {
      recipientId,
      recipientRole,
      type,
      title,
      message,
      relatedEntity,
      actionUrl,
      priority = "medium",
      sentBy,
      metadata,
      expiresAt
    } = data;

    const notification = await Notification.createNotification({
      recipientId,
      recipientRole,
      type,
      title,
      message,
      relatedEntity,
      actionUrl,
      priority,
      sentBy,
      metadata,
      expiresAt
    });

    // Broadcast via WebSocket (real-time)
    try {
      await broadcastNotification(recipientId, {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        createdAt: notification.createdAt
      });
    } catch (error) {
      console.error("Failed to broadcast notification:", error.message);
      // Continue even if broadcast fails
    }

    return notification;
  } catch (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

/**
 * Create notification for multiple recipients
 */
const createBulkNotifications = async (recipients, notificationData) => {
  try {
    const notifications = recipients.map((recipient) => ({
      recipientId: recipient.id,
      recipientRole: recipient.role,
      ...notificationData
    }));

    const created = await Notification.insertMany(notifications);

    // Broadcast to all recipients
    for (const recipient of recipients) {
      try {
        await broadcastNotification(recipient.id, {
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          priority: notificationData.priority || "medium"
        });
      } catch (error) {
        console.error(`Failed to broadcast to ${recipient.id}:`, error.message);
      }
    }

    return created;
  } catch (error) {
    throw new Error(`Failed to create bulk notifications: ${error.message}`);
  }
};

/**
 * Get user notifications
 */
const getUserNotifications = async (userId, filters = {}) => {
  try {
    const { isRead, type, priority, limit = 20, skip = 0 } = filters;

    const query = { recipientId: userId };
    if (isRead !== undefined) query.isRead = isRead;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate("sentBy", "name email")
        .lean(),
      Notification.countDocuments(query),
      Notification.getUnreadCount(userId)
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw new Error(`Failed to get user notifications: ${error.message}`);
  }
};

/**
 * Get notification by ID
 */
const getNotificationById = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipientId: userId
    }).populate("sentBy", "name email");

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  } catch (error) {
    throw new Error(`Failed to get notification: ${error.message}`);
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipientId: userId
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (!notification.isRead) {
      await notification.markAsRead();
    }

    return notification;
  } catch (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
};

/**
 * Mark notification as unread
 */
const markAsUnread = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipientId: userId
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.isRead) {
      await notification.markAsUnread();
    }

    return notification;
  } catch (error) {
    throw new Error(`Failed to mark notification as unread: ${error.message}`);
  }
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.markAllAsRead(userId);
    return {
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount
    };
  } catch (error) {
    throw new Error(`Failed to mark all as read: ${error.message}`);
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipientId: userId
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return {
      message: "Notification deleted successfully",
      notification
    };
  } catch (error) {
    throw new Error(`Failed to delete notification: ${error.message}`);
  }
};

/**
 * Delete all read notifications for a user
 */
const deleteAllRead = async (userId) => {
  try {
    const result = await Notification.deleteMany({
      recipientId: userId,
      isRead: true
    });

    return {
      message: "All read notifications deleted",
      deletedCount: result.deletedCount
    };
  } catch (error) {
    throw new Error(`Failed to delete read notifications: ${error.message}`);
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.getUnreadCount(userId);
    return { unreadCount: count };
  } catch (error) {
    throw new Error(`Failed to get unread count: ${error.message}`);
  }
};

/**
 * Get notification statistics for admin
 */
const getNotificationStats = async () => {
  try {
    const [
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      notificationsByPriority,
      recentNotifications
    ] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ isRead: false }),
      Notification.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 }
          }
        }
      ]),
      Notification.aggregate([
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 }
          }
        }
      ]),
      Notification.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    const byType = notificationsByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const byPriority = notificationsByPriority.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return {
      totalNotifications,
      unreadNotifications,
      readRate: totalNotifications > 0
        ? (((totalNotifications - unreadNotifications) / totalNotifications) * 100).toFixed(2)
        : 0,
      byType,
      byPriority,
      recentNotifications
    };
  } catch (error) {
    throw new Error(`Failed to get notification stats: ${error.message}`);
  }
};

/**
 * Cleanup old notifications (admin only)
 */
const cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const result = await Notification.cleanupOldNotifications(daysOld);
    return {
      message: `Notifications older than ${daysOld} days deleted`,
      deletedCount: result.deletedCount
    };
  } catch (error) {
    throw new Error(`Failed to cleanup notifications: ${error.message}`);
  }
};

/**
 * Helper: Create exam published notification
 */
const notifyExamPublished = async (examId, examTitle, studentIds) => {
  const recipients = studentIds.map((id) => ({ id, role: "student" }));

  return createBulkNotifications(recipients, {
    type: "exam_published",
    title: "New Exam Published",
    message: `A new exam "${examTitle}" has been published`,
    relatedEntity: {
      entityType: "exam",
      entityId: examId
    },
    actionUrl: `/student/exams/${examId}`,
    priority: "high"
  });
};

/**
 * Helper: Create result published notification
 */
const notifyResultPublished = async (examId, examTitle, studentId) => {
  return createNotification({
    recipientId: studentId,
    recipientRole: "student",
    type: "result_published",
    title: "Exam Result Published",
    message: `Your result for "${examTitle}" has been published`,
    relatedEntity: {
      entityType: "result",
      entityId: examId
    },
    actionUrl: `/student/exams/${examId}/result`,
    priority: "high"
  });
};

/**
 * Helper: Create system alert notification
 */
const notifySystemAlert = async (adminIds, alertTitle, alertMessage, priority = "urgent") => {
  const recipients = adminIds.map((id) => ({ id, role: "admin" }));

  return createBulkNotifications(recipients, {
    type: "system_alert",
    title: alertTitle,
    message: alertMessage,
    relatedEntity: {
      entityType: "system"
    },
    priority
  });
};

module.exports = {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  getNotificationById,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getUnreadCount,
  getNotificationStats,
  cleanupOldNotifications,
  // Helpers
  notifyExamPublished,
  notifyResultPublished,
  notifySystemAlert
};