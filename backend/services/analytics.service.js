const User = require("../models/user.model");
const Class = require("../models/class.model");
const ClassStudent = require("../models/classStudent.model");
const Exam = require("../models/exam.model");
const StudentExam = require("../models/studentExam.model");
const Submission = require("../models/submission.model");
const FinalResult = require("../models/finalResult.model");
const Question = require("../models/question.model");

/**
 * Get overall system statistics
 */
const getSystemStats = async () => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalExams,
      totalSubmissions,
      activeStudents,
      activeTeachers
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher", isVerified: true }),
      Class.countDocuments(),
      Exam.countDocuments(),
      Submission.countDocuments(),
      User.countDocuments({ role: "student", status: "active" }),
      User.countDocuments({ role: "teacher", status: "active", isVerified: true })
    ]);

    return {
      users: {
        students: totalStudents,
        teachers: totalTeachers,
        activeStudents,
        activeTeachers
      },
      classes: totalClasses,
      exams: totalExams,
      submissions: totalSubmissions
    };
  } catch (error) {
    throw new Error(`Failed to get system stats: ${error.message}`);
  }
};

/**
 * Get student performance analytics
 */
const getStudentPerformanceAnalytics = async (filters = {}) => {
  try {
    const { studentId, classId, startDate, endDate } = filters;

    const matchStage = {};
    if (studentId) matchStage.studentId = studentId;
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Get results with exam details
    const results = await FinalResult.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "exams",
          localField: "examId",
          foreignField: "_id",
          as: "exam"
        }
      },
      { $unwind: "$exam" },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      {
        $group: {
          _id: "$studentId",
          studentName: { $first: "$student.name" },
          studentEmail: { $first: "$student.email" },
          studentRollNo: { $first: "$student.rollNo" },
          totalExams: { $sum: 1 },
          totalMarks: { $sum: "$exam.totalMarks" },
          marksObtained: { $sum: "$finalTotal" },
          averageScore: { $avg: "$finalTotal" },
          highestScore: { $max: "$finalTotal" },
          lowestScore: { $min: "$finalTotal" },
          passCount: {
            $sum: { $cond: [{ $eq: ["$status", "pass"] }, 1, 0] }
          },
          failCount: {
            $sum: { $cond: [{ $eq: ["$status", "fail"] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          averagePercentage: {
            $multiply: [
              { $divide: ["$marksObtained", "$totalMarks"] },
              100
            ]
          },
          passRate: {
            $multiply: [
              { $divide: ["$passCount", "$totalExams"] },
              100
            ]
          }
        }
      },
      { $sort: { averageScore: -1 } }
    ]);

    return {
      students: results,
      totalStudents: results.length,
      summary: {
        totalExams: results.reduce((sum, s) => sum + s.totalExams, 0),
        averageScore: results.length > 0 
          ? (results.reduce((sum, s) => sum + s.averageScore, 0) / results.length).toFixed(2)
          : 0,
        overallPassRate: results.length > 0
          ? (results.reduce((sum, s) => sum + s.passRate, 0) / results.length).toFixed(2)
          : 0
      }
    };
  } catch (error) {
    throw new Error(`Failed to get student performance analytics: ${error.message}`);
  }
};

/**
 * Get exam statistics
 */
const getExamStatistics = async (filters = {}) => {
  try {
    const { examId, classId, teacherId, startDate, endDate } = filters;

    const matchStage = {};
    if (examId) matchStage._id = examId;
    if (classId) matchStage.classId = classId;
    if (teacherId) matchStage.createdBy = teacherId;
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const examStats = await Exam.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "studentexams",
          localField: "_id",
          foreignField: "examId",
          as: "examStudents"
        }
      },
      {
        $lookup: {
          from: "finalresults",
          localField: "_id",
          foreignField: "examId",
          as: "results"
        }
      },
      {
        $lookup: {
          from: "submissions",
          localField: "_id",
          foreignField: "examId",
          as: "submissions"
        }
      },
      {
        $project: {
          title: 1,
          state: 1,
          totalMarks: 1,
          startTime: 1,
          endTime: 1,
          totalStudents: { $size: "$examStudents" },
          startedStudents: {
            $size: {
              $filter: {
                input: "$examStudents",
                as: "es",
                cond: { $ne: ["$$es.startedAt", null] }
              }
            }
          },
          submittedStudents: {
            $size: {
              $filter: {
                input: "$examStudents",
                as: "es",
                cond: { $eq: ["$$es.isSubmitted", true] }
              }
            }
          },
          totalSubmissions: { $size: "$submissions" },
          resultsPublished: {
            $size: {
              $filter: {
                input: "$results",
                as: "r",
                cond: { $eq: ["$$r.published", true] }
              }
            }
          },
          averageScore: { $avg: "$results.finalTotal" },
          highestScore: { $max: "$results.finalTotal" },
          lowestScore: { $min: "$results.finalTotal" },
          passCount: {
            $size: {
              $filter: {
                input: "$results",
                as: "r",
                cond: { $eq: ["$$r.status", "pass"] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $multiply: [
              { $divide: ["$submittedStudents", "$totalStudents"] },
              100
            ]
          },
          participationRate: {
            $multiply: [
              { $divide: ["$startedStudents", "$totalStudents"] },
              100
            ]
          },
          passRate: {
            $cond: {
              if: { $gt: ["$submittedStudents", 0] },
              then: {
                $multiply: [
                  { $divide: ["$passCount", "$submittedStudents"] },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      { $sort: { startTime: -1 } }
    ]);

    return {
      exams: examStats,
      totalExams: examStats.length,
      summary: {
        totalStudents: examStats.reduce((sum, e) => sum + e.totalStudents, 0),
        totalSubmissions: examStats.reduce((sum, e) => sum + e.totalSubmissions, 0),
        averageCompletionRate: examStats.length > 0
          ? (examStats.reduce((sum, e) => sum + (e.completionRate || 0), 0) / examStats.length).toFixed(2)
          : 0,
        averagePassRate: examStats.length > 0
          ? (examStats.reduce((sum, e) => sum + (e.passRate || 0), 0) / examStats.length).toFixed(2)
          : 0
      }
    };
  } catch (error) {
    throw new Error(`Failed to get exam statistics: ${error.message}`);
  }
};

/**
 * Get class performance metrics
 */
const getClassPerformanceMetrics = async (classId) => {
  try {
    const classData = await Class.findById(classId);
    if (!classData) {
      throw new Error("Class not found");
    }

    // Get enrolled students count
    const studentCount = await ClassStudent.countDocuments({
      classId,
      leftAt: null
    });

    // Get exams for this class
    const exams = await Exam.find({ classId });
    const examIds = exams.map(e => e._id);

    // Get all results for class exams
    const results = await FinalResult.aggregate([
      { $match: { examId: { $in: examIds } } },
      {
        $lookup: {
          from: "exams",
          localField: "examId",
          foreignField: "_id",
          as: "exam"
        }
      },
      { $unwind: "$exam" },
      {
        $group: {
          _id: null,
          totalExams: { $addToSet: "$examId" },
          totalResults: { $sum: 1 },
          totalMarks: { $sum: "$exam.totalMarks" },
          marksObtained: { $sum: "$finalTotal" },
          averageScore: { $avg: "$finalTotal" },
          passCount: {
            $sum: { $cond: [{ $eq: ["$status", "pass"] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          examCount: { $size: "$totalExams" },
          averagePercentage: {
            $multiply: [
              { $divide: ["$marksObtained", "$totalMarks"] },
              100
            ]
          },
          passRate: {
            $multiply: [
              { $divide: ["$passCount", "$totalResults"] },
              100
            ]
          }
        }
      }
    ]);

    const metrics = results[0] || {
      examCount: 0,
      totalResults: 0,
      averageScore: 0,
      averagePercentage: 0,
      passRate: 0
    };

    return {
      class: {
        id: classData._id,
        name: classData.name,
        code: classData.code
      },
      studentCount,
      ...metrics
    };
  } catch (error) {
    throw new Error(`Failed to get class performance metrics: ${error.message}`);
  }
};

/**
 * Get teacher activity analytics
 */
const getTeacherActivityAnalytics = async (teacherId) => {
  try {
    const [
      classesCreated,
      examsCreated,
      questionsCreated,
      totalStudents,
      totalSubmissions
    ] = await Promise.all([
      Class.countDocuments({ createdBy: teacherId }),
      Exam.countDocuments({ createdBy: teacherId }),
      Question.countDocuments({ createdBy: teacherId }),
      ClassStudent.countDocuments({
        classId: {
          $in: await Class.find({ createdBy: teacherId }).distinct("_id")
        },
        leftAt: null
      }),
      Submission.countDocuments({
        examId: {
          $in: await Exam.find({ createdBy: teacherId }).distinct("_id")
        }
      })
    ]);

    // Get exam statistics
    const examStats = await Exam.aggregate([
      { $match: { createdBy: teacherId } },
      {
        $group: {
          _id: "$state",
          count: { $sum: 1 }
        }
      }
    ]);

    const examsByState = examStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    return {
      classesCreated,
      examsCreated,
      questionsCreated,
      totalStudents,
      totalSubmissions,
      examsByState: {
        draft: examsByState.draft || 0,
        published: examsByState.published || 0,
        ongoing: examsByState.ongoing || 0,
        ended: examsByState.ended || 0,
        resultPublished: examsByState.resultPublished || 0
      }
    };
  } catch (error) {
    throw new Error(`Failed to get teacher activity analytics: ${error.message}`);
  }
};

/**
 * Get submission trends (daily/weekly/monthly)
 */
const getSubmissionTrends = async (period = "daily", days = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let groupBy;
    switch (period) {
      case "hourly":
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
          hour: { $hour: "$createdAt" }
        };
        break;
      case "daily":
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        };
        break;
      case "weekly":
        groupBy = {
          year: { $year: "$createdAt" },
          week: { $week: "$createdAt" }
        };
        break;
      case "monthly":
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        };
        break;
      default:
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        };
    }

    const trends = await Submission.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          uniqueStudents: { $addToSet: "$studentId" }
        }
      },
      {
        $addFields: {
          uniqueStudentCount: { $size: "$uniqueStudents" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } }
    ]);

    return {
      period,
      days,
      trends,
      totalSubmissions: trends.reduce((sum, t) => sum + t.count, 0)
    };
  } catch (error) {
    throw new Error(`Failed to get submission trends: ${error.message}`);
  }
};

/**
 * Get leaderboard (top performers)
 */
const getLeaderboard = async (filters = {}) => {
  try {
    const { classId, examId, limit = 10 } = filters;

    const matchStage = { published: true };
    if (examId) matchStage.examId = examId;

    let leaderboard = await FinalResult.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      {
        $lookup: {
          from: "exams",
          localField: "examId",
          foreignField: "_id",
          as: "exam"
        }
      },
      { $unwind: "$exam" },
      {
        $addFields: {
          percentage: {
            $multiply: [
              { $divide: ["$finalTotal", "$exam.totalMarks"] },
              100
            ]
          }
        }
      },
      {
        $group: {
          _id: "$studentId",
          studentName: { $first: "$student.name" },
          studentEmail: { $first: "$student.email" },
          studentRollNo: { $first: "$student.rollNo" },
          totalExams: { $sum: 1 },
          totalMarks: { $sum: "$exam.totalMarks" },
          marksObtained: { $sum: "$finalTotal" },
          averagePercentage: { $avg: "$percentage" }
        }
      },
      { $sort: { averagePercentage: -1 } },
      { $limit: limit }
    ]);

    // Add rank
    leaderboard = leaderboard.map((student, index) => ({
      rank: index + 1,
      ...student
    }));

    return {
      leaderboard,
      totalStudents: leaderboard.length
    };
  } catch (error) {
    throw new Error(`Failed to get leaderboard: ${error.message}`);
  }
};

module.exports = {
  getSystemStats,
  getStudentPerformanceAnalytics,
  getExamStatistics,
  getClassPerformanceMetrics,
  getTeacherActivityAnalytics,
  getSubmissionTrends,
  getLeaderboard
};