const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema(
  {
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    files: [
      {
        fileName: {
          type: String,
          required: true
        },
        fileType: {
          type: String,
          required: true,
          enum: ["students", "teachers", "faculty_emails"]
          // students = Fake.json
          // teachers = FilteredTeachers.json
          // faculty_emails = FacultyEmailMapping.json
        },
        filePath: {
          type: String,
          default: null
          // Optional: Store file path if saved to disk
        }
      }
    ],
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending"
    },
    stats: {
      studentsCreated: {
        type: Number,
        default: 0
      },
      studentsUpdated: {
        type: Number,
        default: 0
      },
      teachersCreated: {
        type: Number,
        default: 0
      },
      teachersUpdated: {
        type: Number,
        default: 0
      },
      classesCreated: {
        type: Number,
        default: 0
      },
      enrollmentsCreated: {
        type: Number,
        default: 0
      },
      emailsSent: {
        type: Number,
        default: 0
      },
      emailsFailed: {
        type: Number,
        default: 0
      }
    },
    credentialsSent: {
      type: Boolean,
      default: false
    },
    credentialsSentAt: {
      type: Date,
      default: null
    },
    errors: [
      {
        type: {
          type: String,
          enum: [
            "MISSING_FACULTY_EMAIL",
            "TEMPLATE_NOT_FOUND",
            "INVALID_DATA",
            "DUPLICATE_STUDENT",
            "DUPLICATE_TEACHER",
            "EMAIL_SEND_FAILED",
            "OTHER"
          ]
        },
        message: {
          type: String
        },
        data: {
          type: mongoose.Schema.Types.Mixed
          // Additional context about the error
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    warnings: [
      {
        type: {
          type: String,
          enum: [
            "MISSING_CO_FACULTY",
            "TEMPLATE_MISMATCH",
            "PARTIAL_EMAIL_FAILURE",
            "OTHER"
          ]
        },
        message: {
          type: String
        },
        data: {
          type: mongoose.Schema.Types.Mixed
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    completedAt: {
      type: Date,
      default: null
    },
    processingTime: {
      type: Number,
      default: null
      // Time taken to process upload in milliseconds
    }
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true
  }
);

// Index for finding uploads by semester
uploadSchema.index({ semester: 1 });

// Index for finding uploads by status
uploadSchema.index({ status: 1 });

// Index for finding uploads by date
uploadSchema.index({ uploadedAt: -1 });

// Index for finding uploads by admin
uploadSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model("Upload", uploadSchema);