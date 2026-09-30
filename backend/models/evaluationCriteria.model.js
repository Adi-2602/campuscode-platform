const mongoose = require("mongoose");

const criteriaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true
  }
});

const evaluationCriteriaSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true
    },

    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true
    },

    criteria: {
      type: [criteriaSchema],
      required: true
    },

    totalMarks: {
      type: Number,
      required: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// One rubric per exam + question
evaluationCriteriaSchema.index(
  { examId: 1, questionId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "EvaluationCriteria",
  evaluationCriteriaSchema
);
