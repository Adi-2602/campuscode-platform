const {
  generateStudentPerformanceReport,
  generateExamAnalysisReport,
  generateClassPerformanceReport,
  generateTeacherActivityReport,
  generateCustomReport,
  getAvailableReportTypes
} = require("../services/reporting.service");

const { manualLog } = require("../middlewares/auditLog.middleware");

/**
 * Generate student performance report
 * POST /admin/monitoring/reports/student-performance
 * Permission: GENERATE_REPORTS
 */
const generateStudentReportHandler = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        error: "studentId is required"
      });
    }

    const buffer = await generateStudentPerformanceReport(studentId);

    await manualLog({
      user: req.user,
      req,
      action: "generate_student_report",
      permissionUsed: "GENERATE_REPORTS",
      targetType: "student",
      targetId: studentId,
      metadata: { reportType: "student_performance" },
      success: true
    });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="student_report_${studentId}_${Date.now()}.pdf"`
    );
    res.send(buffer);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Generate exam analysis report
 * POST /admin/monitoring/reports/exam-analysis
 * Permission: GENERATE_REPORTS
 */
const generateExamReportHandler = async (req, res) => {
  try {
    const { examId } = req.body;

    if (!examId) {
      return res.status(400).json({
        error: "examId is required"
      });
    }

    const buffer = await generateExamAnalysisReport(examId);

    await manualLog({
      user: req.user,
      req,
      action: "generate_exam_report",
      permissionUsed: "GENERATE_REPORTS",
      targetType: "exam",
      targetId: examId,
      metadata: { reportType: "exam_analysis" },
      success: true
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="exam_report_${examId}_${Date.now()}.pdf"`
    );
    res.send(buffer);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Generate class performance report
 * POST /admin/monitoring/reports/class-performance
 * Permission: GENERATE_REPORTS
 */
const generateClassReportHandler = async (req, res) => {
  try {
    const { classId } = req.body;

    if (!classId) {
      return res.status(400).json({
        error: "classId is required"
      });
    }

    const buffer = await generateClassPerformanceReport(classId);

    await manualLog({
      user: req.user,
      req,
      action: "generate_class_report",
      permissionUsed: "GENERATE_REPORTS",
      targetType: "class",
      targetId: classId,
      metadata: { reportType: "class_performance" },
      success: true
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="class_report_${classId}_${Date.now()}.pdf"`
    );
    res.send(buffer);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Generate teacher activity report
 * POST /admin/monitoring/reports/teacher-activity
 * Permission: GENERATE_REPORTS
 */
const generateTeacherReportHandler = async (req, res) => {
  try {
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({
        error: "teacherId is required"
      });
    }

    const buffer = await generateTeacherActivityReport(teacherId);

    await manualLog({
      user: req.user,
      req,
      action: "generate_teacher_report",
      permissionUsed: "GENERATE_REPORTS",
      targetType: "teacher",
      targetId: teacherId,
      metadata: { reportType: "teacher_activity" },
      success: true
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="teacher_report_${teacherId}_${Date.now()}.pdf"`
    );
    res.send(buffer);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Generate custom report with filters
 * POST /admin/monitoring/reports/custom
 * Permission: GENERATE_REPORTS
 */
const generateCustomReportHandler = async (req, res) => {
  try {
    const { reportType, filters } = req.body;

    if (!reportType) {
      return res.status(400).json({
        error: "reportType is required"
      });
    }

    if (!filters || typeof filters !== "object") {
      return res.status(400).json({
        error: "filters object is required"
      });
    }

    const buffer = await generateCustomReport(reportType, filters);

    await manualLog({
      user: req.user,
      req,
      action: "generate_custom_report",
      permissionUsed: "GENERATE_REPORTS",
      targetType: "system",
      metadata: { reportType, filters },
      success: true
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="custom_report_${reportType}_${Date.now()}.pdf"`
    );
    res.send(buffer);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Get available report types
 * GET /admin/monitoring/reports/types
 * Permission: GENERATE_REPORTS
 */
const getAvailableReportTypesHandler = async (req, res) => {
  try {
    const reportTypes = getAvailableReportTypes();

    await manualLog({
      user: req.user,
      req,
      action: "view_report_types",
      permissionUsed: "GENERATE_REPORTS",
      targetType: "system",
      success: true
    });

    res.json({
      message: "Available report types retrieved successfully",
      reportTypes
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  generateStudentReportHandler,
  generateExamReportHandler,
  generateClassReportHandler,
  generateTeacherReportHandler,
  generateCustomReportHandler,
  getAvailableReportTypesHandler
};