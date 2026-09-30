const mongoose = require("mongoose");

const classStudentSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date,
      default: null
    },

    // 🔥 NEW: Auto-enrollment tracking
    autoEnrolled: {
      type: Boolean,
      default: false
      // True if student was auto-enrolled from upload (vs manual join via code)
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate enrollments
classStudentSchema.index({ classId: 1, studentId: 1 }, { unique: true });

// Index for finding all students in a class
classStudentSchema.index({ classId: 1, leftAt: 1 });

// Index for finding all classes of a student
classStudentSchema.index({ studentId: 1, leftAt: 1 });

// 🔥 NEW: Index for finding auto-enrolled students
classStudentSchema.index({ autoEnrolled: 1 });

module.exports = mongoose.model("ClassStudent", classStudentSchema);