const {
  scheduleFinalResult
} = require("../services/finalResult.service");

/**
 * Teacher schedules result publication
 */
const scheduleFinalResultHandler = async (req, res) => {
  try {
    const { examId } = req.params;
    const { studentId, evaluationType, publishAt } = req.body;

    if (!studentId || !evaluationType || !publishAt) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    const finalResult = await scheduleFinalResult({
      studentId,
      examId,
      evaluationType,
      publishAt: new Date(publishAt),
      teacherId: req.user.id
    });

    res.status(201).json({
      message: "Result scheduled successfully",
      finalResult
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

module.exports = {
  scheduleFinalResultHandler
};
