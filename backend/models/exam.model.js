const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    // NEW: Link exam to a class
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true
      }
    ],
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    durationMinutes: {
      type: Number,
      required: true
    },
    totalMarks: {
      type: Number,
      required: true
    },
    passingMarks: {
      type: Number,
      default: 0
    },
    isRandomized: {
      type: Boolean,
      default: false
    },
    allowedLanguages: [
      {
        type: Number
      }
    ],
    // NEW: Exam state management
    state: {
      type: String,
      enum: ["draft", "published", "ongoing", "ended", "resultPublished"],
      default: "draft"
    },
    // NEW: Scheduled result publication
    publishResultsAt: {
      type: Date,
      default: null
    },
    // OLD: Keep for backward compatibility
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "active", "completed"],
      default: "draft"
    },
    // NEW: Submission limit per student
    maxSubmissions: {
      type: Number,
      default: null // null = unlimited submissions
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index for class-based queries
examSchema.index({ classId: 1, state: 1 });
examSchema.index({ createdBy: 1 });
examSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model("Exam", examSchema);