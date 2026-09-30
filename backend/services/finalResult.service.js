const FinalResult = require("../models/finalResult.model");
const AutoEvaluation = require("../models/autoEvaluation.model");
const ManualEvaluation = require("../models/manualEvaluation.model");
const Exam = require("../models/exam.model");

/**
 * Teacher schedules final result publication
 */
const scheduleFinalResult = async ({
  studentId,
  examId,
  evaluationType,
  publishAt,
  teacherId
}) => {
  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new Error("Exam not found");
  }

  // Prevent duplicate final result
  const existing = await FinalResult.findOne({ studentId, examId });
  if (existing) {
    throw new Error("Final result already scheduled");
  }

  let questionResults = [];
  let autoTotal = 0;
  let manualTotal = 0;

  if (evaluationType === "auto") {
    const autoEvals = await AutoEvaluation.find({ studentId, examId });

    if (!autoEvals.length) {
      throw new Error("Auto evaluation not found");
    }

    for (const evalItem of autoEvals) {
      questionResults.push({
        questionId: evalItem.questionId,
        autoMarks: evalItem.marksObtained,
        finalMarks: evalItem.marksObtained
      });
      autoTotal += evalItem.marksObtained;
    }
  }

  if (evaluationType === "manual") {
    const manualEvals = await ManualEvaluation.find({ studentId, examId });

    if (!manualEvals.length) {
      throw new Error("Manual evaluation not found");
    }

    for (const evalItem of manualEvals) {
      questionResults.push({
        questionId: evalItem.questionId,
        manualMarks: evalItem.totalMarks,
        finalMarks: evalItem.totalMarks
      });
      manualTotal += evalItem.totalMarks;
    }
  }

  const finalTotal =
    evaluationType === "auto" ? autoTotal : manualTotal;

  const passingThreshold = exam.passingMarks > 0 ? exam.passingMarks : exam.totalMarks * 0.4;
  const status = finalTotal >= passingThreshold ? "pass" : "fail";

  const finalResult = await FinalResult.create({
    studentId,
    examId,
    questionResults,
    autoTotal,
    manualTotal,
    finalTotal,
    status,
    publishAt,
    published: false,
    generatedBy: teacherId
  });

  return finalResult;
};

module.exports = {
  scheduleFinalResult
};
