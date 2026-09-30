const {
  createQuestionWithTestCases,
  updateQuestionWithTestCases,
  deleteQuestionWithTestCases,
  createExam,
  publishExam,
  getExamsByClass,
  getExam, // 🔥 NEW
  updateExam, // 🔥 NEW
  deleteExam, // 🔥 NEW
  getQuestionsWithTestCasesByTeacher,
  getQuestionWithTestCases,
  getQuestionsByClass, // 🔥 NEW: Get questions filtered by class
  getSubmittedStudents
} = require("../services/teacher.service");

const {
  runAutoEvaluation
} = require("../services/autoEvaluation.service"); // 🔥 NEW: Import auto-evaluation service

const Class = require("../models/class.model");
const Question = require("../models/question.model");
const Exam = require("../models/exam.model"); // 🔥 NEW: Import Exam model

/**
 * Create Question WITH Test Cases
 * 🔥 MODIFIED: Now requires classId
 */
const createQuestionWithTestCasesHandler = async (req, res) => {
  try {
    const {
      classId, // 🔥 NEW: Required field
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      difficulty,
      testCases
    } = req.body;

    // 🔥 NEW: Validate required fields
    if (!classId || !title || !description) {
      return res.status(400).json({
        error: "classId, title and description are required"
      });
    }

    // 🔥 NEW: Validate class exists and teacher owns it
    const classDoc = await Class.findOne({
      _id: classId,
      createdBy: req.user.id
    });

    if (!classDoc) {
      return res.status(404).json({
        error: "Class not found or you don't have permission to add questions to this class"
      });
    }

    // Validate test cases if provided
    if (testCases && testCases.length > 0) {
      for (const tc of testCases) {
        if (!tc.input || !tc.expectedOutput) {
          return res.status(400).json({
            error: "Each test case must have input and expectedOutput"
          });
        }
      }
    }

    const result = await createQuestionWithTestCases({
      classId, // 🔥 NEW: Pass classId to service
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      difficulty,
      teacherId: req.user.id,
      testCases: testCases || []
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update Question WITH Test Cases
 * 🔥 MODIFIED: Validates class ownership
 */
const updateQuestionWithTestCasesHandler = async (req, res) => {
  try {
    const { questionId } = req.params;
    const {
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      difficulty,
      testCases
    } = req.body;

    // 🔥 NEW: Validate question belongs to teacher's class
    const question = await Question.findOne({
      _id: questionId,
      createdBy: req.user.id
    }).populate('classId');

    if (!question) {
      return res.status(404).json({
        error: "Question not found or unauthorized"
      });
    }

    // 🔥 NEW: Verify class ownership
    if (question.classId.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        error: "You don't have permission to update questions in this class"
      });
    }

    const result = await updateQuestionWithTestCases({
      questionId,
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      difficulty,
      teacherId: req.user.id,
      testCases
    });

    if (!result) {
      return res.status(404).json({
        error: "Question not found or unauthorized"
      });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete Question WITH Test Cases
 * 🔥 MODIFIED: Validates class ownership
 */
const deleteQuestionWithTestCasesHandler = async (req, res) => {
  try {
    const { questionId } = req.params;

    // 🔥 NEW: Validate question belongs to teacher's class
    const question = await Question.findOne({
      _id: questionId,
      createdBy: req.user.id
    }).populate('classId');

    if (!question) {
      return res.status(404).json({
        error: "Question not found or unauthorized"
      });
    }

    // 🔥 NEW: Verify class ownership
    if (question.classId.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        error: "You don't have permission to delete questions from this class"
      });
    }

    const result = await deleteQuestionWithTestCases(
      questionId,
      req.user.id
    );

    if (!result) {
      return res.status(404).json({
        error: "Question not found or unauthorized"
      });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create Exam
 * 🔥 MODIFIED: Validates all questions belong to the same class
 */
const createExamHandler = async (req, res) => {
  try {
    const {
      title,
      description,
      classId,
      questions,
      startTime,
      endTime,
      durationMinutes,
      totalMarks,
      isRandomized,
      allowedLanguages,
      status,
      state,
      maxSubmissions,
      passingMarks
    } = req.body;

    if (
      !title ||
      !classId ||
      !questions ||
      !startTime ||
      !endTime ||
      !durationMinutes ||
      !totalMarks
    ) {
      return res.status(400).json({
        error: "Missing required exam fields (title, classId, questions, startTime, endTime, durationMinutes, totalMarks)"
      });
    }

    // 🔥 NEW: Validate class exists and teacher owns it
    const classDoc = await Class.findOne({
      _id: classId,
      createdBy: req.user.id
    });

    if (!classDoc) {
      return res.status(404).json({
        error: "Class not found or you don't have permission to create exams in this class"
      });
    }

    // 🔥 NEW: Validate all questions belong to this class
    const questionDocs = await Question.find({
      _id: { $in: questions },
      classId: classId,
      createdBy: req.user.id
    });

    if (questionDocs.length !== questions.length) {
      return res.status(400).json({
        error: "All questions must belong to the same class as the exam and be created by you"
      });
    }

    const exam = await createExam({
      title,
      description,
      classId,
      questions,
      startTime,
      endTime,
      durationMinutes,
      totalMarks,
      isRandomized,
      allowedLanguages,
      status,
      state,
      maxSubmissions,
      passingMarks,
      teacherId: req.user.id
    });

    res.status(201).json({ 
      message: "Exam created successfully",
      exam 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Publish Exam
 */
const publishExamHandler = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await publishExam(examId, req.user.id);

    res.json({
      message: "Exam published successfully",
      exam
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get all exams for a class
 */
const getExamsByClassHandler = async (req, res) => {
  try {
    const { classId } = req.params;

    const exams = await getExamsByClass(classId, req.user.id);

    res.json({
      exams
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get ONE exam details
 * 🔥 NEW: Added for edit functionality
 */
const getExamHandler = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await getExam(examId, req.user.id);
    res.json({ exam });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Update Exam details
 * 🔥 NEW: Added for edit functionality
 */
const updateExamHandler = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await updateExam(examId, req.body, req.user.id);
    res.json({
      message: "Exam updated successfully",
      exam
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete Exam
 */
const deleteExamHandler = async (req, res) => {
  try {
    const { examId } = req.params;
    const result = await deleteExam(examId, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get ALL questions + test cases
 * 🔥 MODIFIED: Optionally filter by classId
 */
const getMyQuestionsHandler = async (req, res) => {
  try {
    const { classId } = req.query; // 🔥 NEW: Optional query parameter

    let questions;
    
    if (classId) {
      // 🔥 NEW: Get questions for specific class
      questions = await getQuestionsByClass(classId, req.user.id);
    } else {
      // Get all questions by teacher
      questions = await getQuestionsWithTestCasesByTeacher(req.user.id);
    }

    res.status(200).json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get ONE question + test cases
 */
const getQuestionWithTestCasesHandler = async (req, res) => {
  try {
    const { questionId } = req.params;

    const data = await getQuestionWithTestCases(questionId);

    if (!data) {
      return res.status(404).json({
        error: "Question not found"
      });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 🔥 NEW: Get questions for a specific class
 * GET /teacher/classes/:classId/questions
 */
const getQuestionsByClassHandler = async (req, res) => {
  try {
    const { classId } = req.params;

    // Validate class exists and teacher owns it
    const classDoc = await Class.findOne({
      _id: classId,
      createdBy: req.user.id
    });

    if (!classDoc) {
      return res.status(404).json({
        error: "Class not found or you don't have permission"
      });
    }

    const questions = await getQuestionsByClass(classId, req.user.id);

    res.status(200).json({ 
      class: {
        _id: classDoc._id,
        name: classDoc.name,
        code: classDoc.code
      },
      questions 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get students who submitted a specific exam
 */
const getSubmittedStudentsHandler = async (req, res) => {
  try {
    const { examId } = req.params;
    const students = await getSubmittedStudents(examId, req.user.id);
    res.status(200).json({ students });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 🔥 NEW: Rerun auto-evaluation for a specific student's exam submission
 */
const rerunAutoEvaluationHandler = async (req, res) => {
  try {
    const { examId, studentId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    // Ensure the teacher owns the exam
    if (exam.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to re-evaluate this exam" });
    }

    await runAutoEvaluation({ studentId, exam });
    res.json({ message: "Auto-evaluation re-run successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createQuestionWithTestCasesHandler,
  updateQuestionWithTestCasesHandler,
  deleteQuestionWithTestCasesHandler,
  createExamHandler,
  publishExamHandler,
  getExamsByClassHandler,
  getExamHandler, // 🔥 NEW
  updateExamHandler, // 🔥 NEW
  deleteExamHandler, // 🔥 NEW
  getMyQuestionsHandler,
  getQuestionWithTestCasesHandler,
  getQuestionsByClassHandler, // 🔥 NEW
  getSubmittedStudentsHandler,
  rerunAutoEvaluationHandler // 🔥 NEW
};