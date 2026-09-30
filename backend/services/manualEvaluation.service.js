const EvaluationCriteria = require("../models/evaluationCriteria.model");
const ManualEvaluation = require("../models/manualEvaluation.model");
const Submission = require("../models/submission.model");
const AutoEvaluation = require("../models/autoEvaluation.model");
const Exam = require("../models/exam.model");
const StudentExam = require("../models/studentExam.model");
const { recoverDraft } = require("./codeDraft.service");


/**
 * Submit manual evaluation by teacher
 */
const submitManualEvaluation = async ({
  studentId,
  examId,
  questionId,
  scores,
  remarks,
  teacherId,
  sourceCode: explicitSourceCode,
  languageId: explicitLanguageId
}) => {
  // 1️⃣ Check rubric exists
  const rubric = await EvaluationCriteria.findOne({
    examId,
    questionId
  });

  if (!rubric) {
    throw new Error("Evaluation criteria not defined for this question");
  }

  const submission = await Submission.findOne({
    studentId,
    examId,
    questionId
  });

  // Remove hard requirement - allow evaluating even if no code was submitted
  // (Teacher can give 0 marks or comments for non-submission)

  // 3️⃣ Validate scores against rubric
  let totalMarks = 0;

  for (const score of scores) {
    const criterion = rubric.criteria.find(
      c => c.name === score.name
    );

    if (!criterion) {
      throw new Error(
        `Invalid criterion: ${score.name}`
      );
    }

    if (score.marksAwarded > criterion.maxMarks) {
      throw new Error(
        `Marks exceed maximum for ${score.name}`
      );
    }

    totalMarks += score.marksAwarded;
  }

  if (totalMarks > rubric.totalMarks) {
    throw new Error("Total marks exceed rubric limit");
  }

  // 4️⃣ Check if manual evaluation already exists
  const alreadyEvaluated = await ManualEvaluation.findOne({
    studentId,
    examId,
    questionId
  });

  // 🔥 NEW: Ensure code is frozen into a Submission if it only exists in draft or is passed explicitly
  if (!submission || (submission && !submission.sourceCode) || explicitSourceCode) {
    try {
      let codeToFreeze = explicitSourceCode;
      let langToFreeze = explicitLanguageId;

      if (!codeToFreeze) {
        console.log(`[ManualEval] No explicit code provided. Checking for drafts for student ${studentId}...`);
        const draftRes = await recoverDraft({ studentId, examId, questionId });
        if (draftRes.draft && draftRes.draft.code) {
          codeToFreeze = draftRes.draft.code;
          langToFreeze = draftRes.draft.languageId;
        }
      }

      if (codeToFreeze) {
        console.log(`[ManualEval] Freezing source code (${codeToFreeze.length} chars) into Submission for student ${studentId}...`);
        
        if (submission) {
          submission.sourceCode = codeToFreeze;
          submission.languageId = langToFreeze || submission.languageId;
          submission.status = "Teacher-Evaluated-Updated";
          await submission.save();
        } else {
          await Submission.create({
            studentId,
            examId,
            questionId,
            classId: rubric.classId || (await Exam.findById(examId)).classId,
            languageId: langToFreeze || 54, // Default to C++ if missing
            sourceCode: codeToFreeze,
            status: "Teacher-Evaluated-Freeze"
          });
        }
      } else {
        console.log(`[ManualEval] Still no source code found for student ${studentId}. Continuing evaluation without code.`);
      }
    } catch (e) {
      console.error("[ManualEval] ERROR during source code persistence:", e.message);
    }
  }

  if (alreadyEvaluated) {
    // Update existing manual evaluation
    alreadyEvaluated.scores = scores;
    alreadyEvaluated.totalMarks = totalMarks;
    alreadyEvaluated.remarks = remarks;
    alreadyEvaluated.evaluatedBy = teacherId;
    await alreadyEvaluated.save();
    return alreadyEvaluated;
  }

  // 5️⃣ Save new manual evaluation
  const manualEvaluation = await ManualEvaluation.create({
    studentId,
    examId,
    questionId,
    scores,
    totalMarks,
    remarks,
    evaluatedBy: teacherId
  });

  return manualEvaluation;
};
/**
 * Teacher fetches all submissions for an exam
 */
const getExamSubmissionsForTeacher = async (examId) => {
  // 1. Fetch the exam to get the list of questions
  const exam = await Exam.findById(examId).populate("questions");
  if (!exam) return [];

  // 2. Find all students who started the exam
  const studentExams = await StudentExam.find({ examId })
    .populate("studentId", "name email rollNo registrationNumber section batch group studentName");

  const result = [];

  for (const se of studentExams) {
    const student = se.studentId;
    if (!student) continue;

    for (const question of exam.questions) {
      // 3. Find submission for this student and question - get the MOST RECENT one
      const submission = await Submission.findOne({
        examId,
        studentId: student._id,
        questionId: question._id
      }).sort({ createdAt: -1 });

      let sourceCode = submission?.sourceCode || "";
      let languageId = submission?.languageId;

      if (sourceCode) {
        console.log(`[ManualEval] Found existing submission for student ${student._id}, Q: ${question._id}`);
      }

      // 🔥 RECOVER FROM DRAFT if no submission found or if submission is empty
      if (!sourceCode) {
        try {
          const draftRes = await recoverDraft({ studentId: student._id, examId, questionId: question._id });
          if (draftRes.draft) {
            console.log(`[ManualEval] Recovered draft for student ${student._id}, Q: ${question._id}`);
            sourceCode = draftRes.draft.code;
            languageId = draftRes.draft.languageId;
          }
        } catch (e) {
          console.error("Failed to recover draft:", e.message);
        }
      }

      // 4. Find auto-evaluation results
      const autoEval = await AutoEvaluation.findOne({
        studentId: student._id,
        examId,
        questionId: question._id
      });

      // 5. Check if manual evaluation exists
      const manualEval = await ManualEvaluation.findOne({
        studentId: student._id,
        examId,
        questionId: question._id
      });

      // Only push if there is some activity or an evaluation
      if (sourceCode || autoEval || manualEval || se.isSubmitted) {
        result.push({
          studentId: student,
          questionId: {
              _id: question._id,
              title: question.title,
              description: question.description,
              constraints: question.constraints,
              inputFormat: question.inputFormat,
              outputFormat: question.outputFormat,
              difficulty: question.difficulty,
              points: question.points
          },
          sourceCode: sourceCode,
          languageId: languageId,
          autoMarks: autoEval?.marksObtained ?? 0,
          passedTestCases: autoEval?.passedTestCases ?? 0,
          totalTestCases: autoEval?.totalTestCases ?? 0,
          testCaseResults: autoEval?.testCaseResults || [],
          isAttempted: !!sourceCode,
          isEvaluated: !!manualEval,
          manualScore: manualEval?.totalMarks ?? 0,
          manualEvaluation: manualEval ? {
            scores: manualEval.scores,
            remarks: manualEval.remarks
          } : null
        });
      }
    }
  }

  return result;
};

module.exports = {
  submitManualEvaluation,
  getExamSubmissionsForTeacher
};