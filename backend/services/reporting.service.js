const {
  generatePDF,
  savePDFToFile,
  generateStudentReport,
  generateExamReport
} = require("../utils/pdfGenerator");

const {
  getStudentPerformanceAnalytics,
  getExamStatistics,
  getClassPerformanceMetrics,
  getTeacherActivityAnalytics
} = require("./analytics.service");

const User = require("../models/user.model");
const Exam = require("../models/exam.model");
const Class = require("../models/class.model");
const FinalResult = require("../models/finalResult.model");

/**
 * Generate student performance report
 */
const generateStudentPerformanceReport = async (studentId, options = {}) => {
  try {
    // Get student data
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Get performance analytics
    const analytics = await getStudentPerformanceAnalytics({ studentId });

    if (analytics.students.length === 0) {
      throw new Error("No performance data available for this student");
    }

    const studentData = analytics.students[0];

    // Get detailed exam results
    const examResults = await FinalResult.find({ studentId })
      .populate("examId", "title startTime totalMarks")
      .sort({ createdAt: -1 })
      .lean();

    const examResultsFormatted = examResults.map((result) => ({
      Exam: result.examId?.title || "Unknown",
      Date: result.examId?.startTime 
        ? new Date(result.examId.startTime).toLocaleDateString()
        : "N/A",
      Score: result.finalTotal || 0,
      Total: result.examId?.totalMarks || 0,
      Percentage: result.examId?.totalMarks 
        ? ((result.finalTotal / result.examId.totalMarks) * 100).toFixed(2) + "%"
        : "N/A",
      Status: result.status === "pass" ? "PASS" : "FAIL"
    }));

    // Build report data
    const reportData = generateStudentReport({
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      studentRollNo: student.rollNo,
      totalExams: studentData.totalExams,
      averageScore: studentData.averageScore,
      averagePercentage: studentData.averagePercentage,
      passRate: studentData.passRate,
      highestScore: studentData.highestScore,
      lowestScore: studentData.lowestScore,
      examResults: examResultsFormatted,
      analysis: generatePerformanceAnalysis(studentData)
    });

    // Generate PDF
    if (options.saveToFile) {
      const filename = `student_report_${studentId}_${Date.now()}.pdf`;
      const filePath = await savePDFToFile(reportData, filename);
      return { filePath, filename };
    } else {
      return new Promise((resolve, reject) => {
        generatePDF(reportData, (buffer) => {
          resolve(buffer);
        });
      });
    }
  } catch (error) {
    throw new Error(`Failed to generate student report: ${error.message}`);
  }
};

/**
 * Generate exam analysis report
 */
const generateExamAnalysisReport = async (examId, options = {}) => {
  try {
    // Get exam data
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new Error("Exam not found");
    }

    // Get exam statistics
    const statistics = await getExamStatistics({ examId });

    if (statistics.exams.length === 0) {
      throw new Error("No statistics available for this exam");
    }

    const examStats = statistics.exams[0];

    // Get student results
    const results = await FinalResult.find({ examId })
      .populate("studentId", "name email rollNo")
      .sort({ finalTotal: -1 })
      .lean();

    const studentResults = results.map((result) => ({
      Student: result.studentId?.name || "Unknown",
      "Roll No": result.studentId?.rollNo || "N/A",
      Score: result.finalTotal || 0,
      Percentage: exam.totalMarks 
        ? ((result.finalTotal / exam.totalMarks) * 100).toFixed(2) + "%"
        : "N/A",
      Status: result.status === "pass" ? "PASS" : "FAIL"
    }));

    // Build report data
    const reportData = generateExamReport({
      examId: exam._id,
      examTitle: exam.title,
      examDate: exam.startTime 
        ? new Date(exam.startTime).toLocaleDateString()
        : "N/A",
      totalStudents: examStats.totalStudents,
      submittedStudents: examStats.submittedStudents,
      completionRate: examStats.completionRate,
      averageScore: examStats.averageScore,
      passRate: examStats.passRate,
      highestScore: examStats.highestScore,
      lowestScore: examStats.lowestScore,
      studentResults
    });

    // Generate PDF
    if (options.saveToFile) {
      const filename = `exam_report_${examId}_${Date.now()}.pdf`;
      const filePath = await savePDFToFile(reportData, filename);
      return { filePath, filename };
    } else {
      return new Promise((resolve, reject) => {
        generatePDF(reportData, (buffer) => {
          resolve(buffer);
        });
      });
    }
  } catch (error) {
    throw new Error(`Failed to generate exam report: ${error.message}`);
  }
};

/**
 * Generate class performance report
 */
const generateClassPerformanceReport = async (classId, options = {}) => {
  try {
    // Get class data
    const classData = await Class.findById(classId);
    if (!classData) {
      throw new Error("Class not found");
    }

    // Get class metrics
    const metrics = await getClassPerformanceMetrics(classId);

    // Get all exams for this class
    const exams = await Exam.find({ classId }).lean();

    const examList = exams.map((exam) => ({
      Exam: exam.title,
      Date: exam.startTime 
        ? new Date(exam.startTime).toLocaleDateString()
        : "N/A",
      "Total Marks": exam.totalMarks,
      State: exam.state,
      Duration: `${exam.durationMinutes} min`
    }));

    // Build report data
    const reportData = {
      title: "Class Performance Report",
      subtitle: classData.name,
      metadata: {
        "Class Code": classData.code,
        "Class ID": classData._id,
        "Total Students": metrics.studentCount,
        "Total Exams": metrics.examCount || 0,
        "Report Date": new Date().toLocaleDateString()
      },
      summary: {
        "Total Students": metrics.studentCount,
        "Total Exams": metrics.examCount || 0,
        "Average Score": metrics.averageScore 
          ? `${metrics.averageScore.toFixed(2)}%`
          : "N/A",
        "Pass Rate": metrics.passRate 
          ? `${metrics.passRate.toFixed(2)}%`
          : "N/A",
        "Total Results": metrics.totalResults || 0
      },
      tables: exams.length > 0 ? [
        {
          title: "Exams in Class",
          headers: ["Exam", "Date", "Total Marks", "State", "Duration"],
          rows: examList
        }
      ] : [],
      sections: [
        {
          title: "Class Overview",
          content: `This class has ${metrics.studentCount} enrolled students and ${metrics.examCount || 0} exams conducted.`
        }
      ]
    };

    // Generate PDF
    if (options.saveToFile) {
      const filename = `class_report_${classId}_${Date.now()}.pdf`;
      const filePath = await savePDFToFile(reportData, filename);
      return { filePath, filename };
    } else {
      return new Promise((resolve, reject) => {
        generatePDF(reportData, (buffer) => {
          resolve(buffer);
        });
      });
    }
  } catch (error) {
    throw new Error(`Failed to generate class report: ${error.message}`);
  }
};

/**
 * Generate teacher activity report
 */
const generateTeacherActivityReport = async (teacherId, options = {}) => {
  try {
    // Get teacher data
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Get activity analytics
    const analytics = await getTeacherActivityAnalytics(teacherId);

    // Get teacher's classes
    const classes = await Class.find({ createdBy: teacherId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const classList = classes.map((cls) => ({
      "Class Name": cls.name,
      "Class Code": cls.code,
      "Created": new Date(cls.createdAt).toLocaleDateString(),
      "Locked": cls.isLocked ? "Yes" : "No"
    }));

    // Build report data
    const reportData = {
      title: "Teacher Activity Report",
      subtitle: teacher.name,
      metadata: {
        "Teacher ID": teacher._id,
        "Email": teacher.email,
        "Status": teacher.isVerified ? "Verified" : "Pending",
        "Report Date": new Date().toLocaleDateString()
      },
      summary: {
        "Classes Created": analytics.classesCreated,
        "Exams Created": analytics.examsCreated,
        "Questions Created": analytics.questionsCreated,
        "Total Students": analytics.totalStudents,
        "Total Submissions": analytics.totalSubmissions,
        "Active Exams": analytics.examsByState.ongoing || 0
      },
      tables: classes.length > 0 ? [
        {
          title: "Recent Classes",
          headers: ["Class Name", "Class Code", "Created", "Locked"],
          rows: classList
        }
      ] : [],
      sections: [
        {
          title: "Exam Distribution",
          content: [
            `Draft: ${analytics.examsByState.draft}`,
            `Published: ${analytics.examsByState.published}`,
            `Ongoing: ${analytics.examsByState.ongoing}`,
            `Ended: ${analytics.examsByState.ended}`,
            `Results Published: ${analytics.examsByState.resultPublished}`
          ]
        }
      ]
    };

    // Generate PDF
    if (options.saveToFile) {
      const filename = `teacher_report_${teacherId}_${Date.now()}.pdf`;
      const filePath = await savePDFToFile(reportData, filename);
      return { filePath, filename };
    } else {
      return new Promise((resolve, reject) => {
        generatePDF(reportData, (buffer) => {
          resolve(buffer);
        });
      });
    }
  } catch (error) {
    throw new Error(`Failed to generate teacher report: ${error.message}`);
  }
};

/**
 * Generate custom report with filters
 */
const generateCustomReport = async (reportType, filters, options = {}) => {
  try {
    switch (reportType) {
      case "student_performance":
        if (!filters.studentId) {
          throw new Error("studentId is required for student performance report");
        }
        return await generateStudentPerformanceReport(filters.studentId, options);

      case "exam_analysis":
        if (!filters.examId) {
          throw new Error("examId is required for exam analysis report");
        }
        return await generateExamAnalysisReport(filters.examId, options);

      case "class_performance":
        if (!filters.classId) {
          throw new Error("classId is required for class performance report");
        }
        return await generateClassPerformanceReport(filters.classId, options);

      case "teacher_activity":
        if (!filters.teacherId) {
          throw new Error("teacherId is required for teacher activity report");
        }
        return await generateTeacherActivityReport(filters.teacherId, options);

      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  } catch (error) {
    throw new Error(`Failed to generate custom report: ${error.message}`);
  }
};

/**
 * Helper: Generate performance analysis text
 */
const generatePerformanceAnalysis = (studentData) => {
  const analysis = [];

  // Overall performance
  if (studentData.averagePercentage >= 90) {
    analysis.push("Excellent performance! The student consistently achieves top scores.");
  } else if (studentData.averagePercentage >= 75) {
    analysis.push("Good performance with room for improvement in certain areas.");
  } else if (studentData.averagePercentage >= 60) {
    analysis.push("Average performance. Additional practice recommended.");
  } else {
    analysis.push("Below average performance. Immediate intervention recommended.");
  }

  // Pass rate
  if (studentData.passRate >= 90) {
    analysis.push("Strong consistency with very high pass rate.");
  } else if (studentData.passRate >= 70) {
    analysis.push("Good pass rate with occasional challenges.");
  } else if (studentData.passRate < 50) {
    analysis.push("Low pass rate indicates need for additional support.");
  }

  // Score variance
  const variance = studentData.highestScore - studentData.lowestScore;
  if (variance > 30) {
    analysis.push("High score variance suggests inconsistent performance across exams.");
  } else if (variance < 15) {
    analysis.push("Consistent performance across all exams.");
  }

  return analysis.join(" ");
};

/**
 * List available report types
 */
const getAvailableReportTypes = () => {
  return [
    {
      type: "student_performance",
      name: "Student Performance Report",
      description: "Detailed analysis of individual student performance",
      requiredFilters: ["studentId"]
    },
    {
      type: "exam_analysis",
      name: "Exam Analysis Report",
      description: "Comprehensive exam statistics and student results",
      requiredFilters: ["examId"]
    },
    {
      type: "class_performance",
      name: "Class Performance Report",
      description: "Class-wide performance metrics and exam list",
      requiredFilters: ["classId"]
    },
    {
      type: "teacher_activity",
      name: "Teacher Activity Report",
      description: "Teacher's classes, exams, and student reach",
      requiredFilters: ["teacherId"]
    }
  ];
};

module.exports = {
  generateStudentPerformanceReport,
  generateExamAnalysisReport,
  generateClassPerformanceReport,
  generateTeacherActivityReport,
  generateCustomReport,
  getAvailableReportTypes
};