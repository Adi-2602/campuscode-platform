const FinalResult = require("../models/finalResult.model");

/**
 * Student views their exam result (with lazy publish)
 */
const getStudentResultHandler = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;

    const result = await FinalResult.findOne({
      studentId,
      examId
    })
      .populate({
        path: "examId",
        select: "title totalMarks classId startTime endTime",
        populate: {
          path: "classId",
          select: "name courseCode courseName labDay labStartTime labEndTime venue mainFaculty",
          populate: {
            path: "mainFaculty",
            select: "name studentName"
          }
        }
      })
      .populate("questionResults.questionId", "title");

    if (!result) {
      return res.status(404).json({
        error: "Result not published"
      });
    }

    const now = new Date();

    // ⏳ Result scheduled but not yet released
    if (!result.published && now < result.publishAt) {
      return res.status(403).json({
        message: "Result scheduled. Please wait."
      });
    }

    // 🔥 Lazy publish
    if (!result.published && now >= result.publishAt) {
      result.published = true;
      result.publishedAt = now;
      await result.save();
    }

    // ✅ Return published result
    res.json({
      exam: result.examId,
      totalMarks: result.finalTotal,
      status: result.status,
      questionResults: result.questionResults,
      publishedAt: result.publishedAt
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

module.exports = {
  getStudentResultHandler
};
