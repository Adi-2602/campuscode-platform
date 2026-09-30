const {
  submitStudentCode
} = require("../services/submission.service");

/**
 * Submit code for a question (Student)
 */
const submitCodeHandler = async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    const { languageId, sourceCode, stdin } = req.body;

    if (!examId || !questionId) {
      return res.status(400).json({
        error: "examId and questionId are required"
      });
    }

    if (!languageId || !sourceCode) {
      return res.status(400).json({
        error: "languageId and sourceCode are required"
      });
    }

    const submission = await submitStudentCode({
      studentId: req.user.id,
      examId,
      questionId,
      languageId,
      sourceCode,
      stdin
    });

    res.status(201).json({
      message: "Code submitted successfully",
      submission
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

module.exports = {
  submitCodeHandler
};
