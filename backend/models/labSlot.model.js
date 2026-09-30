const mongoose = require("mongoose");

const labSlotSchema = new mongoose.Schema(
  {
    slotCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      // Examples: "P1", "P47", "P48"
    },
    day: {
      type: String,
      required: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      // Day of the week when this slot occurs
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
      // Format: "HH:MM" (24-hour format)
      // Example: "01:25", "08:00"
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
      // Format: "HH:MM" (24-hour format)
      // Example: "02:15", "08:50"
    },
    batch: {
      type: Number,
      required: true,
      enum: [1, 2],
      // Batch 1 or Batch 2
    },
    hourOrder: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      // Hour order in the day (1-12)
      // Used for sorting and timetable display
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

// Index for finding slots by batch
labSlotSchema.index({ batch: 1 });

// Index for finding slots by day
labSlotSchema.index({ day: 1 });

// Index for timetable view (batch + day + hourOrder)
labSlotSchema.index({ batch: 1, day: 1, hourOrder: 1 });

module.exports = mongoose.model("LabSlot", labSlotSchema);