const mongoose = require("mongoose");

const autoEvaluationSchema = new mongoose.Schema(
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

    passedTestCases: {
      type: Number,
      required: true
    },

    totalTestCases: {
      type: Number,
      required: true
    },
    
    passedWeight: {
      type: Number,
      default: 0
    },

    totalWeight: {
      type: Number,
      default: 0
    },

    marksObtained: {
      type: Number,
      required: true
    },

    executionStats: {
      time: {
        type: String
      },
      memory: {
        type: String
      }
    },

    evaluatedAt: {
      type: Date,
      default: Date.now
    },

    testCaseResults: [
      {
        testCaseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TestCase"
        },
        isPublic: {
          type: Boolean,
          default: false
        },
        input: String,
        expectedOutput: String,
        actualOutput: String,
        status: {
          type: String,
          enum: ["passed", "failed", "error"],
          required: true
        },
        weight: {
          type: Number,
          default: 1
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Prevent duplicate auto evaluation per question
autoEvaluationSchema.index(
  { studentId: 1, examId: 1, questionId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "AutoEvaluation",
  autoEvaluationSchema
);
