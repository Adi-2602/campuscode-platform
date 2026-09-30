const StudentExam = require("../models/studentExam.model");

/**
 * Manually submit an exam (student or system)
 */
const submitExamHandler = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;

    const studentExam = await StudentExam.findOne({
      studentId,
      examId
    });

    if (!studentExam) {
      return res.status(400).json({
        error: "Exam not started by student"
      });
    }

    if (studentExam.isSubmitted) {
      return res.status(400).json({
        error: "Exam already submitted"
      });
    }

    studentExam.isSubmitted = true;
    studentExam.submittedAt = new Date();
    await studentExam.save();

    res.json({
      message: "Exam submitted successfully",
      submittedAt: studentExam.submittedAt
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

module.exports = {
  submitExamHandler
};
