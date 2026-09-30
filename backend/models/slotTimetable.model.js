const mongoose = require("mongoose");

const slotTimetableSchema = new mongoose.Schema(
  {
    slotCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
      // Example: "P1", "P29", "P47"
    },

    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true
    },

    batch: {
      type: Number,
      required: true,
      enum: [1, 2]
      // Which batch this slot belongs to
    },

    day: {
      type: String,
      required: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      // Day of the week (Day 1-5 in your image)
    },

    dayNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 5
      // Day 1, Day 2, etc. (as shown in image)
    },

    hourOrder: {
      type: Number,
      required: true,
      min: 1,
      max: 12
      // Hour order 1-12 (as shown in image)
    },

    startTime: {
      type: String,
      required: true
      // Format: "HH:MM" (e.g., "08:00", "01:25")
    },

    endTime: {
      type: String,
      required: true
      // Format: "HH:MM" (e.g., "08:50", "02:15")
    },

    duration: {
      type: Number,
      required: true
      // Duration in minutes (calculated from start-end)
    },

    isLab: {
      type: Boolean,
      default: true
      // True for P slots (lab), false for theory slots (A, B, C, etc.)
    },

    slotType: {
      type: String,
      enum: ["lab", "theory"],
      default: "lab"
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

// Compound index: Each cell (Semester, Batch, Day, Hour) is unique
slotTimetableSchema.index({ semesterId: 1, batch: 1, dayNumber: 1, hourOrder: 1 }, { unique: true });

// Index for searching by semester, batch and day
slotTimetableSchema.index({ semesterId: 1 });
slotTimetableSchema.index({ semesterId: 1, batch: 1, day: 1 });
slotTimetableSchema.index({ semesterId: 1, batch: 1, dayNumber: 1, hourOrder: 1 });

// Index for time-based queries
slotTimetableSchema.index({ startTime: 1 });

module.exports = mongoose.model("SlotTimetable", slotTimetableSchema);