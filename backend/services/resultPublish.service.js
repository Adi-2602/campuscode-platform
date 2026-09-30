const FinalResult = require("../models/finalResult.model");
const Exam = require("../models/exam.model");
const AutoEvaluation = require("../models/autoEvaluation.model");
const ManualEvaluation = require("../models/manualEvaluation.model");
const StudentExam = require("../models/studentExam.model");

/**
 * Publish all results for an exam
 */
const publishExamResults = async ({ examId, teacherId, publishAt, isWorker = false }) => {
  const exam = await Exam.findById(examId);

  if (!exam) {
    throw new Error("Exam not found");
  }

  // If a publish date is provided and it's in the future, schedule it (only if NOT called by worker)
  if (!isWorker && publishAt && new Date(publishAt) > new Date()) {
    exam.publishResultsAt = new Date(publishAt);
    await exam.save();

    return {
      message: `Results scheduled to be published at ${new Date(publishAt).toLocaleString()}`,
      scheduledAt: exam.publishResultsAt
    };
  }

  // Otherwise, publish immediately
  
  // 🔥 NEW: Auto-generate FinalResults for all submitted students if they don't exist
  const submissions = await StudentExam.find({ examId, isSubmitted: true });
  
  for (const sub of submissions) {
    const existingResult = await FinalResult.findOne({ studentId: sub.studentId, examId });
    if (!existingResult) {
      // Try to generate from auto-evaluations first
      const autoEvals = await AutoEvaluation.find({ studentId: sub.studentId, examId });
      const manualEvals = await ManualEvaluation.find({ studentId: sub.studentId, examId });
      
      if (autoEvals.length > 0 || manualEvals.length > 0) {
        let questionResults = [];
        let autoTotal = 0;
        let manualTotal = 0;
        
        // Process Auto Evals
        for (const evalItem of autoEvals) {
          questionResults.push({
            questionId: evalItem.questionId,
            autoMarks: evalItem.marksObtained,
            finalMarks: evalItem.marksObtained
          });
          autoTotal += evalItem.marksObtained;
        }
        
        // Process Manual Evals (if any)
        for (const evalItem of manualEvals) {
          // Check if question already has auto marks, merged if needed or replaced
          const existingIdx = questionResults.findIndex(qr => qr.questionId.toString() === evalItem.questionId.toString());
          if (existingIdx >= 0) {
            questionResults[existingIdx].manualMarks = evalItem.totalMarks;
            questionResults[existingIdx].finalMarks = evalItem.totalMarks; // Manual overrides auto usually
          } else {
            questionResults.push({
              questionId: evalItem.questionId,
              manualMarks: evalItem.totalMarks,
              finalMarks: evalItem.totalMarks
            });
          }
          manualTotal += evalItem.totalMarks;
        }
        
        const finalTotal = manualEvals.length > 0 ? manualTotal : autoTotal;
        const passingThreshold = exam.passingMarks > 0 ? exam.passingMarks : exam.totalMarks * 0.4;
        const status = finalTotal >= passingThreshold ? "pass" : "fail";
        
        await FinalResult.create({
          studentId: sub.studentId,
          examId,
          questionResults,
          autoTotal,
          manualTotal,
          finalTotal,
          status,
          published: false,
          generatedBy: teacherId || exam.createdBy
        });
      }
    }
  }

  const results = await FinalResult.find({ examId });

  if (!results.length) {
    // If called from the worker, just log/return instead of throwing
    if (isWorker) {
      return {
        message: "Publication skipped: No results found for this exam. Please ensure evaluations are completed.",
        count: 0
      };
    }
    throw new Error("No results found for this exam. Please ensure evaluations are completed.");
  }

  // Publish only unpublished results
  await FinalResult.updateMany(
    { examId, published: false },
    {
      $set: {
        published: true,
        publishedAt: new Date(),
        publishAt: new Date() // Synchronize with the scheduled field
      }
    }
  );

  // Update exam state
  exam.state = "resultPublished";
  exam.publishResultsAt = new Date();
  await exam.save();

  return {
    message: "Results published successfully",
    count: results.length
  };
};

module.exports = {
  publishExamResults
};
