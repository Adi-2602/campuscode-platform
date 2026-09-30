const {
  getSemesterEnrollmentStats,
  getLabUtilizationReport,
  getTeacherLoadDistribution,
  getStudentsByBatchSection
} = require("../services/adminReports.service");

const {
  generateEnrollmentCSV,
  generateTeachersCSV,
  generateStudentsCSV,
  generateLabUtilizationCSV,
  setCSVHeaders
} = require("../utils/csvExporter.util");

const ClassStudent = require("../models/classStudent.model");
const User = require("../models/user.model");
const Class = require("../models/class.model");

/**
 * Get enrollment statistics
 * GET /admin/reports/semester/:semesterId/enrollment
 */
const getEnrollmentStatsHandler = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const stats = await getSemesterEnrollmentStats(semesterId);

    res.json(stats);

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get lab utilization report
 * GET /admin/reports/semester/:semesterId/lab-utilization
 */
const getLabUtilizationHandler = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const report = await getLabUtilizationReport(semesterId);

    res.json(report);

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get teacher load distribution
 * GET /admin/reports/teacher-load
 */
const getTeacherLoadHandler = async (req, res) => {
  try {
    const { semesterId } = req.query;

    const distribution = await getTeacherLoadDistribution(semesterId);

    res.json(distribution);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Export enrollment data as CSV
 * GET /admin/exports/semester/:semesterId/enrollment
 */
const exportEnrollmentCSVHandler = async (req, res) => {
  try {
    const { semesterId } = req.params;

    // Get all classes in semester
    const classes = await Class.find({ semester: semesterId });
    const classIds = classes.map(c => c._id);

    // Get all enrollments
    const enrollments = await ClassStudent.find({
      classId: { $in: classIds },
      leftAt: null
    })
      .populate("studentId", "registrationNumber studentName email batch section group")
      .populate("classId", "name code courseCode courseName")
      .lean();

    // Format data
    const data = enrollments.map(e => ({
      registrationNumber: e.studentId.registrationNumber,
      studentName: e.studentId.studentName,
      email: e.studentId.email,
      batch: e.studentId.batch,
      section: e.studentId.section,
      group: e.studentId.group,
      courseCode: e.classId.courseCode,
      courseName: e.classId.courseName,
      className: e.classId.name,
      enrolledAt: e.joinedAt
    }));

    const csv = generateEnrollmentCSV(data);

    setCSVHeaders(res, `enrollment-${semesterId}-${Date.now()}.csv`);
    res.send(csv);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Export teachers data as CSV
 * GET /admin/exports/semester/:semesterId/teachers
 */
const exportTeachersCSVHandler = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const distribution = await getTeacherLoadDistribution(semesterId);

    const csv = generateTeachersCSV(distribution.distribution);

    setCSVHeaders(res, `teachers-${semesterId}-${Date.now()}.csv`);
    res.send(csv);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Export students data as CSV
 * GET /admin/exports/semester/:semesterId/students
 */
const exportStudentsCSVHandler = async (req, res) => {
  try {
    const { semesterId } = req.params;

    // Get all classes in semester
    const classes = await Class.find({ semester: semesterId });
    const classIds = classes.map(c => c._id);

    // Get unique students
    const studentIds = await ClassStudent.distinct("studentId", {
      classId: { $in: classIds },
      leftAt: null
    });

    // Get student details with enrollment counts
    const students = await User.find({
      _id: { $in: studentIds },
      role: "student"
    }).lean();

    // Get class count for each student
    const studentsWithClasses = await Promise.all(
      students.map(async (student) => {
        const enrollments = await ClassStudent.find({
          studentId: student._id,
          classId: { $in: classIds },
          leftAt: null
        });

        return {
          ...student,
          classes: enrollments
        };
      })
    );

    const csv = generateStudentsCSV(studentsWithClasses);

    setCSVHeaders(res, `students-${semesterId}-${Date.now()}.csv`);
    res.send(csv);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Export lab utilization as CSV
 * GET /admin/exports/semester/:semesterId/lab-utilization
 */
const exportLabUtilizationCSVHandler = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const report = await getLabUtilizationReport(semesterId);

    const csv = generateLabUtilizationCSV(report.detailedUtilization);

    setCSVHeaders(res, `lab-utilization-${semesterId}-${Date.now()}.csv`);
    res.send(csv);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  getEnrollmentStatsHandler,
  getLabUtilizationHandler,
  getTeacherLoadHandler,
  exportEnrollmentCSVHandler,
  exportTeachersCSVHandler,
  exportStudentsCSVHandler,
  exportLabUtilizationCSVHandler
};