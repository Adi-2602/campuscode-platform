const {
  startExam,
  getAssignedQuestions,
  autoSubmitExamIfExpired,
  getPublishedExamsByClass
} = require("../services/student.service");

const Exam = require("../models/exam.model");
const StudentExam = require("../models/studentExam.model");
const { runAutoEvaluation } = require("../services/autoEvaluation.service");

/**
 * Start or Resume Exam
 */
const startExamHandler = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!examId) {
      return res.status(400).json({
        error: "examId is required"
      });
    }

    const studentExam = await startExam({
      studentId: req.user.id,
      examId
    });

    res.json({
      message: "Exam started",
      studentExam
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get assigned questions
 */
const getAssignedQuestionsHandler = async (req, res) => {
  try {
    const { examId } = req.params;

    const result = await getAssignedQuestions({
      studentId: req.user.id,
      examId
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * 🔥 Submit Exam (TRIGGERS AUTO EVALUATION)
 */
const submitExamHandler = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;

    const studentExam = await StudentExam.findOne({
      studentId,
      examId
    });

    if (!studentExam) {
      return res.status(400).json({
        error: "Exam not started"
      });
    }

    if (studentExam.isSubmitted) {
      return res.status(400).json({
        error: "Exam already submitted"
      });
    }

    // Lock exam
    studentExam.isSubmitted = true;
    studentExam.submittedAt = new Date();
    await studentExam.save();

    // 🔥 TRIGGER AUTO EVALUATION
    const exam = await Exam.findById(examId);
    
    await runAutoEvaluation({
      studentId,
      exam
    });

    res.json({
      message: "Exam submitted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * NEW: Get published exams for a class
 * GET /student/classes/:classId/exams
 */
const getPublishedExamsHandler = async (req, res) => {
  try {
    const { classId } = req.params;

    const exams = await getPublishedExamsByClass(req.user.id, classId);

    res.json({
      exams
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * NEW: Get Student Profile
 * GET /student/profile
 */
const getStudentProfileHandler = async (req, res) => {
  try {
    const student = await require("../models/user.model").findById(req.user.id).select("-password -__v");
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json({ user: student });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  startExamHandler,
  getAssignedQuestionsHandler,
  submitExamHandler,
  getPublishedExamsHandler,
  getStudentProfileHandler // NEW
};