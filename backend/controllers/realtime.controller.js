const {
  getActiveConnections,
  getUsersInRoom
} = require("../services/realtime.service");

const { manualLog } = require("../middlewares/auditLog.middleware");
const { ROOMS } = require("../utils/socketEvents");

/**
 * Get active WebSocket connections
 * GET /admin/monitoring/realtime/connections
 * Permission: VIEW_REALTIME or Superadmin
 */
const getActiveConnectionsHandler = async (req, res) => {
  try {
    const connections = await getActiveConnections();

    await manualLog({
      user: req.user,
      req,
      action: "view_realtime_connections",
      permissionUsed: "VIEW_REALTIME",
      targetType: "system",
      metadata: {
        totalConnections: connections.total,
        byRole: connections.byRole
      },
      success: true
    });

    res.json({
      message: "Active connections retrieved successfully",
      connections
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get users in a specific exam room
 * GET /admin/monitoring/realtime/exams/:examId/users
 * Permission: VIEW_REALTIME or Superadmin
 */
const getExamRoomUsersHandler = async (req, res) => {
  try {
    const { examId } = req.params;
    const roomName = ROOMS.exam(examId);

    const users = await getUsersInRoom(roomName);

    await manualLog({
      user: req.user,
      req,
      action: "view_exam_room_users",
      permissionUsed: "VIEW_REALTIME",
      targetType: "exam",
      metadata: {
        examId,
        userCount: users.length
      },
      success: true
    });

    res.json({
      message: "Exam room users retrieved successfully",
      examId,
      roomName,
      users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get users in a specific class room
 * GET /admin/monitoring/realtime/classes/:classId/users
 * Permission: VIEW_REALTIME or Superadmin
 */
const getClassRoomUsersHandler = async (req, res) => {
  try {
    const { classId } = req.params;
    const roomName = ROOMS.class(classId);

    const users = await getUsersInRoom(roomName);

    await manualLog({
      user: req.user,
      req,
      action: "view_class_room_users",
      permissionUsed: "VIEW_REALTIME",
      targetType: "class",
      metadata: {
        classId,
        userCount: users.length
      },
      success: true
    });

    res.json({
      message: "Class room users retrieved successfully",
      classId,
      roomName,
      users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get all active rooms
 * GET /admin/monitoring/realtime/rooms
 * Permission: VIEW_REALTIME or Superadmin
 */
const getActiveRoomsHandler = async (req, res) => {
  try {
    const { getClusterStats } = require("../services/realtime.service");

    // Use the optimized cluster stats to get rooms
    const stats = await getClusterStats();

    // stats.activeRoomsArray contains { name, userCount }
    const rooms = stats.activeRoomsArray || [];

    await manualLog({
      user: req.user,
      req,
      action: "view_active_rooms",
      permissionUsed: "VIEW_REALTIME",
      targetType: "system",
      metadata: {
        totalRooms: rooms.length
      },
      success: true
    });

    res.json({
      message: "Active rooms retrieved successfully",
      rooms,
      totalRooms: rooms.length
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get WebSocket statistics
 * GET /admin/monitoring/realtime/stats
 * Permission: VIEW_REALTIME or Superadmin
 */
const getRealtimeStatsHandler = async (req, res) => {
  try {
    const { getClusterStats } = require("../services/realtime.service");

    // getClusterStats already gathers everything we need efficiently
    const clusterStats = await getClusterStats();

    // Calculate statistics
    const stats = {
      connections: {
        total: clusterStats.total,
        byRole: clusterStats.byRole
      },
      uptime: process.uptime(),
      uptimeFormatted: formatUptime(process.uptime()),
      activeRooms: (clusterStats.activeRoomsArray || []).length,
      activeSockets: clusterStats.total, // same as total connections
      byRole: clusterStats.byRole
    };

    await manualLog({
      user: req.user,
      req,
      action: "view_realtime_stats",
      permissionUsed: "VIEW_REALTIME",
      targetType: "system",
      metadata: {
        totalConnections: stats.connections.total,
        activeRooms: stats.activeRooms
      },
      success: true
    });

    res.json({
      message: "Real-time statistics retrieved successfully",
      stats
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Helper: Format uptime
 */
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
};

module.exports = {
  getActiveConnectionsHandler,
  getExamRoomUsersHandler,
  getClassRoomUsersHandler,
  getActiveRoomsHandler,
  getRealtimeStatsHandler
};