const {
  exportStudents,
  exportTeachers,
  exportClasses,
  exportExams,
  exportSubmissions,
  exportAuditLogs,
  exportResults
} = require("../services/dataExport.service");

const { manualLog } = require("../middlewares/auditLog.middleware");

/**
 * Export students data
 * POST /admin/monitoring/export/students
 * Permission: EXPORT_DATA
 */
const exportStudentsHandler = async (req, res) => {
  try {
    const { format = "json", status, startDate, endDate } = req.body;

    const filters = { status, startDate, endDate };

    const result = await exportStudents(format, filters);

    await manualLog({
      user: req.user,
      req,
      action: "export_students_data",
      permissionUsed: "EXPORT_DATA",
      targetType: "student",
      metadata: {
        format,
        recordsExported: result.totalRecords,
        filters
      },
      success: true
    });

    res.json({
      message: "Students data exported successfully",
      ...result
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Export teachers data
 * POST /admin/monitoring/export/teachers
 * Permission: EXPORT_DATA
 */
const exportTeachersHandler = async (req, res) => {
  try {
    const {
      format = "json",
      status,
      isVerified,
      startDate,
      endDate
    } = req.body;

    const filters = { status, isVerified, startDate, endDate };

    const result = await exportTeachers(format, filters);

    await manualLog({
      user: req.user,
      req,
      action: "export_teachers_data",
      permissionUsed: "EXPORT_DATA",
      targetType: "teacher",
      metadata: {
        format,
        recordsExported: result.totalRecords,
        filters
      },
      success: true
    });

    res.json({
      message: "Teachers data exported successfully",
      ...result
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Export classes data
 * POST /admin/monitoring/export/classes
 * Permission: EXPORT_DATA
 */
const exportClassesHandler = async (req, res) => {
  try {
    const { format = "json", teacherId, isLocked } = req.body;

    const filters = { teacherId, isLocked };

    const result = await exportClasses(format, filters);

    await manualLog({
      user: req.user,
      req,
      action: "export_classes_data",
      permissionUsed: "EXPORT_DATA",
      targetType: "class",
      metadata: {
        format,
        recordsExported: result.totalRecords,
        filters
      },
      success: true
    });

    res.json({
      message: "Classes data exported successfully",
      ...result
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Export exams data
 * POST /admin/monitoring/export/exams
 * Permission: EXPORT_DATA
 */
const exportExamsHandler = async (req, res) => {
  try {
    const { format = "json", classId, state, startDate, endDate } = req.body;

    const filters = { classId, state, startDate, endDate };

    const result = await exportExams(format, filters);

    await manualLog({
      user: req.user,
      req,
      action: "export_exams_data",
      permissionUsed: "EXPORT_DATA",
      targetType: "exam",
      metadata: {
        format,
        recordsExported: result.totalRecords,
        filters
      },
      success: true
    });

    res.json({
      message: "Exams data exported successfully",
      ...result
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Export submissions data
 * POST /admin/monitoring/export/submissions
 * Permission: EXPORT_DATA
 */
const exportSubmissionsHandler = async (req, res) => {
  try {
    const {
      format = "json",
      studentId,
      examId,
      languageId,
      startDate,
      endDate
    } = req.body;

    const filters = { studentId, examId, languageId, startDate, endDate };

    const result = await exportSubmissions(format, filters);

    await manualLog({
      user: req.user,
      req,
      action: "export_submissions_data",
      permissionUsed: "EXPORT_DATA",
      targetType: "submission",
      metadata: {
        format,
        recordsExported: result.totalRecords,
        filters
      },
      success: true
    });

    res.json({
      message: "Submissions data exported successfully",
      ...result
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Export audit logs data
 * POST /admin/monitoring/export/audit-logs
 * Permission: EXPORT_DATA
 */
const exportAuditLogsHandler = async (req, res) => {
  try {
    const {
      format = "json",
      actorId,
      action,
      success,
      startDate,
      endDate
    } = req.body;

    const filters = { actorId, action, success, startDate, endDate };

    const result = await exportAuditLogs(format, filters);

    await manualLog({
      user: req.user,
      req,
      action: "export_audit_logs_data",
      permissionUsed: "EXPORT_DATA",
      targetType: "audit_log",
      metadata: {
        format,
        recordsExported: result.totalRecords,
        filters
      },
      success: true
    });

    res.json({
      message: "Audit logs data exported successfully",
      ...result
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Export results data
 * POST /admin/monitoring/export/results
 * Permission: EXPORT_DATA
 */
const exportResultsHandler = async (req, res) => {
  try {
    const { format = "json", examId, status, startDate, endDate } = req.body;

    const filters = { examId, status, startDate, endDate };

    const result = await exportResults(format, filters);

    await manualLog({
      user: req.user,
      req,
      action: "export_results_data",
      permissionUsed: "EXPORT_DATA",
      targetType: "system",
      metadata: {
        format,
        recordsExported: result.totalRecords,
        filters
      },
      success: true
    });

    res.json({
      message: "Results data exported successfully",
      ...result
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  exportStudentsHandler,
  exportTeachersHandler,
  exportClassesHandler,
  exportExamsHandler,
  exportSubmissionsHandler,
  exportAuditLogsHandler,
  exportResultsHandler
};