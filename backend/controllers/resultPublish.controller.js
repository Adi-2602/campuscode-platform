const {
  publishExamResults
} = require("../services/resultPublish.service");

/**
 * Teacher publishes exam results
 */
const publishResultsHandler = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!examId) {
      return res.status(400).json({
        error: "Exam ID is required"
      });
    }

    const result = await publishExamResults({
      examId,
      teacherId: req.user.id,
      publishAt: req.body.publishAt
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

module.exports = {
  publishResultsHandler
};
