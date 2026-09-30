const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    // 🔥 NEW: Link question to a class
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    inputFormat: {
      type: String,
      default: ""
    },

    outputFormat: {
      type: String,
      default: ""
    },

    constraints: {
      type: String,
      default: ""
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// 🔥 NEW: Compound indexes for efficient queries
questionSchema.index({ classId: 1, createdBy: 1 });
questionSchema.index({ classId: 1, isActive: 1 });

module.exports = mongoose.model("Question", questionSchema);