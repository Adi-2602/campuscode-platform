const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  marksAwarded: {
    type: Number,
    required: true
  }
});

const manualEvaluationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

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

    scores: {
      type: [scoreSchema],
      required: true
    },

    totalMarks: {
      type: Number,
      required: true
    },

    remarks: {
      type: String,
      default: ""
    },

    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// One manual evaluation per student + question
manualEvaluationSchema.index(
  { studentId: 1, examId: 1, questionId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "ManualEvaluation",
  manualEvaluationSchema
);
