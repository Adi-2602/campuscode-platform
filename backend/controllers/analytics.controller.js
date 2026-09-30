const {
  getSystemStats,
  getStudentPerformanceAnalytics,
  getExamStatistics,
  getClassPerformanceMetrics,
  getTeacherActivityAnalytics,
  getSubmissionTrends,
  getLeaderboard
} = require("../services/analytics.service");

const { manualLog } = require("../middlewares/auditLog.middleware");

/**
 * Get overall system statistics
 * GET /admin/monitoring/analytics/system-stats
 * Permission: VIEW_ANALYTICS
 */
const getSystemStatsHandler = async (req, res) => {
  try {
    const stats = await getSystemStats();

    await manualLog({
      user: req.user,
      req,
      action: "view_system_statistics",
      permissionUsed: "VIEW_ANALYTICS",
      targetType: "system",
      metadata: {
        totalStudents: stats.users.students,
        totalTeachers: stats.users.teachers,
        totalExams: stats.exams
      },
      success: true
    });

    res.json({
      message: "System statistics retrieved successfully",
      stats
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get student performance analytics
 * GET /admin/monitoring/analytics/student-performance
 * Permission: VIEW_ANALYTICS
 */
const getStudentPerformanceHandler = async (req, res) => {
  try {
    const { studentId, classId, startDate, endDate } = req.query;

    const filters = { studentId, classId, startDate, endDate };
    const analytics = await getStudentPerformanceAnalytics(filters);

    await manualLog({
      user: req.user,
      req,
      action: "view_student_performance_analytics",
      permissionUsed: "VIEW_ANALYTICS",
      targetType: "student",
      metadata: {
        totalStudents: analytics.totalStudents,
        filters
      },
      success: true
    });

    res.json({
      message: "Student performance analytics retrieved successfully",
      analytics
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get exam statistics
 * GET /admin/monitoring/analytics/exam-statistics
 * Permission: VIEW_ANALYTICS
 */
const getExamStatisticsHandler = async (req, res) => {
  try {
    const { examId, classId, teacherId, startDate, endDate } = req.query;

    const filters = { examId, classId, teacherId, startDate, endDate };
    const statistics = await getExamStatistics(filters);

    await manualLog({
      user: req.user,
      req,
      action: "view_exam_statistics",
      permissionUsed: "VIEW_ANALYTICS",
      targetType: "exam",
      metadata: {
        totalExams: statistics.totalExams,
        filters
      },
      success: true
    });

    res.json({
      message: "Exam statistics retrieved successfully",
      statistics
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get class performance metrics
 * GET /admin/monitoring/analytics/classes/:classId/performance
 * Permission: VIEW_ANALYTICS
 */
const getClassPerformanceHandler = async (req, res) => {
  try {
    const { classId } = req.params;

    const metrics = await getClassPerformanceMetrics(classId);

    await manualLog({
      user: req.user,
      req,
      action: "view_class_performance_metrics",
      permissionUsed: "VIEW_ANALYTICS",
      targetType: "class",
      metadata: {
        classId,
        studentCount: metrics.studentCount,
        examCount: metrics.examCount
      },
      success: true
    });

    res.json({
      message: "Class performance metrics retrieved successfully",
      metrics
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Get teacher activity analytics
 * GET /admin/monitoring/analytics/teachers/:teacherId/activity
 * Permission: VIEW_ANALYTICS
 */
const getTeacherActivityHandler = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const analytics = await getTeacherActivityAnalytics(teacherId);

    await manualLog({
      user: req.user,
      req,
      action: "view_teacher_activity_analytics",
      permissionUsed: "VIEW_ANALYTICS",
      targetType: "teacher",
      metadata: {
        teacherId,
        classesCreated: analytics.classesCreated,
        examsCreated: analytics.examsCreated
      },
      success: true
    });

    res.json({
      message: "Teacher activity analytics retrieved successfully",
      teacherId,
      analytics
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get submission trends
 * GET /admin/monitoring/analytics/submission-trends
 * Permission: VIEW_ANALYTICS
 */
const getSubmissionTrendsHandler = async (req, res) => {
  try {
    const { period = "daily", days = 7 } = req.query;

    const trends = await getSubmissionTrends(period, parseInt(days));

    await manualLog({
      user: req.user,
      req,
      action: "view_submission_trends",
      permissionUsed: "VIEW_ANALYTICS",
      targetType: "system",
      metadata: {
        period,
        days,
        totalSubmissions: trends.totalSubmissions
      },
      success: true
    });

    res.json({
      message: "Submission trends retrieved successfully",
      trends
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get leaderboard (top performers)
 * GET /admin/monitoring/analytics/leaderboard
 * Permission: VIEW_ANALYTICS
 */
const getLeaderboardHandler = async (req, res) => {
  try {
    const { classId, examId, limit = 10 } = req.query;

    const filters = { classId, examId, limit: parseInt(limit) };
    const leaderboard = await getLeaderboard(filters);

    await manualLog({
      user: req.user,
      req,
      action: "view_leaderboard",
      permissionUsed: "VIEW_ANALYTICS",
      targetType: "system",
      metadata: {
        filters,
        totalStudents: leaderboard.totalStudents
      },
      success: true
    });

    res.json({
      message: "Leaderboard retrieved successfully",
      ...leaderboard
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get dashboard overview (combined stats)
 * GET /admin/monitoring/analytics/dashboard
 * Permission: VIEW_ANALYTICS
 */
const getDashboardOverviewHandler = async (req, res) => {
  try {
    // Get multiple analytics in parallel
    const [systemStats, recentTrends, topPerformers] = await Promise.all([
      getSystemStats(),
      getSubmissionTrends("daily", 7),
      getLeaderboard({ limit: 5 })
    ]);

    await manualLog({
      user: req.user,
      req,
      action: "view_analytics_dashboard",
      permissionUsed: "VIEW_ANALYTICS",
      targetType: "system",
      metadata: {
        statsLoaded: true
      },
      success: true
    });

    res.json({
      message: "Dashboard overview retrieved successfully",
      dashboard: {
        systemStats,
        recentTrends: {
          period: recentTrends.period,
          totalSubmissions: recentTrends.totalSubmissions,
          trends: recentTrends.trends.slice(-7) // Last 7 days
        },
        topPerformers: topPerformers.leaderboard
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get analytics summary for a specific exam
 * GET /admin/monitoring/analytics/exams/:examId/summary
 * Permission: VIEW_ANALYTICS
 */
const getExamAnalyticsSummaryHandler = async (req, res) => {
  try {
    const { examId } = req.params;

    const statistics = await getExamStatistics({ examId });

    if (statistics.exams.length === 0) {
      return res.status(404).json({
        error: "Exam not found or no statistics available"
      });
    }

    const examSummary = statistics.exams[0];

    await manualLog({
      user: req.user,
      req,
      action: "view_exam_analytics_summary",
      permissionUsed: "VIEW_ANALYTICS",
      targetType: "exam",
      metadata: {
        examId,
        totalStudents: examSummary.totalStudents,
        completionRate: examSummary.completionRate
      },
      success: true
    });

    res.json({
      message: "Exam analytics summary retrieved successfully",
      examId,
      summary: examSummary
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Compare multiple classes performance
 * POST /admin/monitoring/analytics/classes/compare
 * Permission: VIEW_ANALYTICS
 */
const compareClassesHandler = async (req, res) => {
  try {
    const { classIds } = req.body;

    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      return res.status(400).json({
        error: "classIds array is required"
      });
    }

    const comparisons = await Promise.all(
      classIds.map(async (classId) => {
        try {
          const metrics = await getClassPerformanceMetrics(classId);
          return metrics;
        } catch (error) {
          return {
            class: { id: classId },
            error: error.message
          };
        }
      })
    );

    await manualLog({
      user: req.user,
      req,
      action: "compare_classes_performance",
      permissionUsed: "VIEW_ANALYTICS",
      targetType: "class",
      metadata: {
        classCount: classIds.length
      },
      success: true
    });

    res.json({
      message: "Class comparison retrieved successfully",
      comparisons
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  getSystemStatsHandler,
  getStudentPerformanceHandler,
  getExamStatisticsHandler,
  getClassPerformanceHandler,
  getTeacherActivityHandler,
  getSubmissionTrendsHandler,
  getLeaderboardHandler,
  getDashboardOverviewHandler,
  getExamAnalyticsSummaryHandler,
  compareClassesHandler
};