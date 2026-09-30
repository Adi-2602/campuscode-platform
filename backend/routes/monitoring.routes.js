const express = require("express");

// Phase 1 Controllers
const {
  getAllClassesHandler,
  getClassDetailsHandler,
  getAllStudentsHandler,
  getStudentDetailsHandler,
  getAllTeachersHandler,
  getTeacherDetailsHandler,
  getLiveExamsHandler,
  getExamDetailsHandler,
  getAllSubmissionsHandler,
  getCompilerLogsHandler,
  getUserActivityHandler,
  getSystemStatsHandler,
  updateUserHandler
} = require("../controllers/monitoring.controller");

const {
  getActiveConnectionsHandler,
  getExamRoomUsersHandler,
  getClassRoomUsersHandler,
  getActiveRoomsHandler,
  getRealtimeStatsHandler
} = require("../controllers/realtime.controller");

const {
  createAdminHandler,
  getAllAdminsHandler,
  getAdminByIdHandler,
  updateAdminPermissionsHandler,
  addPermissionsHandler,
  removePermissionsHandler,
  deleteAdminHandler,
  toggleAdminStatusHandler,
  getAdminActivityLogsHandler,
  getAllAuditLogsHandler,
  getAdminStatsHandler,
  getAvailablePermissionsHandler
} = require("../controllers/adminManagement.controller");

// 🔥 Phase 2 Controllers - Database Explorer
const {
  getAllCollectionsHandler,
  getCollectionDocumentsHandler,
  getDocumentByIdHandler,
  searchDocumentsHandler,
  getCollectionStatsHandler,
  getDatabaseStatsHandler,
  getCollectionIndexesHandler,
  countByFieldHandler
} = require("../controllers/databaseExplorer.controller");

// 🔥 Phase 2 Controllers - Data Export
const {
  exportStudentsHandler,
  exportTeachersHandler,
  exportClassesHandler,
  exportExamsHandler,
  exportSubmissionsHandler,
  exportAuditLogsHandler,
  exportResultsHandler
} = require("../controllers/dataExport.controller");

// 🔥 Phase 2 Controllers - Infrastructure
const {
  getSystemInfoHandler,
  getCPUUsageHandler,
  getMemoryUsageHandler,
  getDiskUsageHandler,
  getNetworkInfoHandler,
  getProcessInfoHandler,
  getDatabaseInfoHandler,
  getAllMetricsHandler,
  getHealthStatusHandler
} = require("../controllers/infrastructure.controller");

// 🔥 Phase 2 Controllers - Server Logs
const {
  getLogFilesHandler,
  readLogFileHandler,
  searchLogsHandler,
  getAppLogsHandler,
  getErrorLogsHandler,
  getAccessLogsHandler,
  getParsedLogsHandler,
  getLogStatsHandler,
  clearLogFileHandler
} = require("../controllers/serverLogs.controller");

// 🔥 Phase 2 Controllers - Service Control
const {
  restartApplicationHandler,
  clearCacheHandler,
  clearDatabaseConnectionsHandler,
  runGarbageCollectionHandler,
  getServiceStatusHandler,
  healthCheckAndRecoverHandler,
  getPM2ProcessListHandler,
  restartPM2ProcessHandler,
  performMaintenanceHandler
} = require("../controllers/serviceControl.controller");

const { authenticate } = require("../middlewares/auth.middleware");
const {
  requirePermission,
  requireSuperAdmin,
  requireAdminRole
} = require("../middlewares/permission.middleware");

const { PERMISSIONS } = require("../constants/permissions");

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdminRole());

/**
 * @swagger
 * tags:
 *   - name: Admin Management
 *     description: Admin account management (Superadmin only)
 *   - name: Phase 1 Monitoring
 *     description: Basic monitoring (classes, students, teachers, exams)
 *   - name: Phase 2 - Database Explorer
 *     description: Database viewing and exploration (VIEW_DB)
 *   - name: Phase 2 - Data Export
 *     description: Export system data as JSON/CSV (EXPORT_DATA)
 *   - name: Phase 2 - Infrastructure
 *     description: System metrics and monitoring (VIEW_INFRA)
 *   - name: Phase 2 - Server Logs
 *     description: Application and error logs (VIEW_SERVER_LOGS)
 *   - name: Phase 2 - Service Control
 *     description: Restart services and maintenance (RESTART_SERVICES)
 */

/* =====================
   SUPERADMIN ONLY ROUTES
   (Admin Management)
===================== */

/**
 * @swagger
 * /admin/monitoring/admins/create:
 *   post:
 *     summary: Create new admin
 *     description: Create a new admin user with specified permissions (Superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Admin"
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Permission denied (Superadmin only)
 */
router.post("/admins/create", requireSuperAdmin(), createAdminHandler);

/**
 * @swagger
 * /admin/monitoring/admins:
 *   get:
 *     summary: Get all admins
 *     description: Retrieve list of all admin users (Superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of admins retrieved successfully
 *       403:
 *         description: Permission denied (Superadmin only)
 */
router.get("/admins", requireSuperAdmin(), getAllAdminsHandler);

/**
 * @swagger
 * /admin/monitoring/admins/stats:
 *   get:
 *     summary: Get admin statistics
 *     description: Get statistical overview of admin accounts (Superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin statistics retrieved successfully
 *       403:
 *         description: Permission denied (Superadmin only)
 */
router.get("/admins/stats", requireSuperAdmin(), getAdminStatsHandler);

/**
 * @swagger
 * /admin/monitoring/admins/{adminId}:
 *   get:
 *     summary: Get admin by ID
 *     description: Retrieve detailed information about a specific admin (Superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *     responses:
 *       200:
 *         description: Admin details retrieved successfully
 *       404:
 *         description: Admin not found
 *       403:
 *         description: Permission denied (Superadmin only)
 */
router.get("/admins/:adminId", requireSuperAdmin(), getAdminByIdHandler);

/**
 * @swagger
 * /admin/monitoring/admins/{adminId}/permissions:
 *   patch:
 *     summary: Update admin permissions
 *     description: Replace all permissions for an admin user (Superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["VIEW_CLASSES", "VIEW_STUDENTS", "VIEW_DB"]
 *     responses:
 *       200:
 *         description: Permissions updated successfully
 *       400:
 *         description: Invalid permissions
 *       403:
 *         description: Permission denied (Superadmin only)
 *       404:
 *         description: Admin not found
 */
router.patch("/admins/:adminId/permissions", requireSuperAdmin(), updateAdminPermissionsHandler);

/**
 * @swagger
 * /admin/monitoring/admins/{adminId}/permissions/add:
 *   post:
 *     summary: Add permissions to admin
 *     description: Add specific permissions to an admin user (Superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["VIEW_INFRA", "EXPORT_DATA"]
 *     responses:
 *       200:
 *         description: Permissions added successfully
 *       400:
 *         description: Invalid permissions
 *       403:
 *         description: Permission denied (Superadmin only)
 *       404:
 *         description: Admin not found
 */
router.post("/admins/:adminId/permissions/add", requireSuperAdmin(), addPermissionsHandler);

/**
 * @swagger
 * /admin/monitoring/admins/{adminId}/permissions/remove:
 *   post:
 *     summary: Remove permissions from admin
 *     description: Remove specific permissions from an admin user (Superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["VIEW_COMPILER_LOGS"]
 *     responses:
 *       200:
 *         description: Permissions removed successfully
 *       400:
 *         description: Invalid permissions
 *       403:
 *         description: Permission denied (Superadmin only)
 *       404:
 *         description: Admin not found
 */
router.post("/admins/:adminId/permissions/remove", requireSuperAdmin(), removePermissionsHandler);
/**
 * @swagger
 * /admin/monitoring/admins/{adminId}/permissions:
 *   put:
 *     summary: Update admin permissions
 *     description: Update permissions for a specific admin (Superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permissions updated successfully
 */
router.put("/admins/:adminId/permissions", requireAdminRole("superadmin"), updateAdminPermissionsHandler);
/**
 * @swagger
 * /admin/monitoring/admins/{adminId}:
 *   delete:
 *     summary: Delete admin
 *     description: Delete an admin user account (Superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID to delete
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *       400:
 *         description: Cannot delete yourself or invalid admin
 *       403:
 *         description: Permission denied (Superadmin only)
 *       404:
 *         description: Admin not found
 */
router.delete("/admins/:adminId", requireSuperAdmin(), deleteAdminHandler);

/**
 * @swagger
 * /admin/monitoring/admins/{adminId}/status:
 *   patch:
 *     summary: Toggle admin status (active/blocked)
 *     description: Activate or block an admin user (Superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *     responses:
 *       200:
 *         description: Admin status toggled successfully
 *       400:
 *         description: Cannot modify your own status
 *       403:
 *         description: Permission denied (Superadmin only)
 *       404:
 *         description: Admin not found
 */
router.patch("/admins/:adminId/status", requireSuperAdmin(), toggleAdminStatusHandler);

/**
 * @swagger
 * /admin/monitoring/admins/{adminId}/logs:
 *   get:
 *     summary: Get admin activity logs
 *     description: Retrieve activity logs for a specific admin (Superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
 *       403:
 *         description: Permission denied (Superadmin only)
 *       404:
 *         description: Admin not found
 */
router.get("/admins/:adminId/logs", requireSuperAdmin(), getAdminActivityLogsHandler);

// ... (previous routes)

/**
 * @swagger
 * /admin/monitoring/users/{userId}:
 *   patch:
 *     summary: Update user details
 *     description: Update specific fields of a user (student/teacher)
 *     tags: [Phase 1 Monitoring]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               rollNo:
 *                 type: string
 *               semester:
 *                 type: number
 *               batch:
 *                 type: number
 *               section:
 *                 type: string
 *               group:
 *                 type: number
 *     responses:
 *       200:
 *         description: User updated
 */
router.patch("/users/:userId", updateUserHandler);

/**
 * @swagger
 * /admin/monitoring/audit-logs:
 *   get:
 *     summary: Get all audit logs
 *     description: Retrieve system-wide audit logs with filters (Superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: actorId
 *         schema:
 *           type: string
 *         description: Filter by user who performed action
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: permissionUsed
 *         schema:
 *           type: string
 *         description: Filter by permission used
 *       - in: query
 *         name: targetType
 *         schema:
 *           type: string
 *         description: Filter by target type (e.g., 'student', 'admin', 'system')
 *       - in: query
 *         name: success
 *         schema:
 *           type: boolean
 *         description: Filter by success status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs until this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       403:
 *         description: Permission denied (Superadmin only)
 */
router.get("/audit-logs", requireSuperAdmin(), getAllAuditLogsHandler);

// /**
//  * @swagger
//  * /admin/monitoring/audit-logs/admin/{adminId}:
//  *   get:
//  *     summary: Get audit logs by admin
//  *     description: Get all audit logs for a specific admin
//  *     tags: [Admin Management]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: adminId
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *       - in: query
//  *         name: skip
//  *         schema:
//  *           type: integer
//  *     responses:
//  *       200:
//  *         description: Audit logs retrieved successfully
//  */
// router.get("/audit-logs/admin/:adminId", requireAdminRole("superadmin"), getAuditLogsByAdminHandler);
/**
 * @swagger
 * /admin/monitoring/permissions:
 *   get:
 *     summary: Get available permissions
 *     description: Retrieve list of all available permissions (Superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions list retrieved successfully
 *       403:
 *         description: Permission denied (Superadmin only)
 */
router.get("/permissions", requireSuperAdmin(), getAvailablePermissionsHandler);

/* =====================
   PHASE 1: MONITORING ROUTES
===================== */

/**
 * @swagger
 * /admin/monitoring/stats:
 *   get:
 *     summary: Get system statistics
 *     description: Get overview statistics for the entire system
 *     tags: [Phase 1 Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
 *       403:
 *         description: Permission denied
 */
router.get("/stats", requirePermission(PERMISSIONS.VIEW_CLASSES), getSystemStatsHandler);

/**
 * @swagger
 * /admin/monitoring/classes:
 *   get:
 *     summary: View all classes
 *     description: Retrieve list of all classes with optional filters
 *     tags: [Phase 1 Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *         description: Filter by teacher ID
 *       - in: query
 *         name: isLocked
 *         schema:
 *           type: boolean
 *         description: Filter by lock status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by class name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: JSON sort object (e.g., {"createdAt":-1})
 *     responses:
 *       200:
 *         description: Classes list retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_CLASSES)
 */
router.get("/classes", requirePermission(PERMISSIONS.VIEW_CLASSES), getAllClassesHandler);

/**
 * @swagger
 * /admin/monitoring/classes/{classId}:
 *   get:
 *     summary: Get class details
 *     description: Retrieve detailed information about a specific class
 *     tags: [Phase 1 Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class details retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_CLASSES)
 *       404:
 *         description: Class not found
 */
router.get("/classes/:classId", requirePermission(PERMISSIONS.VIEW_CLASSES), getClassDetailsHandler);

/**
 * @swagger
 * /admin/monitoring/students:
 *   get:
 *     summary: Get all students
 *     description: Retrieve list of all students with optional filters
 *     tags: [Phase 1 Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or roll number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: JSON sort object (e.g., {"createdAt":-1})
 *     responses:
 *       200:
 *         description: Students list retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_STUDENTS)
 */
router.get("/students", requirePermission(PERMISSIONS.VIEW_STUDENTS), getAllStudentsHandler);

/**
 * @swagger
 * /admin/monitoring/students/{studentId}:
 *   get:
 *     summary: Get student details
 *     description: Retrieve detailed information about a specific student
 *     tags: [Phase 1 Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student details retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_STUDENTS)
 *       404:
 *         description: Student not found
 */
router.get("/students/:studentId", requirePermission(PERMISSIONS.VIEW_STUDENTS), getStudentDetailsHandler);

/**
 * @swagger
 * /admin/monitoring/teachers:
 *   get:
 *     summary: Get all teachers
 *     description: Retrieve list of all teachers with optional filters
 *     tags: [Phase 1 Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: JSON sort object (e.g., {"createdAt":-1})
 *     responses:
 *       200:
 *         description: Teachers list retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_TEACHERS)
 */
router.get("/teachers", requirePermission(PERMISSIONS.VIEW_TEACHERS), getAllTeachersHandler);

/**
 * @swagger
 * /admin/monitoring/teachers/{teacherId}:
 *   get:
 *     summary: Get teacher details
 *     description: Retrieve detailed information about a specific teacher
 *     tags: [Phase 1 Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
 *     responses:
 *       200:
 *         description: Teacher details retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_TEACHERS)
 *       404:
 *         description: Teacher not found
 */
router.get("/teachers/:teacherId", requirePermission(PERMISSIONS.VIEW_TEACHERS), getTeacherDetailsHandler);

/**
 * @swagger
 * /admin/monitoring/live-exams:
 *   get:
 *     summary: Get live/ongoing exams
 *     description: Retrieve list of currently ongoing exams
 *     tags: [Phase 1 Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Live exams list retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_LIVE_EXAMS)
 */
router.get("/live-exams", requirePermission(PERMISSIONS.VIEW_LIVE_EXAMS), getLiveExamsHandler);

/**
 * @swagger
 * /admin/monitoring/exams/{examId}:
 *   get:
 *     summary: Get exam details
 *     description: Retrieve detailed information about a specific exam
 *     tags: [Phase 1 Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     responses:
 *       200:
 *         description: Exam details retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_EXAM_DETAILS)
 *       404:
 *         description: Exam not found
 */
router.get("/exams/:examId", requirePermission(PERMISSIONS.VIEW_EXAM_DETAILS), getExamDetailsHandler);

/**
 * @swagger
 * /admin/monitoring/submissions:
 *   get:
 *     summary: Get all code submissions
 *     description: Retrieve list of all code submissions with optional filters
 *     tags: [Phase 1 Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *         description: Filter by student ID
 *       - in: query
 *         name: examId
 *         schema:
 *           type: string
 *         description: Filter by exam ID
 *       - in: query
 *         name: questionId
 *         schema:
 *           type: string
 *         description: Filter by question ID
 *       - in: query
 *         name: languageId
 *         schema:
 *           type: integer
 *         description: Filter by programming language ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter submissions from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter submissions until this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: JSON sort object (e.g., {"createdAt":-1})
 *     responses:
 *       200:
 *         description: Submissions list retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_CODE_LOGS)
 */
router.get("/submissions", requirePermission(PERMISSIONS.VIEW_CODE_LOGS), getAllSubmissionsHandler);

/**
 * @swagger
 * /admin/monitoring/compiler-logs:
 *   get:
 *     summary: Get compiler/execution logs
 *     description: Retrieve compiler execution logs with optional filters
 *     tags: [Phase 1 Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: languageId
 *         schema:
 *           type: integer
 *         description: Filter by programming language ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by execution status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs until this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Compiler logs retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_COMPILER_LOGS)
 */
router.get("/compiler-logs", requirePermission(PERMISSIONS.VIEW_COMPILER_LOGS), getCompilerLogsHandler);

/**
 * @swagger
 * /admin/monitoring/user-activity:
 *   get:
 *     summary: Get user activity logs
 *     description: Retrieve user activity logs with optional filters
 *     tags: [Phase 1 Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by user role
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs until this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: User activity logs retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_USER_ACTIVITY)
 */
router.get("/user-activity", requirePermission(PERMISSIONS.VIEW_USER_ACTIVITY), getUserActivityHandler);

/* =====================
   🔥 PHASE 2: DATABASE EXPLORER ROUTES
===================== */

/**
 * @swagger
 * /admin/monitoring/database/stats:
 *   get:
 *     summary: Get database statistics
 *     description: View overall database statistics (collections, size, documents)
 *     tags: [Phase 2 - Database Explorer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database statistics
 *       403:
 *         description: Permission denied (requires VIEW_DB)
 */
router.get("/database/stats", requirePermission(PERMISSIONS.VIEW_DB), getDatabaseStatsHandler);

/**
 * @swagger
 * /admin/monitoring/database/collections:
 *   get:
 *     summary: Get all collections
 *     description: List all collections in the database with document counts
 *     tags: [Phase 2 - Database Explorer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Collections list retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_DB)
 */
router.get("/database/collections", requirePermission(PERMISSIONS.VIEW_DB), getAllCollectionsHandler);

/**
 * @swagger
 * /admin/monitoring/database/collections/{collectionName}/documents:
 *   get:
 *     summary: Get documents from collection
 *     description: View documents in a specific collection with pagination
 *     tags: [Phase 2 - Database Explorer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection name (e.g., users, classes, exams)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: JSON sort object (e.g., {"createdAt":-1})
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_DB)
 *       404:
 *         description: Collection not found
 */
router.get("/database/collections/:collectionName/documents", requirePermission(PERMISSIONS.VIEW_DB), getCollectionDocumentsHandler);

/**
 * @swagger
 * /admin/monitoring/database/collections/{collectionName}/documents/{documentId}:
 *   get:
 *     summary: Get single document by ID
 *     description: View detailed information of a specific document
 *     tags: [Phase 2 - Database Explorer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection name
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID (MongoDB ObjectId or custom ID)
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_DB)
 *       404:
 *         description: Document or collection not found
 */
router.get("/database/collections/:collectionName/documents/:documentId", requirePermission(PERMISSIONS.VIEW_DB), getDocumentByIdHandler);

/**
 * @swagger
 * /admin/monitoring/database/collections/{collectionName}/search:
 *   get:
 *     summary: Search documents in a collection
 *     description: Search for documents by name, email, title, or description
 *     tags: [Phase 2 - Database Explorer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection name
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Query parameter is required
 *       403:
 *         description: Permission denied (requires VIEW_DB)
 *       404:
 *         description: Collection not found
 */
router.get("/database/collections/:collectionName/search", requirePermission(PERMISSIONS.VIEW_DB), searchDocumentsHandler);
/**
 * @swagger
 * /admin/monitoring/database/collections/{collectionName}/search:
 *   post:
 *     summary: Search documents in a collection
 *     description: Search for documents by name, email, title, or description
 *     tags: [Phase 2 - Database Explorer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: object
 *                 description: MongoDB query object
 *               page:
 *                 type: integer
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 default: 20
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.post(
  "/database/collections/:collectionName/search",
  requirePermission(PERMISSIONS.VIEW_DB),
  searchDocumentsHandler
);

router.post("/database/collections/:collectionName/search", requirePermission(PERMISSIONS.VIEW_DB), searchDocumentsHandler);
/**
 * @swagger
 * /admin/monitoring/database/collections/{collectionName}/stats:
 *   get:
 *     summary: Get collection statistics
 *     description: View statistics for a specific collection (size, count, indexes)
 *     tags: [Phase 2 - Database Explorer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection name
 *     responses:
 *       200:
 *         description: Collection statistics retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_DB)
 *       404:
 *         description: Collection not found
 */
router.get("/database/collections/:collectionName/stats", requirePermission(PERMISSIONS.VIEW_DB), getCollectionStatsHandler);

/**
 * @swagger
 * /admin/monitoring/database/collections/{collectionName}/indexes:
 *   get:
 *     summary: Get collection indexes
 *     description: View all indexes defined on a collection
 *     tags: [Phase 2 - Database Explorer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection name
 *     responses:
 *       200:
 *         description: Indexes retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_DB)
 *       404:
 *         description: Collection not found
 */
router.get("/database/collections/:collectionName/indexes", requirePermission(PERMISSIONS.VIEW_DB), getCollectionIndexesHandler);

/**
 * @swagger
 * /admin/monitoring/database/collections/{collectionName}/count-by/{fieldName}:
 *   get:
 *     summary: Count documents by field value
 *     description: Aggregate count of documents grouped by a specific field
 *     tags: [Phase 2 - Database Explorer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection name
 *       - in: path
 *         name: fieldName
 *         required: true
 *         schema:
 *           type: string
 *         description: Field name to group by (e.g., role, status)
 *     responses:
 *       200:
 *         description: Count results retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_DB)
 *       404:
 *         description: Collection not found
 */
router.get("/database/collections/:collectionName/count-by/:fieldName", requirePermission(PERMISSIONS.VIEW_DB), countByFieldHandler);

/* =====================
   🔥 PHASE 2: DATA EXPORT ROUTES
===================== */

/**
 * @swagger
 * /admin/monitoring/export/students:
 *   post:
 *     summary: Export students data
 *     description: Export all students as JSON or CSV with optional filters
 *     tags: [Phase 2 - Data Export]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [json, csv]
 *                 default: json
 *                 description: Export format
 *               status:
 *                 type: string
 *                 description: Filter by student status
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Filter students registered from this date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Filter students registered until this date
 *           example:
 *             format: "json"
 *             status: "active"
 *             startDate: "2025-01-01"
 *             endDate: "2025-12-31"
 *     responses:
 *       200:
 *         description: Students data exported successfully
 *       403:
 *         description: Permission denied (requires EXPORT_DATA)
 */
router.post("/export/students", requirePermission(PERMISSIONS.EXPORT_DATA), exportStudentsHandler);

/**
 * @swagger
 * /admin/monitoring/export/teachers:
 *   post:
 *     summary: Export teachers data
 *     description: Export all teachers as JSON or CSV with optional filters
 *     tags: [Phase 2 - Data Export]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [json, csv]
 *                 default: json
 *                 description: Export format
 *               status:
 *                 type: string
 *                 description: Filter by teacher status
 *               isVerified:
 *                 type: boolean
 *                 description: Filter by verification status
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Filter teachers registered from this date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Filter teachers registered until this date
 *           example:
 *             format: "csv"
 *             isVerified: true
 *     responses:
 *       200:
 *         description: Teachers data exported successfully
 *       403:
 *         description: Permission denied (requires EXPORT_DATA)
 */
router.post("/export/teachers", requirePermission(PERMISSIONS.EXPORT_DATA), exportTeachersHandler);

/**
 * @swagger
 * /admin/monitoring/export/classes:
 *   post:
 *     summary: Export classes data
 *     description: Export all classes as JSON or CSV with optional filters
 *     tags: [Phase 2 - Data Export]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [json, csv]
 *                 default: json
 *                 description: Export format
 *               teacherId:
 *                 type: string
 *                 description: Filter by teacher ID
 *               isLocked:
 *                 type: boolean
 *                 description: Filter by lock status
 *           example:
 *             format: "json"
 *             isLocked: false
 *     responses:
 *       200:
 *         description: Classes data exported successfully
 *       403:
 *         description: Permission denied (requires EXPORT_DATA)
 */
router.post("/export/classes", requirePermission(PERMISSIONS.EXPORT_DATA), exportClassesHandler);

/**
 * @swagger
 * /admin/monitoring/export/exams:
 *   post:
 *     summary: Export exams data
 *     description: Export all exams as JSON or CSV with optional filters
 *     tags: [Phase 2 - Data Export]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [json, csv]
 *                 default: json
 *                 description: Export format
 *               classId:
 *                 type: string
 *                 description: Filter by class ID
 *               state:
 *                 type: string
 *                 enum: [draft, published, ongoing, ended, resultPublished]
 *                 description: Filter by exam state
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Filter exams from this date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Filter exams until this date
 *           example:
 *             format: "json"
 *             state: "ended"
 *             startDate: "2025-01-01"
 *     responses:
 *       200:
 *         description: Exams data exported successfully
 *       403:
 *         description: Permission denied (requires EXPORT_DATA)
 */
router.post("/export/exams", requirePermission(PERMISSIONS.EXPORT_DATA), exportExamsHandler);

/**
 * @swagger
 * /admin/monitoring/export/submissions:
 *   post:
 *     summary: Export submissions data
 *     description: Export all code submissions as JSON or CSV with optional filters
 *     tags: [Phase 2 - Data Export]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [json, csv]
 *                 default: json
 *                 description: Export format
 *               studentId:
 *                 type: string
 *                 description: Filter by student ID
 *               examId:
 *                 type: string
 *                 description: Filter by exam ID
 *               languageId:
 *                 type: integer
 *                 description: Filter by programming language ID
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Filter submissions from this date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Filter submissions until this date
 *           example:
 *             format: "csv"
 *             examId: "6977290ebc20d3d750e9fc22"
 *             languageId: 71
 *     responses:
 *       200:
 *         description: Submissions data exported successfully
 *       403:
 *         description: Permission denied (requires EXPORT_DATA)
 */
router.post("/export/submissions", requirePermission(PERMISSIONS.EXPORT_DATA), exportSubmissionsHandler);

/**
 * @swagger
 * /admin/monitoring/export/audit-logs:
 *   post:
 *     summary: Export audit logs data
 *     description: Export all audit logs as JSON or CSV with optional filters
 *     tags: [Phase 2 - Data Export]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [json, csv]
 *                 default: json
 *                 description: Export format
 *               actorId:
 *                 type: string
 *                 description: Filter by user who performed action
 *               action:
 *                 type: string
 *                 description: Filter by action type
 *               success:
 *                 type: boolean
 *                 description: Filter by success status
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Filter logs from this date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Filter logs until this date
 *           example:
 *             format: "json"
 *             action: "create_admin"
 *             success: true
 *     responses:
 *       200:
 *         description: Audit logs data exported successfully
 *       403:
 *         description: Permission denied (requires EXPORT_DATA)
 */
router.post("/export/audit-logs", requirePermission(PERMISSIONS.EXPORT_DATA), exportAuditLogsHandler);

/**
 * @swagger
 * /admin/monitoring/export/results:
 *   post:
 *     summary: Export results data
 *     description: Export all exam results as JSON or CSV with optional filters
 *     tags: [Phase 2 - Data Export]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [json, csv]
 *                 default: json
 *                 description: Export format
 *               examId:
 *                 type: string
 *                 description: Filter by exam ID
 *               status:
 *                 type: string
 *                 description: Filter by result status
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Filter results from this date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Filter results until this date
 *           example:
 *             format: "csv"
 *             examId: "6977290ebc20d3d750e9fc22"
 *     responses:
 *       200:
 *         description: Results data exported successfully
 *       403:
 *         description: Permission denied (requires EXPORT_DATA)
 */
router.post("/export/results", requirePermission(PERMISSIONS.EXPORT_DATA), exportResultsHandler);

/* =====================
   🔥 PHASE 2: INFRASTRUCTURE MONITORING ROUTES
===================== */

/**
 * @swagger
 * /admin/monitoring/infrastructure/system:
 *   get:
 *     summary: Get system information
 *     description: View OS, CPU, memory, uptime information
 *     tags: [Phase 2 - Infrastructure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System information retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_INFRA)
 */
router.get("/infrastructure/system", requirePermission(PERMISSIONS.VIEW_INFRA), getSystemInfoHandler);

/**
 * @swagger
 * /admin/monitoring/infrastructure/cpu:
 *   get:
 *     summary: Get CPU usage
 *     description: View CPU usage per core and average
 *     tags: [Phase 2 - Infrastructure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CPU usage information retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_INFRA)
 */
router.get("/infrastructure/cpu", requirePermission(PERMISSIONS.VIEW_INFRA), getCPUUsageHandler);

/**
 * @swagger
 * /admin/monitoring/infrastructure/memory:
 *   get:
 *     summary: Get memory usage
 *     description: View system and process memory usage
 *     tags: [Phase 2 - Infrastructure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Memory usage information retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_INFRA)
 */
router.get("/infrastructure/memory", requirePermission(PERMISSIONS.VIEW_INFRA), getMemoryUsageHandler);

/**
 * @swagger
 * /admin/monitoring/infrastructure/disk:
 *   get:
 *     summary: Get disk usage
 *     description: View disk space usage information
 *     tags: [Phase 2 - Infrastructure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Disk usage information retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_INFRA)
 */
router.get("/infrastructure/disk", requirePermission(PERMISSIONS.VIEW_INFRA), getDiskUsageHandler);

/**
 * @swagger
 * /admin/monitoring/infrastructure/network:
 *   get:
 *     summary: Get network information
 *     description: View network interfaces and configuration
 *     tags: [Phase 2 - Infrastructure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Network information retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_INFRA)
 */
router.get("/infrastructure/network", requirePermission(PERMISSIONS.VIEW_INFRA), getNetworkInfoHandler);

/**
 * @swagger
 * /admin/monitoring/infrastructure/process:
 *   get:
 *     summary: Get process information
 *     description: View Node.js process information (version, uptime, environment)
 *     tags: [Phase 2 - Infrastructure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Process information retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_INFRA)
 */
router.get("/infrastructure/process", requirePermission(PERMISSIONS.VIEW_INFRA), getProcessInfoHandler);

/**
 * @swagger
 * /admin/monitoring/infrastructure/database:
 *   get:
 *     summary: Get database information
 *     description: View database connection status and information
 *     tags: [Phase 2 - Infrastructure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database information retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_INFRA)
 */
router.get("/infrastructure/database", requirePermission(PERMISSIONS.VIEW_INFRA), getDatabaseInfoHandler);

/**
 * @swagger
 * /admin/monitoring/infrastructure/metrics:
 *   get:
 *     summary: Get all infrastructure metrics
 *     description: View all infrastructure metrics in one response (system, CPU, memory, disk, database, etc.)
 *     tags: [Phase 2 - Infrastructure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All infrastructure metrics retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_INFRA)
 */
router.get("/infrastructure/metrics", requirePermission(PERMISSIONS.VIEW_INFRA), getAllMetricsHandler);

/**
 * @swagger
 * /admin/monitoring/infrastructure/health:
 *   get:
 *     summary: Get health status
 *     description: Health check with status indicators for all system components
 *     tags: [Phase 2 - Infrastructure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health status retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_INFRA)
 */
router.get("/infrastructure/health", requirePermission(PERMISSIONS.VIEW_INFRA), getHealthStatusHandler);

/* =====================
   🔥 PHASE 2: SERVER LOGS ROUTES
===================== */

/**
 * @swagger
 * /admin/monitoring/logs/files:
 *   get:
 *     summary: Get list of log files
 *     description: List all available log files with sizes
 *     tags: [Phase 2 - Server Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Log files list retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_SERVER_LOGS)
 */
router.get("/logs/files", requirePermission(PERMISSIONS.VIEW_SERVER_LOGS), getLogFilesHandler);

/**
 * @swagger
 * /admin/monitoring/logs/files/{filename}:
 *   get:
 *     summary: Read log file
 *     description: Read content of a specific log file with pagination
 *     tags: [Phase 2 - Server Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Log filename (e.g., app.log, error.log)
 *       - in: query
 *         name: lines
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of lines to read
 *       - in: query
 *         name: fromEnd
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Read from end of file (true) or beginning (false)
 *     responses:
 *       200:
 *         description: Log file content retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_SERVER_LOGS)
 *       404:
 *         description: Log file not found
 */
router.get("/logs/files/:filename", requirePermission(PERMISSIONS.VIEW_SERVER_LOGS), readLogFileHandler);

/**
 * @swagger
 * /admin/monitoring/logs/search:
 *   get:
 *     summary: Search logs
 *     description: Search for patterns in log files
 *     tags: [Phase 2 - Server Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Log filename to search in
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: caseSensitive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Case sensitive search
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Missing required parameters
 *       403:
 *         description: Permission denied (requires VIEW_SERVER_LOGS)
 *       404:
 *         description: Log file not found
 */
router.get("/logs/search", requirePermission(PERMISSIONS.VIEW_SERVER_LOGS), searchLogsHandler);

/**
 * @swagger
 * /admin/monitoring/logs/app:
 *   get:
 *     summary: Get application logs
 *     description: Retrieve application logs with optional line limit
 *     tags: [Phase 2 - Server Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lines
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of lines to retrieve
 *     responses:
 *       200:
 *         description: Application logs retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_SERVER_LOGS)
 */
router.get("/logs/app", requirePermission(PERMISSIONS.VIEW_SERVER_LOGS), getAppLogsHandler);

/**
 * @swagger
 * /admin/monitoring/logs/error:
 *   get:
 *     summary: Get error logs
 *     description: Retrieve error logs with optional line limit
 *     tags: [Phase 2 - Server Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lines
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of lines to retrieve
 *     responses:
 *       200:
 *         description: Error logs retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_SERVER_LOGS)
 */
router.get("/logs/error", requirePermission(PERMISSIONS.VIEW_SERVER_LOGS), getErrorLogsHandler);

/**
 * @swagger
 * /admin/monitoring/logs/access:
 *   get:
 *     summary: Get access logs
 *     description: Retrieve access/request logs with optional line limit
 *     tags: [Phase 2 - Server Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lines
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of lines to retrieve
 *     responses:
 *       200:
 *         description: Access logs retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_SERVER_LOGS)
 */
router.get("/logs/access", requirePermission(PERMISSIONS.VIEW_SERVER_LOGS), getAccessLogsHandler);

/**
 * @swagger
 * /admin/monitoring/logs/parsed/{filename}:
 *   get:
 *     summary: Get parsed logs
 *     description: Get logs parsed into structured format (JSON)
 *     tags: [Phase 2 - Server Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Log filename
 *       - in: query
 *         name: lines
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of lines to parse
 *     responses:
 *       200:
 *         description: Parsed logs retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_SERVER_LOGS)
 *       404:
 *         description: Log file not found
 */
router.get("/logs/parsed/:filename", requirePermission(PERMISSIONS.VIEW_SERVER_LOGS), getParsedLogsHandler);

/**
 * @swagger
 * /admin/monitoring/logs/stats/{filename}:
 *   get:
 *     summary: Get log file statistics
 *     description: Get statistics about a log file (size, line count, etc.)
 *     tags: [Phase 2 - Server Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Log filename
 *     responses:
 *       200:
 *         description: Log statistics retrieved successfully
 *       403:
 *         description: Permission denied (requires VIEW_SERVER_LOGS)
 *       404:
 *         description: Log file not found
 */
router.get("/logs/stats/:filename", requirePermission(PERMISSIONS.VIEW_SERVER_LOGS), getLogStatsHandler);

/**
 * @swagger
 * /admin/monitoring/logs/files/{filename}:
 *   delete:
 *     summary: Clear log file
 *     description: Truncate/clear a log file (WARNING - Data loss)
 *     tags: [Phase 2 - Server Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Log filename to clear (must end with .log)
 *     responses:
 *       200:
 *         description: Log file cleared successfully
 *       400:
 *         description: Can only clear .log files
 *       403:
 *         description: Permission denied (requires VIEW_SERVER_LOGS)
 *       404:
 *         description: Log file not found
 */
router.delete("/logs/files/:filename", requirePermission(PERMISSIONS.VIEW_SERVER_LOGS), clearLogFileHandler);

/* =====================
   🔥 PHASE 2: SERVICE CONTROL ROUTES
===================== */

/**
 * @swagger
 * /admin/monitoring/services/restart:
 *   post:
 *     summary: Restart application
 *     description: Restart the application (PM2 required)
 *     tags: [Phase 2 - Service Control]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Application restart initiated
 *       403:
 *         description: Permission denied (requires RESTART_SERVICES)
 *       500:
 *         description: Restart failed
 */
router.post("/services/restart", requirePermission(PERMISSIONS.RESTART_SERVICES), restartApplicationHandler);

/**
 * @swagger
 * /admin/monitoring/services/cache/clear:
 *   post:
 *     summary: Clear cache
 *     description: Clear application cache
 *     tags: [Phase 2 - Service Control]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *       403:
 *         description: Permission denied (requires RESTART_SERVICES)
 */
router.post("/services/cache/clear", requirePermission(PERMISSIONS.RESTART_SERVICES), clearCacheHandler);

/**
 * @swagger
 * /admin/monitoring/services/database/reconnect:
 *   post:
 *     summary: Reconnect database
 *     description: Clear and reconnect database connections
 *     tags: [Phase 2 - Service Control]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database reconnected successfully
 *       403:
 *         description: Permission denied (requires RESTART_SERVICES)
 */
router.post("/services/database/reconnect", requirePermission(PERMISSIONS.RESTART_SERVICES), clearDatabaseConnectionsHandler);

/**
 * @swagger
 * /admin/monitoring/services/gc:
 *   post:
 *     summary: Run garbage collection
 *     description: Trigger Node.js garbage collection (requires --expose-gc flag)
 *     tags: [Phase 2 - Service Control]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Garbage collection completed
 *       403:
 *         description: Permission denied (requires RESTART_SERVICES)
 *       500:
 *         description: GC not available (requires --expose-gc)
 */
router.post("/services/gc", requirePermission(PERMISSIONS.RESTART_SERVICES), runGarbageCollectionHandler);

/**
 * @swagger
 * /admin/monitoring/services/status:
 *   get:
 *     summary: Get service status
 *     description: View application, database, and process status
 *     tags: [Phase 2 - Service Control]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service status retrieved successfully
 *       403:
 *         description: Permission denied (requires RESTART_SERVICES)
 */
router.get("/services/status", requirePermission(PERMISSIONS.RESTART_SERVICES), getServiceStatusHandler);

/**
 * @swagger
 * /admin/monitoring/services/health-check:
 *   post:
 *     summary: Health check and auto-recovery
 *     description: Check system health and attempt auto-recovery for issues
 *     tags: [Phase 2 - Service Control]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health check completed
 *       403:
 *         description: Permission denied (requires RESTART_SERVICES)
 */
router.post("/services/health-check", requirePermission(PERMISSIONS.RESTART_SERVICES), healthCheckAndRecoverHandler);

/**
 * @swagger
 * /admin/monitoring/services/pm2/processes:
 *   get:
 *     summary: Get PM2 processes
 *     description: List all PM2 processes with status information
 *     tags: [Phase 2 - Service Control]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PM2 processes retrieved successfully
 *       403:
 *         description: Permission denied (requires RESTART_SERVICES)
 */
router.get("/services/pm2/processes", requirePermission(PERMISSIONS.RESTART_SERVICES), getPM2ProcessListHandler);

/**
 * @swagger
 * /admin/monitoring/services/pm2/restart/{processName}:
 *   post:
 *     summary: Restart PM2 process
 *     description: Restart a specific PM2 process by name
 *     tags: [Phase 2 - Service Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: processName
 *         required: true
 *         schema:
 *           type: string
 *         description: PM2 process name
 *     responses:
 *       200:
 *         description: Process restarted successfully
 *       400:
 *         description: Process name is required
 *       403:
 *         description: Permission denied (requires RESTART_SERVICES)
 *       404:
 *         description: Process not found
 */
router.post("/services/pm2/restart/:processName", requirePermission(PERMISSIONS.RESTART_SERVICES), restartPM2ProcessHandler);

/**
 * @swagger
 * /admin/monitoring/services/maintenance:
 *   post:
 *     summary: Perform maintenance
 *     description: Run all maintenance tasks (clear cache, GC, health check)
 *     tags: [Phase 2 - Service Control]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance tasks completed
 *       403:
 *         description: Permission denied (requires RESTART_SERVICES)
 */
router.post("/services/maintenance", requirePermission(PERMISSIONS.RESTART_SERVICES), performMaintenanceHandler);
/* =====================
   🔥 PHASE 3: REAL-TIME MONITORING ROUTES
===================== */

/**
 * @swagger
 * /admin/monitoring/realtime/connections:
 *   get:
 *     summary: Get active WebSocket connections
 *     description: View all active real-time connections grouped by role
 *     tags: [Phase 3 - Real-Time]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active connections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 connections:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     byRole:
 *                       type: object
 *       403:
 *         description: Permission denied (requires VIEW_REALTIME)
 */
router.get(
  "/realtime/connections",
  requirePermission(PERMISSIONS.VIEW_REALTIME),
  getActiveConnectionsHandler
);

/**
 * @swagger
 * /admin/monitoring/realtime/exams/{examId}/users:
 *   get:
 *     summary: Get users in exam room
 *     description: View all users currently connected to a specific exam room via WebSocket
 *     tags: [Phase 3 - Real-Time]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam ID
 *     responses:
 *       200:
 *         description: Exam room users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 examId:
 *                   type: string
 *                 roomName:
 *                   type: string
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                 count:
 *                   type: number
 *       403:
 *         description: Permission denied (requires VIEW_REALTIME)
 */
router.get(
  "/realtime/exams/:examId/users",
  requirePermission(PERMISSIONS.VIEW_REALTIME),
  getExamRoomUsersHandler
);

/**
 * @swagger
 * /admin/monitoring/realtime/classes/{classId}/users:
 *   get:
 *     summary: Get users in class room
 *     description: View all users currently connected to a specific class room via WebSocket
 *     tags: [Phase 3 - Real-Time]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class room users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 classId:
 *                   type: string
 *                 roomName:
 *                   type: string
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: number
 *       403:
 *         description: Permission denied (requires VIEW_REALTIME)
 */
router.get(
  "/realtime/classes/:classId/users",
  requirePermission(PERMISSIONS.VIEW_REALTIME),
  getClassRoomUsersHandler
);

/**
 * @swagger
 * /admin/monitoring/realtime/rooms:
 *   get:
 *     summary: Get all active WebSocket rooms
 *     description: View all active WebSocket rooms with user counts
 *     tags: [Phase 3 - Real-Time]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active rooms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 rooms:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       userCount:
 *                         type: number
 *                 totalRooms:
 *                   type: number
 *       403:
 *         description: Permission denied (requires VIEW_REALTIME)
 */
router.get(
  "/realtime/rooms",
  requirePermission(PERMISSIONS.VIEW_REALTIME),
  getActiveRoomsHandler
);

/**
 * @swagger
 * /admin/monitoring/realtime/stats:
 *   get:
 *     summary: Get real-time statistics
 *     description: View WebSocket connection statistics, uptime, and active rooms
 *     tags: [Phase 3 - Real-Time]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     connections:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         byRole:
 *                           type: object
 *                     uptime:
 *                       type: number
 *                     uptimeFormatted:
 *                       type: string
 *                     activeRooms:
 *                       type: number
 *                     activeSockets:
 *                       type: number
 *       403:
 *         description: Permission denied (requires VIEW_REALTIME)
 */
router.get(
  "/realtime/stats",
  requirePermission(PERMISSIONS.VIEW_REALTIME),
  getRealtimeStatsHandler
);
module.exports = router;