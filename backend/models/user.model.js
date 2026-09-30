const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["student", "teacher", "admin", "superadmin"],
      required: true,
      default: "student"
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true, // ✅ Creates index automatically - no need for schema.index()
      lowercase: true
    },

    rollNo: {
      type: String,
      unique: true,
      sparse: true // allows null for teachers/admins
    },

    // 🔥 NEW: Student-specific fields
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true, // allows null for non-students
      trim: true,
      uppercase: true
      // Example: "RA2311003010031"
    },

    studentName: {
      type: String,
      trim: true,
      default: null
      // Full student name from upload
    },

    semester: {
      type: Number,
      default: null,
      min: 1,
      max: 10
      // Current semester number (1-10)
    },

    batch: {
      type: Number,
      default: null,
      enum: [1, 2]
      // Batch 1 or Batch 2
    },

    section: {
      type: String,
      trim: true,
      uppercase: true,
      default: null
      // Examples: "A1", "A2", "B1"
    },

    group: {
      type: Number,
      default: null,
      min: 1,
      max: 10
      // Group number (1-10)
    },

    department: {
      type: String,
      trim: true,
      default: null
      // Example: "Computer Science and Engineering"
    },

    program: { type: String, trim: true, default: null },
    branch: { type: String, trim: true, default: null },
    specialization: { type: String, trim: true, default: null },

    facultyAdvisor: { type: String, trim: true, default: null },
    facultyAdvisorMobile: { type: String, trim: true, default: null },

    mobile: { type: String, trim: true, default: null },
    gender: { type: String, trim: true, default: null },
    campus: { type: String, trim: true, default: null },

    dob: { type: Date, default: null },
    bloodGroup: { type: String, trim: true, default: null },

    address: { type: String, trim: true, default: null },

    parentName: { type: String, trim: true, default: null },
    parentMobile: { type: String, trim: true, default: null },
    parentEmail: { type: String, trim: true, lowercase: true, default: null },

    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // 🔥 NEW: Teacher-specific fields
    facultyId: {
      type: Number,
      unique: true,
      sparse: true // allows null for non-teachers
      // Example: 100156
    },

    facultyName: {
      type: String,
      trim: true,
      default: null
      // Full faculty name from upload
      // Example: "Dr. S. S. Sridhar"
    },

    mobile: {
      type: String,
      trim: true,
      default: null
      // Faculty mobile number
    },

    designation: {
      type: String,
      trim: true,
      default: null
      // Example: "Professor", "Associate Professor"
    },

    isPlaceholder: {
      type: Boolean,
      default: false
      // True for placeholder accounts (unknown co-faculty)
    },

    needsEmailUpdate: {
      type: Boolean,
      default: false
      // True if faculty email is missing and needs admin update
    },

    passwordHash: {
      type: String,
      required: true
    },

    // 🔥 NEW: Password management
    mustChangePassword: {
      type: Boolean,
      default: false
      // True for auto-generated passwords (students/teachers from upload)
    },

    // 🔥 NEW: Admin-specific permissions array
    permissions: {
      type: [String],
      default: [],
      // Only applicable for role: "admin"
      // Superadmin has implicit all permissions (no need to store them)
      validate: {
        validator: function (permissions) {
          // Superadmin should not have explicit permissions
          if (this.role === "superadmin") {
            return permissions.length === 0;
          }
          return true;
        },
        message: "Superadmin should not have explicit permissions"
      }
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    verifiedAt: {
      type: Date,
      default: null
    },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active"
    },

    // 🔥 NEW: Admin creation tracking / Upload tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "createdByModel",
      default: null
      // Can reference either User (for manually created) or Upload (for auto-created)
    },

    createdByModel: {
      type: String,
      enum: ["User", "Upload"],
      default: "User"
      // Determines which model createdBy references
    },

    // 🔥 NEW: Permission update tracking
    lastPermissionUpdate: {
      type: Date,
      default: null
    },

    lastPermissionUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

// ✅ FIXED: Removed duplicate email index
// Indexes
// userSchema.index({ email: 1 }); // ❌ REMOVED - already created by unique: true

// ✅ Keep these indexes (no duplicates)
userSchema.index({ role: 1 });
userSchema.index({ role: 1, isVerified: 1 });

// 🔥 NEW: Indexes for student fields
// userSchema.index({ registrationNumber: 1 }); // ❌ REMOVED - already created by unique: true
userSchema.index({ batch: 1, section: 1, group: 1 }); // For finding students by batch-section-group
userSchema.index({ semester: 1 });

// 🔥 NEW: Indexes for teacher fields
// userSchema.index({ facultyId: 1 }); // ❌ REMOVED - already created by unique: true
userSchema.index({ facultyName: 1 });
userSchema.index({ isPlaceholder: 1 }); // For finding placeholder accounts

// 🔥 NEW: Virtual to check if user is superadmin
userSchema.virtual("isSuperAdmin").get(function () {
  return this.role === "superadmin";
});

// 🔥 NEW: Virtual to check if user has any permissions
userSchema.virtual("hasPermissions").get(function () {
  return this.role === "superadmin" || this.permissions.length > 0;
});

// 🔥 NEW: Method to check if user has a specific permission
userSchema.methods.hasPermission = function (permission) {
  // Superadmin has all permissions implicitly
  if (this.role === "superadmin") return true;

  // Admin needs explicit permission
  if (this.role === "admin") {
    return this.permissions.includes(permission);
  }

  // Other roles don't have permissions
  return false;
};

// 🔥 NEW: Method to check if user has any of the given permissions
userSchema.methods.hasAnyPermission = function (permissions) {
  // Superadmin has all permissions
  if (this.role === "superadmin") return true;

  // Admin needs at least one permission
  if (this.role === "admin") {
    return permissions.some((perm) => this.permissions.includes(perm));
  }

  return false;
};

// 🔥 NEW: Method to check if user has all of the given permissions
userSchema.methods.hasAllPermissions = function (permissions) {
  // Superadmin has all permissions
  if (this.role === "superadmin") return true;

  // Admin needs all permissions
  if (this.role === "admin") {
    return permissions.every((perm) => this.permissions.includes(perm));
  }

  return false;
};

module.exports = mongoose.model("User", userSchema);