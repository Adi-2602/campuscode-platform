const express = require("express");

const {
  getUserNotificationsHandler,
  getNotificationByIdHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAsUnreadHandler,
  markAllAsReadHandler,
  deleteNotificationHandler,
  deleteAllReadHandler,
  createNotificationHandler,
  createBulkNotificationsHandler,
  getNotificationStatsHandler,
  cleanupOldNotificationsHandler
} = require("../controllers/notification.controller");

const { authenticate } = require("../middlewares/auth.middleware");
const {
  requirePermission,
  requireAdminRole
} = require("../middlewares/permission.middleware");

const { PERMISSIONS } = require("../constants/permissions");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notification management
 */

/**
 * @swagger
 * tags:
 *   name: Phase 3 - Notifications (Admin)
 *   description: Admin notification management (MANAGE_NOTIFICATIONS)
 */

/* =====================
   USER NOTIFICATION ROUTES
   (All authenticated users)
===================== */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get current user's notifications
 *     description: Retrieve all notifications for the authenticated user with filters
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notification type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, getUserNotificationsHandler);

/**
 * @swagger
 * /notifications/unread/count:
 *   get:
 *     summary: Get unread notification count
 *     description: Get the count of unread notifications for current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 */
router.get("/unread/count", authenticate, getUnreadCountHandler);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   get:
 *     summary: Get single notification
 *     description: Get a specific notification by ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification retrieved successfully
 *       404:
 *         description: Notification not found
 */
router.get("/:notificationId", authenticate, getNotificationByIdHandler);

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch("/:notificationId/read", authenticate, markAsReadHandler);

/**
 * @swagger
 * /notifications/{notificationId}/unread:
 *   patch:
 *     summary: Mark notification as unread
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as unread
 */
router.patch("/:notificationId/unread", authenticate, markAsUnreadHandler);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch("/read-all", authenticate, markAllAsReadHandler);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 */
router.delete("/:notificationId", authenticate, deleteNotificationHandler);

/**
 * @swagger
 * /notifications/read-all:
 *   delete:
 *     summary: Delete all read notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All read notifications deleted
 */
router.delete("/read-all", authenticate, deleteAllReadHandler);

/* =====================
   ADMIN NOTIFICATION ROUTES
   (MANAGE_NOTIFICATIONS permission)
===================== */

/**
 * @swagger
 * /admin/monitoring/notifications/create:
 *   post:
 *     summary: Create custom notification
 *     description: Admin creates a custom notification for a specific user
 *     tags: [Phase 3 - Notifications (Admin)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - recipientRole
 *               - type
 *               - title
 *               - message
 *             properties:
 *               recipientId:
 *                 type: string
 *               recipientRole:
 *                 type: string
 *                 enum: [student, teacher, admin, superadmin]
 *               type:
 *                 type: string
 *                 enum: [exam_published, exam_started, exam_ended, result_published, submission_evaluated, class_update, system_alert, custom, permission_updated, admin_action]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               actionUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       403:
 *         description: Permission denied (requires MANAGE_NOTIFICATIONS)
 */
router.post(
  "/admin/create",
  authenticate,
  requireAdminRole(),
  requirePermission(PERMISSIONS.MANAGE_NOTIFICATIONS),
  createNotificationHandler
);

/**
 * @swagger
 * /admin/monitoring/notifications/create-bulk:
 *   post:
 *     summary: Create bulk notifications
 *     description: Admin creates notifications for multiple users at once
 *     tags: [Phase 3 - Notifications (Admin)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipients
 *               - type
 *               - title
 *               - message
 *             properties:
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     role:
 *                       type: string
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               priority:
 *                 type: string
 *     responses:
 *       201:
 *         description: Bulk notifications created successfully
 */
router.post(
  "/admin/create-bulk",
  authenticate,
  requireAdminRole(),
  requirePermission(PERMISSIONS.MANAGE_NOTIFICATIONS),
  createBulkNotificationsHandler
);

/**
 * @swagger
 * /admin/monitoring/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     description: View notification statistics (total, unread, by type, by priority)
 *     tags: [Phase 3 - Notifications (Admin)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics retrieved successfully
 */
router.get(
  "/admin/stats",
  authenticate,
  requireAdminRole(),
  requirePermission(PERMISSIONS.MANAGE_NOTIFICATIONS),
  getNotificationStatsHandler
);

/**
 * @swagger
 * /admin/monitoring/notifications/cleanup:
 *   post:
 *     summary: Cleanup old notifications
 *     description: Delete old read notifications (default 30 days)
 *     tags: [Phase 3 - Notifications (Admin)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysOld:
 *                 type: integer
 *                 default: 30
 *     responses:
 *       200:
 *         description: Old notifications cleaned up successfully
 */
router.post(
  "/admin/cleanup",
  authenticate,
  requireAdminRole(),
  requirePermission(PERMISSIONS.MANAGE_NOTIFICATIONS),
  cleanupOldNotificationsHandler
);

module.exports = router;