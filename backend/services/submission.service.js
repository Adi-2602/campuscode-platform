const Exam = require("../models/exam.model");
const StudentExam = require("../models/studentExam.model");
const Submission = require("../models/submission.model");
const { submitCode } = require("./judge0.service");
const { isStudentInClass } = require("./classStudent.service");

const {
  autoSubmitExamIfExpired
} = require("./student.service");

/**
 * Submit code for a question (student) - MODIFIED with class validation
 */
const submitStudentCode = async ({
  studentId,
  examId,
  questionId,
  languageId,
  sourceCode,
  stdin
}) => {
  // 1️⃣ Check exam
  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new Error("Exam not found");
  }

  // NEW: Verify class membership
  const isEnrolled = await isStudentInClass(studentId, exam.classId);
  if (!isEnrolled) {
    throw new Error("You are not enrolled in this class");
  }

  // NEW: Check exam state
  if (exam.state !== "published" && exam.state !== "ongoing") {
    throw new Error("Exam not available");
  }

  // Check old status for backward compatibility
  if (exam.status !== "published" && exam.status !== "active") {
    throw new Error("Exam not available");
  }

  // 1.1️⃣ Check allowed languages
  if (
    !Array.isArray(exam.allowedLanguages) ||
    !exam.allowedLanguages.map(Number).includes(Number(languageId))
  ) {
    throw new Error("Language not allowed for this exam");
  }

  // 2️⃣ Auto-submit if exam expired + get studentExam
  const studentExam = await autoSubmitExamIfExpired({
    studentId,
    examId
  });

  // Block if already submitted
  if (studentExam.isSubmitted) {
    throw new Error("Exam already submitted");
  }

  // 3️⃣ Check question assignment
  const isAssigned = studentExam.assignedQuestions.some(
    qId => qId.toString() === questionId
  );

  if (!isAssigned) {
    throw new Error("Question not assigned to student");
  }

  // NEW: 3.1️⃣ Check maxSubmissions limit
  if (exam.maxSubmissions !== null && exam.maxSubmissions > 0) {
    const submissionCount = await Submission.countDocuments({
      studentId,
      examId,
      questionId
    });

    if (submissionCount >= exam.maxSubmissions) {
      throw new Error(
        `Maximum submission limit (${exam.maxSubmissions}) reached for this question`
      );
    }
  }

  // 4️⃣ Call Judge0 (existing service)
  const result = await submitCode({
    language_id: languageId,
    source_code: sourceCode,
    stdin
  });

  // 5️⃣ Store submission (with classId)
  const submission = await Submission.create({
    studentId,
    examId,
    classId: exam.classId, // NEW
    questionId,
    languageId,
    sourceCode,
    stdout: result.stdout,
    stderr: result.stderr,
    compileOutput: result.compile_output,
    status: result.status?.description,
    time: result.time,
    memory: result.memory
  });

  return submission;
};

module.exports = {
  submitStudentCode
};