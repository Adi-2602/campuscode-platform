const User = require("../models/user.model");
const Class = require("../models/class.model");
const ClassStudent = require("../models/classStudent.model");
const Exam = require("../models/exam.model");
const Submission = require("../models/submission.model");
const Question = require("../models/question.model");
const FinalResult = require("../models/finalResult.model");
const AuditLog = require("../models/auditLog.model");

/**
 * Export all students data
 */
const exportStudents = async (format = "json", filters = {}) => {
  try {
    const { status, startDate, endDate } = filters;

    const query = { role: "student" };

    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const students = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with statistics
    const enrichedStudents = await Promise.all(
      students.map(async (student) => {
        const [classCount, examCount, submissionCount] = await Promise.all([
          ClassStudent.countDocuments({
            studentId: student._id,
            leftAt: null
          }),
          Submission.countDocuments({ studentId: student._id }),
          Submission.countDocuments({ studentId: student._id })
        ]);

        return {
          id: student._id,
          name: student.name,
          email: student.email,
          rollNo: student.rollNo || "N/A",
          status: student.status,
          isVerified: student.isVerified,
          enrolledClasses: classCount,
          totalSubmissions: submissionCount,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt
        };
      })
    );

    return {
      data: enrichedStudents,
      format,
      totalRecords: enrichedStudents.length,
      exportedAt: new Date(),
      filters
    };
  } catch (error) {
    throw new Error(`Failed to export students: ${error.message}`);
  }
};

/**
 * Export all teachers data
 */
const exportTeachers = async (format = "json", filters = {}) => {
  try {
    const { status, isVerified, startDate, endDate } = filters;

    const query = { role: "teacher" };

    if (status) query.status = status;
    if (isVerified !== undefined) query.isVerified = isVerified === "true";
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const teachers = await User.find(query)
      .select("-passwordHash")
      .populate("verifiedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with statistics
    const enrichedTeachers = await Promise.all(
      teachers.map(async (teacher) => {
        const [classCount, examCount, questionCount] = await Promise.all([
          Class.countDocuments({ createdBy: teacher._id }),
          Exam.countDocuments({ createdBy: teacher._id }),
          Question.countDocuments({ createdBy: teacher._id })
        ]);

        return {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          status: teacher.status,
          isVerified: teacher.isVerified,
          verifiedBy: teacher.verifiedBy?.name || "N/A",
          verifiedAt: teacher.verifiedAt || "N/A",
          classesCreated: classCount,
          examsCreated: examCount,
          questionsCreated: questionCount,
          createdAt: teacher.createdAt,
          updatedAt: teacher.updatedAt
        };
      })
    );

    return {
      data: enrichedTeachers,
      format,
      totalRecords: enrichedTeachers.length,
      exportedAt: new Date(),
      filters
    };
  } catch (error) {
    throw new Error(`Failed to export teachers: ${error.message}`);
  }
};

/**
 * Export all classes data
 */
const exportClasses = async (format = "json", filters = {}) => {
  try {
    const { teacherId, isLocked } = filters;

    const query = {};

    if (teacherId) query.createdBy = teacherId;
    if (isLocked !== undefined) query.isLocked = isLocked === "true";

    const classes = await Class.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with statistics
    const enrichedClasses = await Promise.all(
      classes.map(async (classItem) => {
        const [studentCount, examCount] = await Promise.all([
          ClassStudent.countDocuments({
            classId: classItem._id,
            leftAt: null
          }),
          Exam.countDocuments({ classId: classItem._id })
        ]);

        return {
          id: classItem._id,
          name: classItem.name,
          code: classItem.code,
          description: classItem.description || "N/A",
          teacherName: classItem.createdBy?.name || "N/A",
          teacherEmail: classItem.createdBy?.email || "N/A",
          isLocked: classItem.isLocked,
          studentCount,
          examCount,
          createdAt: classItem.createdAt,
          updatedAt: classItem.updatedAt
        };
      })
    );

    return {
      data: enrichedClasses,
      format,
      totalRecords: enrichedClasses.length,
      exportedAt: new Date(),
      filters
    };
  } catch (error) {
    throw new Error(`Failed to export classes: ${error.message}`);
  }
};

/**
 * Export all exams data
 */
const exportExams = async (format = "json", filters = {}) => {
  try {
    const { classId, state, startDate, endDate } = filters;

    const query = {};

    if (classId) query.classId = classId;
    if (state) query.state = state;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const exams = await Exam.find(query)
      .populate("createdBy", "name email")
      .populate("classId", "name code")
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with statistics
    const enrichedExams = await Promise.all(
      exams.map(async (exam) => {
        const submissionCount = await Submission.countDocuments({
          examId: exam._id
        });

        return {
          id: exam._id,
          title: exam.title,
          description: exam.description || "N/A",
          className: exam.classId?.name || "N/A",
          classCode: exam.classId?.code || "N/A",
          teacherName: exam.createdBy?.name || "N/A",
          teacherEmail: exam.createdBy?.email || "N/A",
          state: exam.state,
          startTime: exam.startTime,
          endTime: exam.endTime,
          durationMinutes: exam.durationMinutes,
          totalMarks: exam.totalMarks,
          isRandomized: exam.isRandomized,
          maxSubmissions: exam.maxSubmissions || "Unlimited",
          totalSubmissions: submissionCount,
          createdAt: exam.createdAt
        };
      })
    );

    return {
      data: enrichedExams,
      format,
      totalRecords: enrichedExams.length,
      exportedAt: new Date(),
      filters
    };
  } catch (error) {
    throw new Error(`Failed to export exams: ${error.message}`);
  }
};

/**
 * Export all submissions data
 */
const exportSubmissions = async (format = "json", filters = {}) => {
  try {
    const { studentId, examId, languageId, startDate, endDate } = filters;

    const query = {};

    if (studentId) query.studentId = studentId;
    if (examId) query.examId = examId;
    if (languageId) query.languageId = parseInt(languageId);
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const submissions = await Submission.find(query)
      .populate("studentId", "name email rollNo")
      .populate("examId", "title")
      .populate("questionId", "title")
      .sort({ createdAt: -1 })
      .limit(10000) // Limit for performance
      .lean();

    const enrichedSubmissions = submissions.map((submission) => ({
      id: submission._id,
      studentName: submission.studentId?.name || "N/A",
      studentEmail: submission.studentId?.email || "N/A",
      studentRollNo: submission.studentId?.rollNo || "N/A",
      examTitle: submission.examId?.title || "N/A",
      questionTitle: submission.questionId?.title || "N/A",
      languageId: submission.languageId,
      status: submission.status,
      time: submission.time || "N/A",
      memory: submission.memory || "N/A",
      submittedAt: submission.createdAt
    }));

    return {
      data: enrichedSubmissions,
      format,
      totalRecords: enrichedSubmissions.length,
      exportedAt: new Date(),
      filters,
      note:
        enrichedSubmissions.length === 10000
          ? "Limited to 10,000 records for performance"
          : null
    };
  } catch (error) {
    throw new Error(`Failed to export submissions: ${error.message}`);
  }
};

/**
 * Export audit logs data
 */
const exportAuditLogs = async (format = "json", filters = {}) => {
  try {
    const { actorId, action, success, startDate, endDate } = filters;

    const query = {};

    if (actorId) query.actorId = actorId;
    if (action) query.action = action;
    if (success !== undefined) query.success = success === "true";
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate("actorId", "name email")
      .sort({ createdAt: -1 })
      .limit(5000) // Limit for performance
      .lean();

    const enrichedLogs = logs.map((log) => ({
      id: log._id,
      actorName: log.actorName,
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
      action: log.action,
      permissionUsed: log.permissionUsed,
      targetType: log.targetType || "N/A",
      targetId: log.targetId || "N/A",
      success: log.success,
      errorMessage: log.errorMessage || "N/A",
      ipAddress: log.ipAddress || "N/A",
      timestamp: log.createdAt
    }));

    return {
      data: enrichedLogs,
      format,
      totalRecords: enrichedLogs.length,
      exportedAt: new Date(),
      filters,
      note:
        enrichedLogs.length === 5000
          ? "Limited to 5,000 records for performance"
          : null
    };
  } catch (error) {
    throw new Error(`Failed to export audit logs: ${error.message}`);
  }
};

/**
 * Export results data
 */
const exportResults = async (format = "json", filters = {}) => {
  try {
    const { examId, status, startDate, endDate } = filters;

    const query = {};

    if (examId) query.examId = examId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const results = await FinalResult.find(query)
      .populate("studentId", "name email rollNo")
      .populate("examId", "title totalMarks")
      .sort({ createdAt: -1 })
      .lean();

    const enrichedResults = results.map((result) => ({
      id: result._id,
      studentName: result.studentId?.name || "N/A",
      studentEmail: result.studentId?.email || "N/A",
      studentRollNo: result.studentId?.rollNo || "N/A",
      examTitle: result.examId?.title || "N/A",
      totalMarks: result.examId?.totalMarks || "N/A",
      marksObtained: result.finalTotal,
      percentage: result.examId?.totalMarks
        ? ((result.finalTotal / result.examId.totalMarks) * 100).toFixed(2)
        : "N/A",
      status: result.status,
      published: result.published,
      publishedAt: result.publishedAt || "N/A"
    }));

    return {
      data: enrichedResults,
      format,
      totalRecords: enrichedResults.length,
      exportedAt: new Date(),
      filters
    };
  } catch (error) {
    throw new Error(`Failed to export results: ${error.message}`);
  }
};

module.exports = {
  exportStudents,
  exportTeachers,
  exportClasses,
  exportExams,
  exportSubmissions,
  exportAuditLogs,
  exportResults
};