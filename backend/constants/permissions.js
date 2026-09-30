/**
 * System-wide permission constants for feature-based access control
 * These permissions control what admins can see and do in the system
 */

const PERMISSIONS = {
  // Class Management
  VIEW_CLASSES: "VIEW_CLASSES",
  MANAGE_CLASSES: "MANAGE_CLASSES",

  // Student Management
  VIEW_STUDENTS: "VIEW_STUDENTS",
  MANAGE_STUDENTS: "MANAGE_STUDENTS",

  // Teacher Management
  VIEW_TEACHERS: "VIEW_TEACHERS",
  VERIFY_TEACHERS: "VERIFY_TEACHERS",

  // Exam Monitoring
  VIEW_LIVE_EXAMS: "VIEW_LIVE_EXAMS",
  VIEW_EXAM_DETAILS: "VIEW_EXAM_DETAILS",

  // Code & Logs
  VIEW_CODE_LOGS: "VIEW_CODE_LOGS",
  VIEW_COMPILER_LOGS: "VIEW_COMPILER_LOGS",
  VIEW_SUBMISSION_LOGS: "VIEW_SUBMISSION_LOGS",

  // User Management
  MANAGE_USERS: "MANAGE_USERS",
  VIEW_USER_ACTIVITY: "VIEW_USER_ACTIVITY",

  // 🔥 PHASE 2: Advanced Monitoring Permissions
  VIEW_DB: "VIEW_DB",
  EXPORT_DATA: "EXPORT_DATA",
  VIEW_INFRA: "VIEW_INFRA",
  VIEW_SERVER_LOGS: "VIEW_SERVER_LOGS",
  RESTART_SERVICES: "RESTART_SERVICES",

  // 🔥 PHASE 3: Real-Time & Analytics Permissions
  VIEW_REALTIME: "VIEW_REALTIME",
  VIEW_ANALYTICS: "VIEW_ANALYTICS",
  GENERATE_REPORTS: "GENERATE_REPORTS",
  MANAGE_NOTIFICATIONS: "MANAGE_NOTIFICATIONS",

  // Admin Management (Superadmin only)
  CREATE_ADMIN: "CREATE_ADMIN",
  MANAGE_ADMIN_PERMISSIONS: "MANAGE_ADMIN_PERMISSIONS",
  VIEW_AUDIT_LOGS: "VIEW_AUDIT_LOGS"
};

/**
 * Permissions that ONLY superadmin can have
 * These are never assignable to regular admins
 */
const SUPERADMIN_ONLY_PERMISSIONS = [
  PERMISSIONS.CREATE_ADMIN,
  PERMISSIONS.MANAGE_ADMIN_PERMISSIONS,
  PERMISSIONS.VIEW_AUDIT_LOGS
];

/**
 * Permissions available for assignment to regular admins
 */
const ASSIGNABLE_PERMISSIONS = Object.values(PERMISSIONS).filter(
  (perm) => !SUPERADMIN_ONLY_PERMISSIONS.includes(perm)
);

/**
 * Permission descriptions for UI display
 */
const PERMISSION_DESCRIPTIONS = {
  [PERMISSIONS.VIEW_CLASSES]: "View all classes in the system",
  [PERMISSIONS.MANAGE_CLASSES]: "Create, edit, and delete classes",
  [PERMISSIONS.VIEW_STUDENTS]: "View student information and profiles",
  [PERMISSIONS.MANAGE_STUDENTS]: "Edit student accounts and data",
  [PERMISSIONS.VIEW_TEACHERS]: "View teacher information and profiles",
  [PERMISSIONS.VERIFY_TEACHERS]: "Verify and approve teacher accounts",
  [PERMISSIONS.VIEW_LIVE_EXAMS]: "Monitor ongoing exams in real-time",
  [PERMISSIONS.VIEW_EXAM_DETAILS]: "View detailed exam information and results",
  [PERMISSIONS.VIEW_CODE_LOGS]: "View student code submission logs",
  [PERMISSIONS.VIEW_COMPILER_LOGS]: "View compiler execution logs",
  [PERMISSIONS.VIEW_SUBMISSION_LOGS]: "View all submission history",
  [PERMISSIONS.MANAGE_USERS]: "Manage user accounts",
  [PERMISSIONS.VIEW_USER_ACTIVITY]: "View user activity logs",
  
  // 🔥 PHASE 2: Advanced Monitoring Descriptions
  [PERMISSIONS.VIEW_DB]: "Access database explorer and browse collections",
  [PERMISSIONS.EXPORT_DATA]: "Export system data as CSV/JSON files",
  [PERMISSIONS.VIEW_INFRA]: "View infrastructure metrics (CPU, memory, disk)",
  [PERMISSIONS.VIEW_SERVER_LOGS]: "View application and error logs",
  [PERMISSIONS.RESTART_SERVICES]: "Restart system services and clear cache",
  
  // 🔥 PHASE 3: Real-Time & Analytics Descriptions
  [PERMISSIONS.VIEW_REALTIME]: "Monitor real-time WebSocket connections and events",
  [PERMISSIONS.VIEW_ANALYTICS]: "Access analytics dashboard and performance metrics",
  [PERMISSIONS.GENERATE_REPORTS]: "Generate and download custom reports",
  [PERMISSIONS.MANAGE_NOTIFICATIONS]: "Manage notification settings and delivery",
  
  [PERMISSIONS.CREATE_ADMIN]: "Create new admin accounts (Superadmin only)",
  [PERMISSIONS.MANAGE_ADMIN_PERMISSIONS]:
    "Manage admin permissions (Superadmin only)",
  [PERMISSIONS.VIEW_AUDIT_LOGS]: "View full audit logs (Superadmin only)"
};

/**
 * Permission categories for UI organization
 */
const PERMISSION_CATEGORIES = {
  CLASS_MANAGEMENT: {
    label: "Class Management",
    permissions: [PERMISSIONS.VIEW_CLASSES, PERMISSIONS.MANAGE_CLASSES]
  },
  STUDENT_MANAGEMENT: {
    label: "Student Management",
    permissions: [PERMISSIONS.VIEW_STUDENTS, PERMISSIONS.MANAGE_STUDENTS]
  },
  TEACHER_MANAGEMENT: {
    label: "Teacher Management",
    permissions: [PERMISSIONS.VIEW_TEACHERS, PERMISSIONS.VERIFY_TEACHERS]
  },
  EXAM_MONITORING: {
    label: "Exam Monitoring",
    permissions: [PERMISSIONS.VIEW_LIVE_EXAMS, PERMISSIONS.VIEW_EXAM_DETAILS]
  },
  LOGS_AND_CODE: {
    label: "Logs & Code",
    permissions: [
      PERMISSIONS.VIEW_CODE_LOGS,
      PERMISSIONS.VIEW_COMPILER_LOGS,
      PERMISSIONS.VIEW_SUBMISSION_LOGS
    ]
  },
  USER_MANAGEMENT: {
    label: "User Management",
    permissions: [PERMISSIONS.MANAGE_USERS, PERMISSIONS.VIEW_USER_ACTIVITY]
  },
  // 🔥 PHASE 2: Advanced Monitoring Category
  ADVANCED_MONITORING: {
    label: "Advanced Monitoring",
    permissions: [
      PERMISSIONS.VIEW_DB,
      PERMISSIONS.EXPORT_DATA,
      PERMISSIONS.VIEW_INFRA,
      PERMISSIONS.VIEW_SERVER_LOGS,
      PERMISSIONS.RESTART_SERVICES
    ]
  },
  // 🔥 PHASE 3: Real-Time & Analytics Category
  REALTIME_ANALYTICS: {
    label: "Real-Time & Analytics",
    permissions: [
      PERMISSIONS.VIEW_REALTIME,
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.GENERATE_REPORTS,
      PERMISSIONS.MANAGE_NOTIFICATIONS
    ]
  }
};

module.exports = {
  PERMISSIONS,
  SUPERADMIN_ONLY_PERMISSIONS,
  ASSIGNABLE_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  PERMISSION_CATEGORIES
};