/**
 * Socket.IO Event Constants
 * Centralized event names for real-time communication
 */

// Connection Events
const CONNECTION_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",
  RECONNECT: "reconnect"
};

// Authentication Events
const AUTH_EVENTS = {
  AUTHENTICATE: "authenticate",
  AUTHENTICATED: "authenticated",
  UNAUTHORIZED: "unauthorized"
};

// Exam Events (Real-time exam monitoring)
const EXAM_EVENTS = {
  // Student events
  STUDENT_STARTED_EXAM: "student:started_exam",
  STUDENT_SUBMITTED_CODE: "student:submitted_code",
  STUDENT_SUBMITTED_EXAM: "student:submitted_exam",
  STUDENT_LEFT_EXAM: "student:left_exam",
  
  // Teacher events
  EXAM_PUBLISHED: "exam:published",
  EXAM_STARTED: "exam:started",
  EXAM_ENDED: "exam:ended",
  EXAM_UPDATED: "exam:updated",
  
  // Real-time updates
  LIVE_EXAM_UPDATE: "exam:live_update",
  SUBMISSION_UPDATE: "exam:submission_update",
  STUDENT_COUNT_UPDATE: "exam:student_count_update"
};

// Submission Events (Code execution updates)
const SUBMISSION_EVENTS = {
  SUBMISSION_CREATED: "submission:created",
  SUBMISSION_EVALUATING: "submission:evaluating",
  SUBMISSION_EVALUATED: "submission:evaluated",
  SUBMISSION_FAILED: "submission:failed",
  COMPILATION_ERROR: "submission:compilation_error"
};

// Evaluation Events (Auto & Manual)
const EVALUATION_EVENTS = {
  AUTO_EVAL_STARTED: "evaluation:auto_started",
  AUTO_EVAL_COMPLETED: "evaluation:auto_completed",
  MANUAL_EVAL_SUBMITTED: "evaluation:manual_submitted",
  RESULT_PUBLISHED: "evaluation:result_published"
};

// Admin Events (System monitoring)
const ADMIN_EVENTS = {
  ADMIN_LOGGED_IN: "admin:logged_in",
  ADMIN_ACTION: "admin:action",
  SYSTEM_ALERT: "admin:system_alert",
  PERMISSION_UPDATED: "admin:permission_updated"
};

// Notification Events
const NOTIFICATION_EVENTS = {
  NEW_NOTIFICATION: "notification:new",
  NOTIFICATION_READ: "notification:read",
  NOTIFICATION_DELETED: "notification:deleted"
};

// Class Events
const CLASS_EVENTS = {
  STUDENT_JOINED_CLASS: "class:student_joined",
  STUDENT_LEFT_CLASS: "class:student_left",
  CLASS_UPDATED: "class:updated",
  CLASS_LOCKED: "class:locked"
};

// System Events
const SYSTEM_EVENTS = {
  SERVER_RESTART: "system:restart",
  DATABASE_RECONNECT: "system:db_reconnect",
  MAINTENANCE_MODE: "system:maintenance"
};

// Room naming conventions
const ROOMS = {
  // Global rooms
  ADMINS: "room:admins",
  TEACHERS: "room:teachers",
  STUDENTS: "room:students",
  
  // Specific rooms (use functions)
  exam: (examId) => `room:exam:${examId}`,
  class: (classId) => `room:class:${classId}`,
  student: (studentId) => `room:student:${studentId}`,
  teacher: (teacherId) => `room:teacher:${teacherId}`,
  admin: (adminId) => `room:admin:${adminId}`
};

// Export all events
module.exports = {
  CONNECTION_EVENTS,
  AUTH_EVENTS,
  EXAM_EVENTS,
  SUBMISSION_EVENTS,
  EVALUATION_EVENTS,
  ADMIN_EVENTS,
  NOTIFICATION_EVENTS,
  CLASS_EVENTS,
  SYSTEM_EVENTS,
  ROOMS
};