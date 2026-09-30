const {
  submitManualEvaluation,
  getExamSubmissionsForTeacher
} = require("../services/manualEvaluation.service");

/**
 * Teacher submits manual evaluation
 */
const submitManualEvaluationHandler = async (req, res) => {
  try {
    const {
      studentId,
      examId,
      questionId,
      scores,
      remarks,
      sourceCode,
      languageId
    } = req.body;

    if (!studentId || !examId || !questionId || !scores) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    const manualEvaluation = await submitManualEvaluation({
      studentId,
      examId,
      questionId,
      scores,
      remarks,
      teacherId: req.user.id,
      sourceCode,
      languageId
    });

    res.status(201).json({
      message: "Manual evaluation submitted successfully",
      manualEvaluation
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};
/**
 * Teacher fetches all submissions for an exam
 */
const getExamSubmissionsHandler = async (req, res) => {
  try {
    const { examId } = req.params;

    const submissions = await getExamSubmissionsForTeacher(examId);

    res.json(submissions);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


module.exports = {
  submitManualEvaluationHandler,
  getExamSubmissionsHandler
};
