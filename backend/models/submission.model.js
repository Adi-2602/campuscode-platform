const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
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
    // NEW: Link submission to class
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true
    },
    languageId: {
      type: Number,
      required: true
    },
    sourceCode: {
      type: String,
      required: true
    },
    stdout: {
      type: String,
      default: ""
    },
    stderr: {
      type: String,
      default: ""
    },
    compileOutput: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      default: "Pending"
    },
    time: {
      type: String,
      default: null
    },
    memory: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
submissionSchema.index({ studentId: 1, examId: 1, questionId: 1 });
submissionSchema.index({ examId: 1, classId: 1 });
submissionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Submission", submissionSchema);