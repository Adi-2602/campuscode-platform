const Question = require("../models/question.model");
const TestCase = require("../models/testcase.model");
const Exam = require("../models/exam.model");
const Class = require("../models/class.model");
const StudentExam = require("../models/studentExam.model");
const User = require("../models/user.model");

/**
 * Sync Exam state based on current time
 */
const syncExamState = async (exam) => {
  const now = new Date();
  let changed = false;

  // Don't sync draft or resultPublished states automatically
  if (exam.state === "draft" || exam.state === "resultPublished") return exam;

  // Check if it should be ongoing
  if (now >= exam.startTime && now <= exam.endTime) {
    if (exam.state === "published") {
      exam.state = "ongoing";
      exam.status = "active";
      changed = true;
    }
  } 
  // Check if it should be ended
  else if (now > exam.endTime) {
    if (exam.state === "published" || exam.state === "ongoing") {
      exam.state = "ended";
      exam.status = "completed";
      changed = true;
    }
  }

  if (changed) {
    await exam.save();
  }
  return exam;
};

/**
 * Create Question WITH Test Cases
 * 🔥 MODIFIED: Now requires classId
 */
const createQuestionWithTestCases = async ({
  classId, // 🔥 NEW: Required parameter
  title,
  description,
  inputFormat,
  outputFormat,
  constraints,
  difficulty,
  teacherId,
  testCases
}) => {
  // 🔥 NEW: Create the question with classId
  const question = await Question.create({
    classId, // 🔥 NEW
    title,
    description,
    inputFormat,
    outputFormat,
    constraints,
    difficulty,
    createdBy: teacherId
  });

  // Create test cases if provided
  const createdTestCases = [];
  if (testCases && testCases.length > 0) {
    for (const tc of testCases) {
      const testCase = await TestCase.create({
        questionId: question._id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isPublic: tc.isPublic !== undefined ? tc.isPublic : true,
        weight: tc.weight || 1
      });
      createdTestCases.push(testCase);
    }
  }

  return {
    question,
    testCases: createdTestCases
  };
};

/**
 * Update Question WITH Test Cases
 * 🔥 NO CHANGES NEEDED - classId cannot be changed after creation
 */
const updateQuestionWithTestCases = async ({
  questionId,
  title,
  description,
  inputFormat,
  outputFormat,
  constraints,
  difficulty,
  teacherId,
  testCases
}) => {
  // Update the question (classId is NOT updatable)
  const question = await Question.findOneAndUpdate(
    { _id: questionId, createdBy: teacherId },
    {
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      difficulty
    },
    { new: true }
  );

  if (!question) return null;

  // Handle test cases if provided
  let updatedTestCases = [];
  if (testCases) {
    // Delete existing test cases for this question
    await TestCase.deleteMany({ questionId });

    // Create new test cases
    for (const tc of testCases) {
      const testCase = await TestCase.create({
        questionId: question._id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isPublic: tc.isPublic !== undefined ? tc.isPublic : true,
        weight: tc.weight || 1
      });
      updatedTestCases.push(testCase);
    }
  } else {
    // If no test cases provided, just return existing ones
    updatedTestCases = await TestCase.find({ questionId });
  }

  return {
    question,
    testCases: updatedTestCases
  };
};

/**
 * Delete Question WITH Test Cases
 * 🔥 NO CHANGES NEEDED - already validates ownership
 */
const deleteQuestionWithTestCases = async (questionId, teacherId) => {
  // Find the question and verify ownership
  const question = await Question.findOne({
    _id: questionId,
    createdBy: teacherId
  });

  if (!question) return null;

  // Delete all test cases associated with this question
  await TestCase.deleteMany({ questionId });

  // Delete the question itself
  await Question.findByIdAndDelete(questionId);

  return {
    message: "Question and associated test cases deleted successfully",
    deletedQuestionId: questionId
  };
};

/**
 * Create Exam
 * 🔥 MODIFIED: Now validates questions belong to the same class
 */
const createExam = async ({
  title,
  description,
  classId,
  questions,
  startTime,
  endTime,
  durationMinutes,
  totalMarks,
  passingMarks,
  isRandomized,
  allowedLanguages,
  status,
  state,
  maxSubmissions,
  teacherId
}) => {
  // Verify class ownership
  const classData = await Class.findOne({
    _id: classId,
    createdBy: teacherId
  });

  if (!classData) {
    throw new Error("Class not found or unauthorized");
  }

  // 🔥 MODIFIED: Verify all questions exist AND belong to this class
  const questionDocs = await Question.find({
    _id: { $in: questions },
    classId: classId, // 🔥 NEW: Must belong to same class
    createdBy: teacherId // 🔥 NEW: Must be created by same teacher
  });

  if (questionDocs.length !== questions.length) {
    throw new Error(
      "One or more questions not found or don't belong to this class"
    );
  }

  return await Exam.create({
    title,
    description,
    classId,
    questions,
    startTime,
    endTime,
    durationMinutes,
    totalMarks,
    passingMarks: passingMarks || 0,
    isRandomized,
    allowedLanguages,
    status: status || "draft",
    state: state || "draft",
    maxSubmissions: maxSubmissions || null,
    createdBy: teacherId
  });
};

/**
 * Publish Exam (change state from draft to published)
 * 🔥 NO CHANGES NEEDED
 */
const publishExam = async (examId, teacherId) => {
  const exam = await Exam.findOne({
    _id: examId,
    createdBy: teacherId
  });

  if (!exam) {
    throw new Error("Exam not found or unauthorized");
  }

  if (exam.state === "published" || exam.state === "ongoing") {
    throw new Error("Exam is already published or ongoing");
  }

  exam.state = "published";
  exam.status = "published"; // Keep old field in sync
  await exam.save();

  return exam;
};

/**
 * Get ONE exam details
 * 🔥 NEW: Added for edit functionality
 */
const getExam = async (examId, teacherId) => {
  const exam = await Exam.findOne({
    _id: examId,
    createdBy: teacherId
  }).populate("questions");

  if (!exam) {
    throw new Error("Exam not found or unauthorized");
  }

  await syncExamState(exam);
  return exam;
};

/**
 * Update Exam details
 * 🔥 NEW: Added for edit functionality
 */
const updateExam = async (examId, examData, teacherId) => {
  const {
    title,
    description,
    questions,
    startTime,
    endTime,
    durationMinutes,
    totalMarks,
    passingMarks,
    isRandomized,
    allowedLanguages,
    maxSubmissions
  } = examData;

  const exam = await Exam.findOne({
    _id: examId,
    createdBy: teacherId
  });

  if (!exam) {
    throw new Error("Exam not found or unauthorized");
  }

  // If questions are being updated, verify they belong to same class and teacher
  if (questions) {
    const questionDocs = await Question.find({
      _id: { $in: questions },
      classId: exam.classId,
      createdBy: teacherId
    });

    if (questionDocs.length !== questions.length) {
      throw new Error(
        "One or more questions not found or don't belong to this class"
      );
    }
    exam.questions = questions;
  }

  // Update other fields
  if (title) exam.title = title;
  if (description !== undefined) exam.description = description;
  if (startTime) exam.startTime = startTime;
  if (endTime) exam.endTime = endTime;
  if (durationMinutes) exam.durationMinutes = durationMinutes;
  if (totalMarks) exam.totalMarks = totalMarks;
  if (passingMarks !== undefined) exam.passingMarks = passingMarks;
  if (isRandomized !== undefined) exam.isRandomized = isRandomized;
  if (allowedLanguages) exam.allowedLanguages = allowedLanguages;
  if (maxSubmissions !== undefined) exam.maxSubmissions = maxSubmissions;

  await exam.save();
  return exam;
};

/**
 * Delete Exam
 */
const deleteExam = async (examId, teacherId) => {
  const exam = await Exam.findOne({ _id: examId, createdBy: teacherId });
  if (!exam) {
    throw new Error("Exam not found or unauthorized");
  }
  await Exam.findByIdAndDelete(examId);
  return { message: "Exam deleted successfully" };
};

/**
 * Get all exams for a specific class
 * 🔥 NO CHANGES NEEDED
 */
const getExamsByClass = async (classId, teacherId) => {
  // Verify class ownership
  const classData = await Class.findOne({
    _id: classId,
    createdBy: teacherId
  });

  if (!classData) {
    throw new Error("Class not found or unauthorized");
  }

  const exams = await Exam.find({ classId })
    .populate("classId", "name courseCode courseName section batch group")
    .populate("questions", "title difficulty")
    .sort({ createdAt: -1 });

  // Sync states for all exams found
  for (const exam of exams) {
    await syncExamState(exam);
  }

  return exams;
};

/**
 * Get ALL questions by teacher WITH test cases
 * 🔥 MODIFIED: Now also populates classId
 */
const getQuestionsWithTestCasesByTeacher = async (teacherId) => {
  const questions = await Question.find({ createdBy: teacherId })
    .populate("classId", "name code") // 🔥 NEW: Populate class info
    .sort({ createdAt: -1 });

  const result = [];

  for (const question of questions) {
    const testCases = await TestCase.find({
      questionId: question._id
    });

    result.push({
      question,
      testCases
    });
  }

  return result;
};

/**
 * 🔥 NEW: Get questions by specific class WITH test cases
 */
const getQuestionsByClass = async (classId, teacherId) => {
  const questions = await Question.find({
    classId,
    createdBy: teacherId,
    isActive: true
  })
    .populate("classId", "name code")
    .sort({ createdAt: -1 });

  const result = [];

  for (const question of questions) {
    const testCases = await TestCase.find({
      questionId: question._id
    });

    result.push({
      question,
      testCases
    });
  }

  return result;
};

/**
 * Get ONE question with its test cases
 * 🔥 MODIFIED: Now also populates classId
 */
const getQuestionWithTestCases = async (questionId) => {
  const question = await Question.findById(questionId)
    .populate("classId", "name code"); // 🔥 NEW: Populate class info

  if (!question) return null;

  const testCases = await TestCase.find({ questionId });

  return { question, testCases };
};

/**
 * Get students who submitted a specific exam
 */
const getSubmittedStudents = async (examId, teacherId) => {
  // Verify exam ownership
  const exam = await Exam.findOne({ _id: examId, createdBy: teacherId });
  if (!exam) {
    throw new Error("Exam not found or unauthorized");
  }

  // Find all studentExam records for this exam where isSubmitted is true
  const submitters = await StudentExam.find({ 
    examId, 
    isSubmitted: true 
  }).populate("studentId", "name email rollNo registrationNumber section batch group studentName");

  return submitters;
};

module.exports = {
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
  getQuestionsByClass, // 🔥 NEW: Export new function
  getSubmittedStudents
};