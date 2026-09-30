/**
 * PHASE 7: TEACHER VERIFICATION ENHANCEMENTS
 * 
 * Add these functions to your existing services/admin.service.js
 * Or create admin.service.js if it doesn't exist
 */

const User = require("../models/user.model");
const { sendTeacherCredentialEmail } = require("./email.service");
const { generateSimplePassword } = require("../utils/passwordGenerator.util");
const bcrypt = require("bcrypt");

/**
 * Get all unverified teachers
 */
const getUnverifiedTeachers = async (filters = {}, options = {}) => {
  const { page = 1, limit = 50, sort = "-createdAt" } = options;
  const skip = (page - 1) * limit;

  const query = {
    role: "teacher",
    isVerified: false
  };

  // Add filters
  if (filters.isPlaceholder !== undefined) {
    query.isPlaceholder = filters.isPlaceholder;
  }

  if (filters.needsEmailUpdate !== undefined) {
    query.needsEmailUpdate = filters.needsEmailUpdate;
  }

  const [teachers, total] = await Promise.all([
    User.find(query)
      .select("name email facultyId facultyName mobile designation isPlaceholder needsEmailUpdate createdAt")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  return {
    teachers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Bulk verify multiple teachers
 */
const bulkVerifyTeachers = async (teacherIds, adminId) => {
  const results = {
    verified: [],
    failed: [],
    alreadyVerified: []
  };

  for (const teacherId of teacherIds) {
    try {
      const teacher = await User.findById(teacherId);

      if (!teacher) {
        results.failed.push({
          teacherId,
          reason: "Teacher not found"
        });
        continue;
      }

      if (teacher.role !== "teacher") {
        results.failed.push({
          teacherId,
          reason: "User is not a teacher"
        });
        continue;
      }

      if (teacher.isVerified) {
        results.alreadyVerified.push({
          teacherId,
          facultyName: teacher.facultyName
        });
        continue;
      }

      // Verify teacher
      teacher.isVerified = true;
      await teacher.save();

      results.verified.push({
        teacherId: teacher._id,
        facultyName: teacher.facultyName,
        email: teacher.email
      });

    } catch (error) {
      results.failed.push({
        teacherId,
        reason: error.message
      });
    }
  }

  return {
    success: true,
    verified: results.verified.length,
    failed: results.failed.length,
    alreadyVerified: results.alreadyVerified.length,
    details: results
  };
};

/**
 * Resend credentials to teacher
 */
const resendTeacherCredentials = async (teacherId, adminId) => {
  const teacher = await User.findById(teacherId);

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  if (teacher.role !== "teacher") {
    throw new Error("User is not a teacher");
  }

  // Generate new password
  const newPassword = generateSimplePassword();
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  teacher.passwordHash = passwordHash;
  teacher.mustChangePassword = true;
  await teacher.save();

  // Get teacher's assigned classes
  const Class = require("../models/class.model");
  const assignedClasses = await Class.find({
    $or: [
      { mainFaculty: teacherId },
      { coFaculties: teacherId }
    ]
  })
    .select("name code courseCode courseName batch section group labDay labStartTime labEndTime venue")
    .lean();

  const classesFormatted = assignedClasses.map(cls => ({
    courseName: cls.courseName,
    courseCode: cls.courseCode,
    batch: cls.batch,
    section: cls.section,
    group: cls.group,
    labDay: cls.labDay,
    labStartTime: cls.labStartTime,
    labEndTime: cls.labEndTime,
    venue: cls.venue
  }));

  // Send credentials email
  await sendTeacherCredentialEmail({
    email: teacher.email,
    facultyName: teacher.facultyName,
    username: teacher.email,
    password: newPassword,
    assignedClasses: classesFormatted,
    isVerified: teacher.isVerified
  });

  return {
    success: true,
    message: "Credentials sent successfully",
    teacherId: teacher._id,
    email: teacher.email,
    facultyName: teacher.facultyName
  };
};

/**
 * Reject/block teacher account
 */
const rejectTeacherAccount = async (teacherId, reason, adminId) => {
  const teacher = await User.findById(teacherId);

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  if (teacher.role !== "teacher") {
    throw new Error("User is not a teacher");
  }

  // Mark as rejected (you can add a 'status' field to user model if needed)
  teacher.isVerified = false;
  teacher.isActive = false; // Assuming you have an isActive field
  await teacher.save();

  // Optionally send rejection email
  if (!teacher.isPlaceholder) {
    const { sendEmail } = require("./email.service");
    const { generateAccountRejectionEmail } = require("../utils/emailTemplates.util");

    const html = generateAccountRejectionEmail({
      facultyName: teacher.facultyName,
      reason: reason || "Account verification failed"
    });

    await sendEmail({
      to: teacher.email,
      subject: "CampusCode Account Status",
      html,
      text: `Dear ${teacher.facultyName}, your account verification was not approved. Reason: ${reason || "Not specified"}`
    });
  }

  return {
    success: true,
    message: "Teacher account rejected",
    teacherId: teacher._id,
    facultyName: teacher.facultyName,
    reason
  };
};

/**
 * Update teacher email (for placeholder accounts)
 */
const updateTeacherEmail = async (teacherId, newEmail, adminId) => {
  const teacher = await User.findById(teacherId);

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  if (teacher.role !== "teacher") {
    throw new Error("User is not a teacher");
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
  if (existingUser && existingUser._id.toString() !== teacherId.toString()) {
    throw new Error("Email already in use");
  }

  // Update email
  teacher.email = newEmail.toLowerCase();
  teacher.isPlaceholder = false;
  teacher.needsEmailUpdate = false;
  await teacher.save();

  return {
    success: true,
    message: "Email updated successfully",
    teacherId: teacher._id,
    newEmail: teacher.email,
    facultyName: teacher.facultyName
  };
};

/**
 * Get teacher verification statistics
 */
const getTeacherVerificationStats = async () => {
  const [total, verified, unverified, placeholder, needsEmailUpdate] = await Promise.all([
    User.countDocuments({ role: "teacher" }),
    User.countDocuments({ role: "teacher", isVerified: true }),
    User.countDocuments({ role: "teacher", isVerified: false }),
    User.countDocuments({ role: "teacher", isPlaceholder: true }),
    User.countDocuments({ role: "teacher", needsEmailUpdate: true })
  ]);

  return {
    total,
    verified,
    unverified,
    placeholder,
    needsEmailUpdate,
    verificationRate: total > 0 ? ((verified / total) * 100).toFixed(2) : 0
  };
};

module.exports = {
  getUnverifiedTeachers,
  bulkVerifyTeachers,
  resendTeacherCredentials,
  rejectTeacherAccount,
  updateTeacherEmail,
  getTeacherVerificationStats
};