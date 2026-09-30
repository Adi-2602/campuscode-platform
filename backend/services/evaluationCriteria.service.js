const EvaluationCriteria = require("../models/evaluationCriteria.model");

/**
 * Create evaluation criteria (rubric) for a question
 */
const createEvaluationCriteria = async ({
  examId,
  questionId,
  criteria,
  totalMarks,
  teacherId
}) => {
  // Validate total marks
  const sum = criteria.reduce(
    (acc, c) => acc + Number(c.maxMarks),
    0
  );

  if (sum !== totalMarks) {
    throw new Error(
      "Sum of criteria marks must equal totalMarks"
    );
  }

  const rubric = await EvaluationCriteria.create({
    examId,
    questionId,
    criteria,
    totalMarks,
    createdBy: teacherId
  });

  return rubric;
};

/**
 * Get evaluation criteria for an exam and question
 */
const getEvaluationCriteriaByExamAndQuestion = async (examId, questionId) => {
  return await EvaluationCriteria.findOne({ examId, questionId });
};

/**
 * Update evaluation criteria (rubric)
 */
const updateEvaluationCriteria = async (id, teacherId, data) => {
  const { criteria, totalMarks } = data;

  // Validate total marks
  const sum = criteria.reduce((acc, c) => acc + Number(c.maxMarks), 0);
  if (sum !== totalMarks) {
    throw new Error("Sum of criteria marks must equal totalMarks");
  }

  const rubric = await EvaluationCriteria.findOneAndUpdate(
    { _id: id, createdBy: teacherId },
    { criteria, totalMarks },
    { new: true, runValidators: true }
  );

  if (!rubric) {
    throw new Error("Evaluation criteria not found or unauthorized");
  }

  return rubric;
};

/**
 * Delete evaluation criteria
 */
const deleteEvaluationCriteria = async (id, teacherId) => {
  const result = await EvaluationCriteria.findOneAndDelete({
    _id: id,
    createdBy: teacherId
  });

  if (!result) {
    throw new Error("Evaluation criteria not found or unauthorized");
  }

  return result;
};

module.exports = {
  createEvaluationCriteria,
  getEvaluationCriteriaByExamAndQuestion,
  updateEvaluationCriteria,
  deleteEvaluationCriteria
};
