const {
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
  cleanupOldNotifications
} = require("../services/notification.service");

const { manualLog } = require("../middlewares/auditLog.middleware");

/**
 * Get current user's notifications
 * GET /notifications
 */
const getUserNotificationsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isRead, type, priority, limit, skip } = req.query;

    const filters = {
      isRead: isRead === "true" ? true : isRead === "false" ? false : undefined,
      type,
      priority,
      limit: parseInt(limit) || 20,
      skip: parseInt(skip) || 0
    };

    const result = await getUserNotifications(userId, filters);

    res.json({
      message: "Notifications retrieved successfully",
      ...result
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get single notification by ID
 * GET /notifications/:notificationId
 */
const getNotificationByIdHandler = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await getNotificationById(notificationId, userId);

    res.json({
      message: "Notification retrieved successfully",
      notification
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Get unread notification count
 * GET /notifications/unread/count
 */
const getUnreadCountHandler = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getUnreadCount(userId);

    res.json({
      message: "Unread count retrieved successfully",
      ...result
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Mark notification as read
 * PATCH /notifications/:notificationId/read
 */
const markAsReadHandler = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await markAsRead(notificationId, userId);

    res.json({
      message: "Notification marked as read",
      notification
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Mark notification as unread
 * PATCH /notifications/:notificationId/unread
 */
const markAsUnreadHandler = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await markAsUnread(notificationId, userId);

    res.json({
      message: "Notification marked as unread",
      notification
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read
 * PATCH /notifications/read-all
 */
const markAllAsReadHandler = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await markAllAsRead(userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Delete notification
 * DELETE /notifications/:notificationId
 */
const deleteNotificationHandler = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const result = await deleteNotification(notificationId, userId);

    res.json(result);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Delete all read notifications
 * DELETE /notifications/read-all
 */
const deleteAllReadHandler = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await deleteAllRead(userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Create custom notification (Admin only)
 * POST /admin/notifications/create
 * Permission: MANAGE_NOTIFICATIONS
 */
const createNotificationHandler = async (req, res) => {
  try {
    const {
      recipientId,
      recipientRole,
      type,
      title,
      message,
      relatedEntity,
      actionUrl,
      priority,
      metadata,
      expiresAt
    } = req.body;

    if (!recipientId || !recipientRole || !type || !title || !message) {
      return res.status(400).json({
        error: "Missing required fields: recipientId, recipientRole, type, title, message"
      });
    }

    const notification = await createNotification({
      recipientId,
      recipientRole,
      type,
      title,
      message,
      relatedEntity,
      actionUrl,
      priority,
      sentBy: req.user.id,
      metadata,
      expiresAt
    });

    await manualLog({
      user: req.user,
      req,
      action: "create_notification",
      permissionUsed: "MANAGE_NOTIFICATIONS",
      targetType: "notification",
      targetId: notification._id,
      metadata: {
        recipientId,
        type,
        priority
      },
      success: true
    });

    res.status(201).json({
      message: "Notification created successfully",
      notification
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Create bulk notifications (Admin only)
 * POST /admin/notifications/create-bulk
 * Permission: MANAGE_NOTIFICATIONS
 */
const createBulkNotificationsHandler = async (req, res) => {
  try {
    const { recipients, type, title, message, relatedEntity, actionUrl, priority, metadata, expiresAt } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        error: "recipients array is required and must not be empty"
      });
    }

    if (!type || !title || !message) {
      return res.status(400).json({
        error: "Missing required fields: type, title, message"
      });
    }

    const notifications = await createBulkNotifications(recipients, {
      type,
      title,
      message,
      relatedEntity,
      actionUrl,
      priority,
      sentBy: req.user.id,
      metadata,
      expiresAt
    });

    await manualLog({
      user: req.user,
      req,
      action: "create_bulk_notifications",
      permissionUsed: "MANAGE_NOTIFICATIONS",
      targetType: "notification",
      metadata: {
        recipientCount: recipients.length,
        type,
        priority
      },
      success: true
    });

    res.status(201).json({
      message: "Bulk notifications created successfully",
      count: notifications.length,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get notification statistics (Admin only)
 * GET /admin/notifications/stats
 * Permission: MANAGE_NOTIFICATIONS
 */
const getNotificationStatsHandler = async (req, res) => {
  try {
    const stats = await getNotificationStats();

    await manualLog({
      user: req.user,
      req,
      action: "view_notification_stats",
      permissionUsed: "MANAGE_NOTIFICATIONS",
      targetType: "system",
      metadata: {
        totalNotifications: stats.totalNotifications,
        unreadNotifications: stats.unreadNotifications
      },
      success: true
    });

    res.json({
      message: "Notification statistics retrieved successfully",
      stats
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Cleanup old notifications (Admin only)
 * POST /admin/notifications/cleanup
 * Permission: MANAGE_NOTIFICATIONS
 */
const cleanupOldNotificationsHandler = async (req, res) => {
  try {
    const { daysOld = 30 } = req.body;

    const result = await cleanupOldNotifications(parseInt(daysOld));

    await manualLog({
      user: req.user,
      req,
      action: "cleanup_old_notifications",
      permissionUsed: "MANAGE_NOTIFICATIONS",
      targetType: "system",
      metadata: {
        daysOld,
        deletedCount: result.deletedCount
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  // User endpoints
  getUserNotificationsHandler,
  getNotificationByIdHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAsUnreadHandler,
  markAllAsReadHandler,
  deleteNotificationHandler,
  deleteAllReadHandler,
  
  // Admin endpoints
  createNotificationHandler,
  createBulkNotificationsHandler,
  getNotificationStatsHandler,
  cleanupOldNotificationsHandler
};