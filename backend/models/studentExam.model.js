const mongoose = require("mongoose");

const studentExamSchema = new mongoose.Schema(
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

    assignedQuestions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true
      }
    ],

    startedAt: {
      type: Date,
      default: Date.now
    },

    isSubmitted: {
      type: Boolean,
      default: false
    },

    submittedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Ensure one attempt per student per exam
studentExamSchema.index({ studentId: 1, examId: 1 }, { unique: true });

module.exports = mongoose.model("StudentExam", studentExamSchema);
