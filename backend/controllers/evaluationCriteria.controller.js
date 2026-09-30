const {
  createEvaluationCriteria,
  getEvaluationCriteriaByExamAndQuestion,
  updateEvaluationCriteria,
  deleteEvaluationCriteria
} = require("../services/evaluationCriteria.service");

/**
 * Teacher creates evaluation criteria
 */
const createEvaluationCriteriaHandler = async (req, res) => {
  try {
    const {
      examId,
      questionId,
      criteria,
      totalMarks
    } = req.body;

    if (!examId || !questionId || !criteria || !totalMarks) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    const rubric = await createEvaluationCriteria({
      examId,
      questionId,
      criteria,
      totalMarks,
      teacherId: req.user.id
    });

    res.status(201).json({
      message: "Evaluation criteria created successfully",
      rubric
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get criteria for an exam and question
 */
const getEvaluationCriteriaHandler = async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    const rubric = await getEvaluationCriteriaByExamAndQuestion(examId, questionId);
    res.status(200).json(rubric || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update criteria
 */
const updateEvaluationCriteriaHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const rubric = await updateEvaluationCriteria(id, req.user.id, req.body);
    res.status(200).json({
      message: "Evaluation criteria updated successfully",
      rubric
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete criteria
 */
const deleteEvaluationCriteriaHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteEvaluationCriteria(id, req.user.id);
    res.status(200).json({
      message: "Evaluation criteria deleted successfully"
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createEvaluationCriteriaHandler,
  getEvaluationCriteriaHandler,
  updateEvaluationCriteriaHandler,
  deleteEvaluationCriteriaHandler
};
