const mongoose = require("mongoose");

const semesterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      // Examples: "Semester IV", "Semester VI"
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
      // Example: "2023-24"
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
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

// Index for finding active semester
semesterSchema.index({ isActive: 1 });

// Index for searching by academic year
semesterSchema.index({ academicYear: 1 });

// Compound index for unique semester per year
semesterSchema.index({ name: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model("Semester", semesterSchema);