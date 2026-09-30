const mongoose = require("mongoose");

const classScheduleTemplateSchema = new mongoose.Schema(
  {
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true
    },
    batch: {
      type: Number,
      required: true,
      enum: [1, 2]
    },
    section: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      // Examples: "A1", "A2", "B1", "B2"
    },
    group: {
      type: Number,
      required: true,
      enum: [1, 2]
      // Group 1 or Group 2
    },
    courseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      // Example: "21CSC204J"
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
      // Example: "Design and Analysis of Algorithms"
    },
    venue: {
      type: String,
      trim: true,
      default: "",
      // Example: "TP008", "TP016"
    },
    labSlots: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SlotTimetable"
      }
    ],
    // Auto-calculated fields (populated from labSlots)
    labDay: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      default: null,
      // Derived from labSlots (all slots should be on same day)
    },
    labStartTime: {
      type: String,
      default: null,
      // Format: "HH:MM"
      // Start time of first slot
    },
    labEndTime: {
      type: String,
      default: null,
      // Format: "HH:MM"
      // End time of last slot
    },
    labDuration: {
      type: Number,
      default: null,
      // Total duration in minutes
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

// Compound unique index: One template per batch-section-group-course per semester
classScheduleTemplateSchema.index(
  { semester: 1, batch: 1, section: 1, group: 1, courseCode: 1 },
  { unique: true }
);

// Index for finding templates by semester
classScheduleTemplateSchema.index({ semester: 1 });

// Index for finding templates by batch and section
classScheduleTemplateSchema.index({ semester: 1, batch: 1, section: 1 });

module.exports = mongoose.model("ClassScheduleTemplate", classScheduleTemplateSchema);