const mongoose = require("mongoose");

const questionResultSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true
  },

  autoMarks: {
    type: Number,
    default: 0
  },

  manualMarks: {
    type: Number,
    default: 0
  },

  finalMarks: {
    type: Number,
    required: true
  }
});

const finalResultSchema = new mongoose.Schema(
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

    questionResults: {
      type: [questionResultSchema],
      required: true
    },

    autoTotal: {
      type: Number,
      default: 0
    },

    manualTotal: {
      type: Number,
      default: 0
    },

    finalTotal: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["pass", "fail"],
      required: true
    },

    /**
     * 🔥 RESULT SCHEDULING
     * Teacher-selected date & time
     */
    publishAt: {
      type: Date,
      required: false
    },

    /**
     * Actual publication state
     */
    published: {
      type: Boolean,
      default: false
    },

    /**
     * When result actually became visible
     */
    publishedAt: {
      type: Date
    },

    /**
     * Who generated final result
     * system | teacher | ai
     */
    generatedBy: {
      type: String,
      default: "system"
    }
  },
  { timestamps: true }
);

// One final result per student per exam
finalResultSchema.index(
  { studentId: 1, examId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "FinalResult",
  finalResultSchema
);
