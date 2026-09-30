const Submission = require("../models/submission.model");
const TestCase = require("../models/testcase.model");
const StudentExam = require("../models/studentExam.model");
const AutoEvaluation = require("../models/autoEvaluation.model");
const { submitCode } = require("./judge0.service");
const { recoverDraft } = require("./codeDraft.service");
const { Buffer } = require("buffer");

const decodeBase64 = (str) => {
  if (!str) return "";
  try {
    return Buffer.from(str, "base64").toString("utf-8");
  } catch (e) {
    return str;
  }
};

const sumWeights = (testCases) =>
  testCases.reduce((sum, tc) => sum + (tc.weight || 1), 0);

/**
 * Run automatic evaluation for a student exam
 */
const runAutoEvaluation = async ({ studentId, exam }) => {
  // Get student-exam record
  const studentExam = await StudentExam.findOne({
    studentId,
    examId: exam._id
  });

  if (!studentExam) {
    throw new Error("Student exam record not found");
  }

  // Total weight across all assigned questions. This must use the SAME set of
  // test cases that the scoring loop below runs (public + hidden); otherwise
  // passedWeight can be larger than totalAssignedWeight and marks exceed totalMarks.
  let totalAssignedWeight = 0;
  for (const questionId of studentExam.assignedQuestions) {
    const tcs = await TestCase.find({ questionId });
    totalAssignedWeight += sumWeights(tcs);
  }

  // Loop through each assigned question
  for (const questionId of studentExam.assignedQuestions) {
    // Prevent duplicate auto-evaluation unless results are missing
    const alreadyEvaluated = await AutoEvaluation.findOne({
      studentId,
      examId: exam._id,
      questionId
    });

    if (alreadyEvaluated && alreadyEvaluated.testCaseResults?.length > 0) continue;

    // Get latest submission for this question
    let submission = await Submission.findOne({
      studentId,
      examId: exam._id,
      questionId
    }).sort({ createdAt: -1 });

    let sourceCode = submission?.sourceCode;
    let languageId = submission?.languageId;

    // 🔥 NEW: Recover from draft if no submission found
    if (!sourceCode) {
      const draftResult = await recoverDraft({ studentId, examId: exam._id, questionId });
      if (draftResult.draft) {
        sourceCode = draftResult.draft.code;
        languageId = draftResult.draft.languageId;
      }
    }

    if (!sourceCode) continue;

    // Fetch all test cases (Public + Hidden)
    const testCases = await TestCase.find({
      questionId
    });

    if (!testCases.length) continue;

    let passedWeight = 0;
    let passedCount = 0;
    const questionTotalWeight = sumWeights(testCases);

    const testCaseResults = [];

    // Run code against each test case
    for (const testCase of testCases) {
      const result = await submitCode({
        language_id: languageId,
        source_code: sourceCode,
        stdin: testCase.input,
        wait: true
      });

      const stdout = decodeBase64(result.stdout);
      const stderr = decodeBase64(result.stderr);
      const compileOutput = decodeBase64(result.compile_output);

      const output = (stdout || "").trim();
      const expected = (testCase.expectedOutput || "").trim();
      const isPassed = output === expected && result.status?.id === 3; // 3 is "Accepted"

      if (isPassed) {
        passedWeight += (testCase.weight || 1);
        passedCount++;
      }

      testCaseResults.push({
        testCaseId: testCase._id,
        isPublic: testCase.isPublic,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: output || stderr || compileOutput || "No Output",
        status: isPassed ? "passed" : "failed",
        weight: testCase.weight || 1
      });
    }

    const marksObtained = totalAssignedWeight > 0 
      ? Number(((passedWeight / totalAssignedWeight) * exam.totalMarks).toFixed(2))
      : 0;

    // Store or update auto evaluation result
    await AutoEvaluation.findOneAndUpdate(
      { studentId, examId: exam._id, questionId },
      {
        passedTestCases: passedCount,
        totalTestCases: testCases.length,
        passedWeight,
        totalWeight: questionTotalWeight,
        marksObtained,
        testCaseResults,
        executionStats: {
          time: submission?.time || 0,
          memory: submission?.memory || 0
        }
      },
      { upsert: true, new: true, runValidators: true }
    );
  }

  return true;
};

module.exports = {
  runAutoEvaluation
};
