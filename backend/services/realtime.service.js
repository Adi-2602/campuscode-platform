const { getSocketInstance } = require("../config/socket.config");
const {
  EXAM_EVENTS,
  SUBMISSION_EVENTS,
  EVALUATION_EVENTS,
  ADMIN_EVENTS,
  NOTIFICATION_EVENTS,
  CLASS_EVENTS,
  SYSTEM_EVENTS,
  ROOMS
} = require("../utils/socketEvents");

/**
 * Broadcast exam started event
 */
const broadcastExamStarted = (examId, examData) => {
  try {
    const io = getSocketInstance();

    // Broadcast to exam room
    io.to(ROOMS.exam(examId)).emit(EXAM_EVENTS.EXAM_STARTED, {
      examId,
      exam: examData,
      timestamp: new Date()
    });

    console.log(`[Realtime] Exam started broadcast: ${examId}`);
  } catch (error) {
    console.error("[Realtime] Error broadcasting exam started:", error.message);
  }
};

/**
 * Broadcast student started exam
 */
const broadcastStudentStartedExam = (examId, studentData) => {
  try {
    const io = getSocketInstance();

    // Broadcast to teachers and admins
    io.to(ROOMS.TEACHERS).emit(EXAM_EVENTS.STUDENT_STARTED_EXAM, {
      examId,
      student: {
        id: studentData._id || studentData.id,
        name: studentData.name,
        email: studentData.email,
        rollNo: studentData.rollNo
      },
      timestamp: new Date()
    });

    io.to(ROOMS.ADMINS).emit(EXAM_EVENTS.STUDENT_STARTED_EXAM, {
      examId,
      student: {
        id: studentData._id || studentData.id,
        name: studentData.name,
        email: studentData.email,
        rollNo: studentData.rollNo
      },
      timestamp: new Date()
    });

    console.log(`[Realtime] Student started exam: ${studentData.email} - Exam: ${examId}`);
  } catch (error) {
    console.error("[Realtime] Error broadcasting student started exam:", error.message);
  }
};

/**
 * Broadcast submission created
 */
const broadcastSubmissionCreated = (examId, submissionData) => {
  try {
    const io = getSocketInstance();

    // Broadcast to exam room (teachers monitoring)
    io.to(ROOMS.exam(examId)).emit(SUBMISSION_EVENTS.SUBMISSION_CREATED, {
      examId,
      submission: {
        id: submissionData._id || submissionData.id,
        studentId: submissionData.studentId,
        questionId: submissionData.questionId,
        languageId: submissionData.languageId,
        status: submissionData.status || "pending"
      },
      timestamp: new Date()
    });

    // Notify specific student
    if (submissionData.studentId) {
      io.to(ROOMS.student(submissionData.studentId)).emit(
        SUBMISSION_EVENTS.SUBMISSION_CREATED,
        {
          submissionId: submissionData._id || submissionData.id,
          status: "created",
          timestamp: new Date()
        }
      );
    }

    console.log(`[Realtime] Submission created: ${submissionData._id || submissionData.id}`);
  } catch (error) {
    console.error("[Realtime] Error broadcasting submission created:", error.message);
  }
};

/**
 * Broadcast submission evaluated
 */
const broadcastSubmissionEvaluated = (examId, submissionData) => {
  try {
    const io = getSocketInstance();

    // Broadcast to exam room
    io.to(ROOMS.exam(examId)).emit(SUBMISSION_EVENTS.SUBMISSION_EVALUATED, {
      examId,
      submission: {
        id: submissionData._id || submissionData.id,
        studentId: submissionData.studentId,
        questionId: submissionData.questionId,
        status: submissionData.status,
        passedTestCases: submissionData.passedTestCases,
        totalTestCases: submissionData.totalTestCases,
        autoMarks: submissionData.autoMarks
      },
      timestamp: new Date()
    });

    // Notify specific student
    if (submissionData.studentId) {
      io.to(ROOMS.student(submissionData.studentId)).emit(
        SUBMISSION_EVENTS.SUBMISSION_EVALUATED,
        {
          submissionId: submissionData._id || submissionData.id,
          status: submissionData.status,
          passedTestCases: submissionData.passedTestCases,
          totalTestCases: submissionData.totalTestCases,
          timestamp: new Date()
        }
      );
    }

    console.log(`[Realtime] Submission evaluated: ${submissionData._id || submissionData.id}`);
  } catch (error) {
    console.error("[Realtime] Error broadcasting submission evaluated:", error.message);
  }
};

/**
 * Broadcast exam submitted
 */
const broadcastExamSubmitted = (examId, studentData) => {
  try {
    const io = getSocketInstance();

    // Broadcast to teachers and admins
    io.to(ROOMS.TEACHERS).emit(EXAM_EVENTS.STUDENT_SUBMITTED_EXAM, {
      examId,
      student: {
        id: studentData._id || studentData.id,
        name: studentData.name,
        email: studentData.email,
        rollNo: studentData.rollNo
      },
      timestamp: new Date()
    });

    io.to(ROOMS.ADMINS).emit(EXAM_EVENTS.STUDENT_SUBMITTED_EXAM, {
      examId,
      student: {
        id: studentData._id || studentData.id,
        name: studentData.name,
        email: studentData.email,
        rollNo: studentData.rollNo
      },
      timestamp: new Date()
    });

    console.log(`[Realtime] Exam submitted: ${studentData.email} - Exam: ${examId}`);
  } catch (error) {
    console.error("[Realtime] Error broadcasting exam submitted:", error.message);
  }
};

/**
 * Broadcast live exam update (student count, etc.)
 */
const broadcastLiveExamUpdate = (examId, updateData) => {
  try {
    const io = getSocketInstance();

    io.to(ROOMS.exam(examId)).emit(EXAM_EVENTS.LIVE_EXAM_UPDATE, {
      examId,
      ...updateData,
      timestamp: new Date()
    });

    console.log(`[Realtime] Live exam update: ${examId}`);
  } catch (error) {
    console.error("[Realtime] Error broadcasting live exam update:", error.message);
  }
};

/**
 * Broadcast result published
 */
const broadcastResultPublished = (examId, studentId) => {
  try {
    const io = getSocketInstance();

    // Notify specific student
    io.to(ROOMS.student(studentId)).emit(EVALUATION_EVENTS.RESULT_PUBLISHED, {
      examId,
      message: "Your exam result has been published",
      timestamp: new Date()
    });

    console.log(`[Realtime] Result published for student: ${studentId}`);
  } catch (error) {
    console.error("[Realtime] Error broadcasting result published:", error.message);
  }
};

/**
 * Broadcast notification to user
 */
const broadcastNotification = (userId, notification) => {
  try {
    const io = getSocketInstance();

    io.to(ROOMS.student(userId))
      .to(ROOMS.teacher(userId))
      .to(ROOMS.admin(userId))
      .emit(NOTIFICATION_EVENTS.NEW_NOTIFICATION, {
        notification,
        timestamp: new Date()
      });

    console.log(`[Realtime] Notification sent to user: ${userId}`);
  } catch (error) {
    console.error("[Realtime] Error broadcasting notification:", error.message);
  }
};

/**
 * Broadcast admin action
 */
const broadcastAdminAction = (action, data) => {
  try {
    const io = getSocketInstance();

    io.to(ROOMS.ADMINS).emit(ADMIN_EVENTS.ADMIN_ACTION, {
      action,
      data,
      timestamp: new Date()
    });

    console.log(`[Realtime] Admin action broadcast: ${action}`);
  } catch (error) {
    console.error("[Realtime] Error broadcasting admin action:", error.message);
  }
};

/**
 * Broadcast system alert
 */
const broadcastSystemAlert = (alert) => {
  try {
    const io = getSocketInstance();

    // Broadcast to all admins
    io.to(ROOMS.ADMINS).emit(ADMIN_EVENTS.SYSTEM_ALERT, {
      alert,
      timestamp: new Date()
    });

    console.log(`[Realtime] System alert broadcast: ${alert.type}`);
  } catch (error) {
    console.error("[Realtime] Error broadcasting system alert:", error.message);
  }
};

/**
 * Broadcast class update
 */
const broadcastClassUpdate = (classId, updateType, data) => {
  try {
    const io = getSocketInstance();

    io.to(ROOMS.class(classId)).emit(CLASS_EVENTS.CLASS_UPDATED, {
      classId,
      updateType,
      data,
      timestamp: new Date()
    });

    console.log(`[Realtime] Class update broadcast: ${classId} - ${updateType}`);
  } catch (error) {
    console.error("[Realtime] Error broadcasting class update:", error.message);
  }
};

/**
 * Helper to get cluster-wide stats efficiently without passing huge socket objects
 */
const getClusterStats = async () => {
  try {
    const io = getSocketInstance();

    // serverSideEmit queries all *other* nodes in the PM2 cluster
    const responses = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn("[Cluster] serverSideEmit timed out waiting for some nodes");
        resolve([]);
      }, 3000);

      io.serverSideEmit("get_node_stats", (err, res) => {
        clearTimeout(timeout);
        if (err) {
          console.error("[Cluster] Error in serverSideEmit:", err);
          resolve(res || []); // Partial responses
        } else {
          resolve(res || []);
        }
      });
    });

    // Also get THIS local node's stats
    const localSocks = io.sockets.sockets;
    const localByRole = {};
    const localRoomsMap = new Map();

    for (const [id, socket] of localSocks.entries()) {
      const role = socket.user?.role || "unknown";
      localByRole[role] = (localByRole[role] || 0) + 1;

      if (socket.rooms) {
        socket.rooms.forEach(room => {
          if (room !== id && room !== "") {
            localRoomsMap.set(room, (localRoomsMap.get(room) || 0) + 1);
          }
        });
      }
    }

    const localActiveRooms = Array.from(localRoomsMap.entries()).map(([name, count]) => ({
      name,
      userCount: count
    }));

    const localStats = {
      total: localSocks.size,
      byRole: localByRole,
      activeRooms: localActiveRooms
    };

    // Aggregate everything
    const allStats = [localStats, ...responses];

    const aggregated = {
      total: 0,
      byRole: {},
      activeRooms: new Map() // roomName -> totalUserCount
    };

    allStats.forEach(nodeStat => {
      if (!nodeStat) return;

      aggregated.total += (nodeStat.total || 0);

      if (nodeStat.byRole) {
        Object.keys(nodeStat.byRole).forEach(role => {
          aggregated.byRole[role] = (aggregated.byRole[role] || 0) + nodeStat.byRole[role];
        });
      }

      if (nodeStat.activeRooms) {
        nodeStat.activeRooms.forEach(room => {
          aggregated.activeRooms.set(room.name, (aggregated.activeRooms.get(room.name) || 0) + room.userCount);
        });
      }
    });

    aggregated.activeRoomsArray = Array.from(aggregated.activeRooms.entries()).map(([name, count]) => ({
      name,
      userCount: count
    }));

    return aggregated;

  } catch (error) {
    console.error("[Cluster] getClusterStats error:", error);
    return {
      total: 0,
      byRole: {},
      activeRoomsArray: [],
      activeRooms: new Map()
    };
  }
};

/**
 * Get active connections count
 */
const getActiveConnections = async () => {
  try {
    const stats = await getClusterStats();

    return {
      total: stats.total,
      byRole: stats.byRole
    };
  } catch (error) {
    console.error("[Realtime] Error getting active connections:", error.message);
    return { total: 0, byRole: {} };
  }
};

/**
 * Get users in room
 */
const getUsersInRoom = async (roomName) => {
  try {
    const io = getSocketInstance();
    const sockets = await io.in(roomName).fetchSockets();

    return sockets.map(socket => ({
      id: socket.user?.id,
      name: socket.user?.name,
      email: socket.user?.email,
      role: socket.user?.role
    }));
  } catch (error) {
    console.error("[Realtime] Error getting users in room:", error.message);
    return [];
  }
};

module.exports = {
  broadcastExamStarted,
  broadcastStudentStartedExam,
  broadcastSubmissionCreated,
  broadcastSubmissionEvaluated,
  broadcastExamSubmitted,
  broadcastLiveExamUpdate,
  broadcastResultPublished,
  broadcastNotification,
  broadcastAdminAction,
  broadcastSystemAlert,
  broadcastClassUpdate,
  getActiveConnections,
  getUsersInRoom,
  getClusterStats
};