const {
  getAllClasses,
  getClassDetails,
  getAllStudents,
  getStudentDetails,
  getAllTeachers,
  getTeacherDetails,
  getLiveExams,
  getExamDetails,
  getAllSubmissions,
  getCompilerLogs,
  getUserActivity,
  getSystemStats,
  updateUser
} = require("../services/monitoring.service");

const { manualLog } = require("../middlewares/auditLog.middleware");

/**
 * Get all classes
 * GET /admin/monitoring/classes
 * Permission: VIEW_CLASSES
 */
const getAllClassesHandler = async (req, res) => {
  try {
    const { teacherId, isLocked, search, semesterId, page, limit, sort } = req.query;

    const filters = {};
    if (teacherId) filters.teacherId = teacherId;
    if (isLocked !== undefined) filters.isLocked = isLocked === "true";
    if (search) filters.search = search;
    if (semesterId) filters.semesterId = semesterId;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sort: sort ? JSON.parse(sort) : { createdAt: -1 }
    };

    const result = await getAllClasses(filters, options);

    await manualLog({
      user: req.user,
      req,
      action: "view_all_classes",
      permissionUsed: "VIEW_CLASSES",
      targetType: "class",
      metadata: { count: result.classes.length, filters },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get single class details
 * GET /admin/monitoring/classes/:classId
 * Permission: VIEW_CLASSES
 */
const getClassDetailsHandler = async (req, res) => {
  try {
    const { classId } = req.params;

    const result = await getClassDetails(classId);

    await manualLog({
      user: req.user,
      req,
      action: "view_class_details",
      permissionUsed: "VIEW_CLASSES",
      targetType: "class",
      targetId: classId,
      targetName: result.class.name,
      metadata: {
        studentCount: result.studentCount,
        examCount: result.examCount
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(404).json({
      error: error.message
    });
  }
};

/**
 * Get all students
 * GET /admin/monitoring/students
 * Permission: VIEW_STUDENTS
 */
const getAllStudentsHandler = async (req, res) => {
  try {
    const { search, status, page, limit, sort, batch, section, group } = req.query;

    const filters = {};
    if (search) filters.search = search;
    if (status) filters.status = status;
    if (batch) filters.batch = parseInt(batch);
    if (section) filters.section = section;
    if (group) filters.group = parseInt(group);
    if (req.query.semester) filters.semester = parseInt(req.query.semester);

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sort: sort ? JSON.parse(sort) : { createdAt: -1 }
    };

    const result = await getAllStudents(filters, options);

    await manualLog({
      user: req.user,
      req,
      action: "view_all_students",
      permissionUsed: "VIEW_STUDENTS",
      targetType: "student",
      metadata: { count: result.students.length, filters },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get single student details
 * GET /admin/monitoring/students/:studentId
 * Permission: VIEW_STUDENTS
 */
const getStudentDetailsHandler = async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await getStudentDetails(studentId);

    await manualLog({
      user: req.user,
      req,
      action: "view_student_details",
      permissionUsed: "VIEW_STUDENTS",
      targetType: "student",
      targetId: studentId,
      targetEmail: result.student.email,
      targetName: result.student.name,
      metadata: result.statistics,
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(404).json({
      error: error.message
    });
  }
};

/**
 * Get all teachers
 * GET /admin/monitoring/teachers
 * Permission: VIEW_TEACHERS
 */
const getAllTeachersHandler = async (req, res) => {
  try {
    const { search, isVerified, status, page, limit, sort } = req.query;

    const filters = {};
    if (search) filters.search = search;
    if (isVerified !== undefined) filters.isVerified = isVerified === "true";
    if (status) filters.status = status;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sort: sort ? JSON.parse(sort) : { createdAt: -1 }
    };

    const result = await getAllTeachers(filters, options);

    await manualLog({
      user: req.user,
      req,
      action: "view_all_teachers",
      permissionUsed: "VIEW_TEACHERS",
      targetType: "teacher",
      metadata: { count: result.teachers.length, filters },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get single teacher details
 * GET /admin/monitoring/teachers/:teacherId
 * Permission: VIEW_TEACHERS
 */
const getTeacherDetailsHandler = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const result = await getTeacherDetails(teacherId);

    await manualLog({
      user: req.user,
      req,
      action: "view_teacher_details",
      permissionUsed: "VIEW_TEACHERS",
      targetType: "teacher",
      targetId: teacherId,
      targetEmail: result.teacher.email,
      targetName: result.teacher.name,
      metadata: result.statistics,
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(404).json({
      error: error.message
    });
  }
};

/**
 * Get live/ongoing exams
 * GET /admin/monitoring/live-exams
 * Permission: VIEW_LIVE_EXAMS
 */
const getLiveExamsHandler = async (req, res) => {
  try {
    const exams = await getLiveExams();

    await manualLog({
      user: req.user,
      req,
      action: "view_live_exams",
      permissionUsed: "VIEW_LIVE_EXAMS",
      targetType: "exam",
      metadata: { count: exams.length },
      success: true
    });

    res.json({
      exams,
      count: exams.length
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get detailed exam information
 * GET /admin/monitoring/exams/:examId
 * Permission: VIEW_EXAM_DETAILS
 */
const getExamDetailsHandler = async (req, res) => {
  try {
    const { examId } = req.params;

    const result = await getExamDetails(examId);

    await manualLog({
      user: req.user,
      req,
      action: "view_exam_details",
      permissionUsed: "VIEW_EXAM_DETAILS",
      targetType: "exam",
      targetId: examId,
      targetName: result.exam.title,
      metadata: result.statistics,
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(404).json({
      error: error.message
    });
  }
};

/**
 * Get all code submissions
 * GET /admin/monitoring/submissions
 * Permission: VIEW_CODE_LOGS or VIEW_SUBMISSION_LOGS
 */
const getAllSubmissionsHandler = async (req, res) => {
  try {
    const {
      studentId,
      examId,
      questionId,
      languageId,
      startDate,
      endDate,
      page,
      limit,
      sort
    } = req.query;

    const filters = {};
    if (studentId) filters.studentId = studentId;
    if (examId) filters.examId = examId;
    if (questionId) filters.questionId = questionId;
    if (languageId) filters.languageId = parseInt(languageId);
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sort: sort ? JSON.parse(sort) : { createdAt: -1 }
    };

    const result = await getAllSubmissions(filters, options);

    await manualLog({
      user: req.user,
      req,
      action: "view_code_submissions",
      permissionUsed: "VIEW_CODE_LOGS",
      targetType: "submission",
      metadata: { count: result.submissions.length, filters },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get compiler/execution logs
 * GET /admin/monitoring/compiler-logs
 * Permission: VIEW_COMPILER_LOGS
 */
const getCompilerLogsHandler = async (req, res) => {
  try {
    const { languageId, status, startDate, endDate, page, limit } = req.query;

    const filters = {};
    if (languageId) filters.languageId = parseInt(languageId);
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50
    };

    const result = await getCompilerLogs(filters, options);

    await manualLog({
      user: req.user,
      req,
      action: "view_compiler_logs",
      permissionUsed: "VIEW_COMPILER_LOGS",
      targetType: "system",
      metadata: { count: result.logs.length, filters },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get user activity logs
 * GET /admin/monitoring/user-activity
 * Permission: VIEW_USER_ACTIVITY
 */
const getUserActivityHandler = async (req, res) => {
  try {
    const { userId, role, startDate, endDate, page, limit } = req.query;

    const filters = {};
    if (userId) filters.userId = userId;
    if (role) filters.role = role;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50
    };

    const result = await getUserActivity(filters, options);

    await manualLog({
      user: req.user,
      req,
      action: "view_user_activity",
      permissionUsed: "VIEW_USER_ACTIVITY",
      targetType: "user",
      metadata: { count: result.activity.length, filters },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get system-wide statistics
 * GET /admin/monitoring/stats
 * Permission: Any admin permission (VIEW_CLASSES, VIEW_STUDENTS, etc.)
 */
const getSystemStatsHandler = async (req, res) => {
  try {
    const { semesterId } = req.query;
    const stats = await getSystemStats(semesterId);

    await manualLog({
      user: req.user,
      req,
      action: "view_system_stats",
      permissionUsed: "VIEW_CLASSES", // Generic permission
      targetType: "system",
      metadata: stats,
      success: true
    });

    res.json({
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Update user details
 */
const updateUserHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await updateUser(userId, req.body);

    res.json({
      message: "User updated successfully",
      user
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

module.exports = {
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
};