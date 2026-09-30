const Exam = require("../models/exam.model");
const StudentExam = require("../models/studentExam.model");
const Question = require("../models/question.model");
const TestCase = require("../models/testcase.model"); // ✨ NEW: For public test cases
const { isStudentInClass } = require("./classStudent.service");

// 🔥 Auto Evaluation Service
const { runAutoEvaluation } = require("./autoEvaluation.service");

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

  if (changed && exam.save) {
    await exam.save();
  }
  return exam;
};

/**
 * Start or Resume Exam (MODIFIED - validates class membership)
 */
const startExam = async ({ studentId, examId }) => {
  // Check exam exists
  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new Error("Exam not found");
  }

  // NEW: Verify student is enrolled in the class
  const isEnrolled = await isStudentInClass(studentId, exam.classId);
  if (!isEnrolled) {
    throw new Error("You are not enrolled in this class");
  }

  // NEW: Check exam state (must be published or ongoing)
  if (exam.state !== "published" && exam.state !== "ongoing") {
    throw new Error("Exam is not available");
  }

  // Check old status field for backward compatibility
  if (exam.status !== "published" && exam.status !== "active") {
    throw new Error("Exam is not available");
  }

  const now = new Date();

  // Check time window
  if (now < exam.startTime || now > exam.endTime) {
    throw new Error("Exam is not active at this time");
  }

  // Update exam state to ongoing if it's published and within time window
  if (exam.state === "published" && now >= exam.startTime && now <= exam.endTime) {
    exam.state = "ongoing";
    exam.status = "active"; // Keep old field in sync
    await exam.save();
  }

  // Check if student already started exam
  let studentExam = await StudentExam.findOne({
    studentId,
    examId
  });

  if (studentExam) {
    // Resume exam
    return studentExam;
  }

  // Assign questions
  let assignedQuestions = [];

  if (exam.isRandomized) {
    assignedQuestions = [...exam.questions].sort(
      () => 0.5 - Math.random()
    );
  } else {
    assignedQuestions = exam.questions;
  }

  // Create student-exam record, handling race-condition duplicate key errors
  try {
    studentExam = await StudentExam.create({
      studentId,
      examId,
      assignedQuestions
    });
  } catch (err) {
    // E11000: duplicate key — another request already created it, just fetch it
    if (err.code === 11000) {
      studentExam = await StudentExam.findOne({ studentId, examId });
      if (!studentExam) throw err; // genuine error, rethrow
    } else {
      throw err;
    }
  }

  return studentExam;
};

/**
 * Auto-submit exam if time is over
 * + Trigger Auto Evaluation
 */
const autoSubmitExamIfExpired = async ({ studentId, examId }) => {
  const studentExam = await StudentExam.findOne({
    studentId,
    examId
  });

  if (!studentExam) {
    throw new Error("Exam not started by student");
  }

  // Already submitted → nothing to do
  if (studentExam.isSubmitted) {
    return studentExam;
  }

  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new Error("Exam not found");
  }

  const now = new Date();

  if (now > exam.endTime) {
    studentExam.isSubmitted = true;
    studentExam.submittedAt = now;
    await studentExam.save();

    // Update exam state to ended if past end time
    if (exam.state === "ongoing") {
      exam.state = "ended";
      exam.status = "completed"; // Keep old field in sync
      await exam.save();
    }

    // 🔥 Run automatic evaluation
    await runAutoEvaluation({
      studentId,
      exam
    });
  }

  return studentExam;
};

/**
 * Get assigned questions for a student in an exam
 * (enriched with public test cases)
 */
const getAssignedQuestions = async ({ studentId, examId }) => {
  const studentExam = await StudentExam.findOne({
    studentId,
    examId
  }).populate("examId", "title durationMinutes allowedLanguages startTime endTime");

  if (!studentExam) {
    throw new Error("Exam not started by student");
  }

  // Fetch questions (exclude internal test case refs)
  const rawQuestions = await Question.find({
    _id: { $in: studentExam.assignedQuestions }
  }).lean(); // lean() returns plain objects we can mutate

  // Fetch public test cases for all questions in one query
  const questionIds = rawQuestions.map((q) => q._id);
  const publicTestCases = await TestCase.find({
    questionId: { $in: questionIds },
    isPublic: true
  }).lean();

  // Group test cases by questionId for fast lookup
  const testCasesByQuestion = {};
  for (const tc of publicTestCases) {
    const key = tc.questionId.toString();
    if (!testCasesByQuestion[key]) testCasesByQuestion[key] = [];
    testCasesByQuestion[key].push({ input: tc.input, expectedOutput: tc.expectedOutput });
  }

  // Attach test cases to each question
  const questions = rawQuestions.map((q) => ({
    ...q,
    testCases: testCasesByQuestion[q._id.toString()] || []
  }));

  return {
    exam: studentExam.examId, // populated exam object
    startedAt: studentExam.startedAt,
    isSubmitted: studentExam.isSubmitted,
    questions
  };
};

/**
 * NEW: Get published exams for a class (student view)
 */
const getPublishedExamsByClass = async (studentId, classId) => {
  // Verify student is enrolled
  const isEnrolled = await isStudentInClass(studentId, classId);
  if (!isEnrolled) {
    throw new Error("You are not enrolled in this class");
  }

  // Get published/ongoing/ended exams for the class
  const exams = await Exam.find({
    classId,
    $or: [
      { state: { $in: ["published", "ongoing", "ended", "completed"] } },
      { status: { $in: ["published", "active", "completed"] } }
    ]
  })
    .populate("classId", "name courseCode courseName section batch group")
    .select("title description startTime endTime durationMinutes totalMarks passingMarks state status questions")
    .sort({ startTime: 1 })
    .lean();

  // Sync states for all exams found
  for (const examData of exams) {
      // Since it's lean, we need to fetch the real model if we want to sync/save
      // Or we can just calculate the state for the response
      const now = new Date();
      if (examData.state !== "draft" && examData.state !== "resultPublished") {
          if (now > examData.endTime) {
              if (examData.state === "published" || examData.state === "ongoing") {
                  examData.state = "ended";
                  examData.status = "completed";
                  // To actually save it, we'd need to findByIdAndUpdate, but for student view, 
                  // calculating it for the response is likely enough and safer.
                  // But since we want consistency, let's sync it for real.
                  await Exam.findByIdAndUpdate(examData._id, { state: "ended", status: "completed" });
              }
          } else if (now >= examData.startTime && now <= examData.endTime) {
              if (examData.state === "published") {
                  examData.state = "ongoing";
                  examData.status = "active";
                  await Exam.findByIdAndUpdate(examData._id, { state: "ongoing", status: "active" });
              }
          }
      }
  }

  // NEW: Attach submission status for this student
  const studentExams = await StudentExam.find({
    studentId,
    examId: { $in: exams.map(e => e._id) }
  }).select("examId isSubmitted");

  const submissionMap = new Map();
  studentExams.forEach(se => {
    submissionMap.set(se.examId.toString(), se.isSubmitted);
  });

  const enrichedExams = exams.map(exam => ({
    ...exam,
    questionCount: exam.questions?.length || 0,
    isSubmitted: submissionMap.get(exam._id.toString()) || false
  }));

  return enrichedExams;
};

module.exports = {
  startExam,
  getAssignedQuestions,
  autoSubmitExamIfExpired,
  getPublishedExamsByClass // NEW
};