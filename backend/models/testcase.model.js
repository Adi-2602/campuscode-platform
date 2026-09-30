const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true
    },

    input: {
      type: String,
      required: true
    },

    expectedOutput: {
      type: String,
      required: true
    },

    isPublic: {
      type: Boolean,
      default: false
    },

    weight: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("TestCase", testCaseSchema);
