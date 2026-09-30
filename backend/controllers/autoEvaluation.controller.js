const { runAutoEvaluation } = require("../services/autoEvaluation.service");
const AutoEvaluation = require("../models/autoEvaluation.model");
const Exam = require("../models/exam.model");
const StudentExam = require("../models/studentExam.model");
const mongoose = require("mongoose");

/**
 * Manually trigger auto-evaluation for a student's exam
 * POST /teacher/exams/:examId/students/:studentId/auto-evaluate
 */
const triggerAutoEvaluationHandler = async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    if (!examId || !studentId) {
      return res.status(400).json({
        error: "examId and studentId are required"
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        error: "Invalid examId format"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        error: "Invalid studentId format"
      });
    }

    // Verify exam exists and teacher owns it
    const exam = await Exam.findOne({
      _id: examId,
      createdBy: req.user.id
    });

    if (!exam) {
      return res.status(404).json({
        error: "Exam not found or unauthorized"
      });
    }

    // Verify student has started the exam
    const studentExam = await StudentExam.findOne({
      studentId,
      examId
    });

    if (!studentExam) {
      return res.status(400).json({
        error: "Student has not started this exam"
      });
    }

    // Check if student has submitted
    if (!studentExam.isSubmitted) {
      return res.status(400).json({
        error: "Cannot evaluate - student has not submitted the exam yet"
      });
    }

    // Run auto-evaluation
    await runAutoEvaluation({
      studentId,
      exam
    });

    res.json({
      message: "Auto-evaluation triggered successfully",
      examId,
      studentId
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get all auto-evaluation results for an exam
 * GET /teacher/exams/:examId/auto-evaluations
 */
const getExamAutoEvaluationsHandler = async (req, res) => {
  try {
    const { examId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        error: "Invalid examId format"
      });
    }

    // Verify exam exists and teacher owns it
    const exam = await Exam.findOne({
      _id: examId,
      createdBy: req.user.id
    });

    if (!exam) {
      return res.status(404).json({
        error: "Exam not found or unauthorized"
      });
    }

    // Get all auto-evaluations for this exam
    const evaluations = await AutoEvaluation.find({ examId })
      .populate("studentId", "name email rollNo")
      .populate("questionId", "title difficulty")
      .sort({ createdAt: -1 });

    // Group by student
    const studentEvaluations = {};

    for (const evaluation of evaluations) {
      // Convert ObjectId to string for grouping
      const studentId = evaluation.studentId._id.toString();

      if (!studentEvaluations[studentId]) {
        studentEvaluations[studentId] = {
          student: evaluation.studentId,
          totalMarksObtained: 0,
          totalTestCasesPassed: 0,
          totalTestCases: 0,
          questions: []
        };
      }

      studentEvaluations[studentId].totalMarksObtained += evaluation.marksObtained;
      studentEvaluations[studentId].totalTestCasesPassed += evaluation.passedTestCases;
      studentEvaluations[studentId].totalTestCases += evaluation.totalTestCases;

      studentEvaluations[studentId].questions.push({
        question: evaluation.questionId,
        passedTestCases: evaluation.passedTestCases,
        totalTestCases: evaluation.totalTestCases,
        marksObtained: evaluation.marksObtained,
        executionStats: evaluation.executionStats,
        evaluatedAt: evaluation.createdAt
      });
    }

    res.json({
      exam: {
        id: exam._id,
        title: exam.title,
        totalMarks: exam.totalMarks
      },
      evaluations: Object.values(studentEvaluations),
      totalStudentsEvaluated: Object.keys(studentEvaluations).length
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get auto-evaluation results for a specific student's exam
 * GET /teacher/students/:studentId/exams/:examId/auto-evaluation
 */
const getStudentAutoEvaluationHandler = async (req, res) => {
  try {
    const { studentId, examId } = req.params;

    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        error: "Invalid examId format"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        error: "Invalid studentId format"
      });
    }

    // Verify exam exists and teacher owns it
    const exam = await Exam.findOne({
      _id: examId,
      createdBy: req.user.id
    });

    if (!exam) {
      return res.status(404).json({
        error: "Exam not found or unauthorized"
      });
    }

    // Get auto-evaluations for this student and exam
    const evaluations = await AutoEvaluation.find({
      studentId,
      examId
    })
      .populate("questionId", "title difficulty")
      .sort({ createdAt: -1 });

    if (!evaluations.length) {
      return res.status(404).json({
        error: "No auto-evaluation found for this student"
      });
    }

    // Calculate totals
    let totalMarksObtained = 0;
    let totalTestCasesPassed = 0;
    let totalTestCases = 0;

    const questionResults = evaluations.map((evaluation) => {
      totalMarksObtained += evaluation.marksObtained;
      totalTestCasesPassed += evaluation.passedTestCases;
      totalTestCases += evaluation.totalTestCases;

      return {
        question: evaluation.questionId,
        passedTestCases: evaluation.passedTestCases,
        totalTestCases: evaluation.totalTestCases,
        marksObtained: evaluation.marksObtained,
        executionStats: evaluation.executionStats,
        evaluatedAt: evaluation.createdAt
      };
    });

    res.json({
      exam: {
        id: exam._id,
        title: exam.title,
        totalMarks: exam.totalMarks
      },
      studentId,
      summary: {
        totalMarksObtained,
        totalTestCasesPassed,
        totalTestCases,
        percentage: totalTestCases > 0 
          ? ((totalTestCasesPassed / totalTestCases) * 100).toFixed(2)
          : 0
      },
      questionResults
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get auto-evaluation statistics for an exam
 * GET /teacher/exams/:examId/auto-evaluation-stats
 */
const getAutoEvaluationStatsHandler = async (req, res) => {
  try {
    const { examId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        error: "Invalid examId format"
      });
    }

    // Verify exam exists and teacher owns it
    const exam = await Exam.findOne({
      _id: examId,
      createdBy: req.user.id
    });

    if (!exam) {
      return res.status(404).json({
        error: "Exam not found or unauthorized"
      });
    }

    // Get all auto-evaluations for this exam
    const evaluations = await AutoEvaluation.find({ examId });

    if (!evaluations.length) {
      return res.json({
        exam: {
          id: exam._id,
          title: exam.title,
          totalMarks: exam.totalMarks
        },
        statistics: {
          totalStudents: 0,
          averageMarks: 0,
          highestMarks: 0,
          lowestMarks: 0,
          averageTestCasePassRate: 0
        }
      });
    }

    // Group by student to calculate statistics
    const studentMarks = {};

    for (const evaluation of evaluations) {
      // Convert ObjectId to string for grouping
      const studentId = evaluation.studentId.toString();

      if (!studentMarks[studentId]) {
        studentMarks[studentId] = {
          totalMarks: 0,
          passedTestCases: 0,
          totalTestCases: 0
        };
      }

      studentMarks[studentId].totalMarks += evaluation.marksObtained;
      studentMarks[studentId].passedTestCases += evaluation.passedTestCases;
      studentMarks[studentId].totalTestCases += evaluation.totalTestCases;
    }

    const marksArray = Object.values(studentMarks).map((s) => s.totalMarks);
    const passRates = Object.values(studentMarks).map((s) =>
      s.totalTestCases > 0 ? (s.passedTestCases / s.totalTestCases) * 100 : 0
    );

    const statistics = {
      totalStudents: Object.keys(studentMarks).length,
      averageMarks: (
        marksArray.reduce((a, b) => a + b, 0) / marksArray.length
      ).toFixed(2),
      highestMarks: Math.max(...marksArray),
      lowestMarks: Math.min(...marksArray),
      averageTestCasePassRate: (
        passRates.reduce((a, b) => a + b, 0) / passRates.length
      ).toFixed(2) + "%"
    };

    res.json({
      exam: {
        id: exam._id,
        title: exam.title,
        totalMarks: exam.totalMarks
      },
      statistics
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  triggerAutoEvaluationHandler,
  getExamAutoEvaluationsHandler,
  getStudentAutoEvaluationHandler,
  getAutoEvaluationStatsHandler
};