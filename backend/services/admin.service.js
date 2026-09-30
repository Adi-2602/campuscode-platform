const User = require("../models/user.model");
const bcrypt = require("bcryptjs");

/**
 * Verify a teacher account (Super Admin only)
 */
const verifyTeacher = async ({ teacherId, superAdminId }) => {
  const teacher = await User.findById(teacherId);

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  if (teacher.role !== "teacher") {
    throw new Error("User is not a teacher");
  }

  if (teacher.isVerified) {
    throw new Error("Teacher is already verified");
  }

  teacher.isVerified = true;
  teacher.verifiedBy = superAdminId;
  teacher.verifiedAt = new Date();

  await teacher.save();

  return {
    id: teacher._id,
    name: teacher.name,
    email: teacher.email,
    role: teacher.role,
    isVerified: teacher.isVerified,
    verifiedAt: teacher.verifiedAt
  };
};

/**
 * Bulk import students from JSON
 */
const bulkImportStudents = async (data, adminId) => {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const row of data) {
    try {
      // Map JSON fields to User model fields
      // Expected keys: "Student Name", "Registration Number", "Official Email", "Batch", "Section", "Group", "Department", "Semester"

      const regNo = row["Registration Number"];
      const email = row["Official Email"] || row["Email ID"]; // Fallback

      if (!regNo || !email) {
        throw new Error("Missing Registration Number or Email");
      }

      const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { registrationNumber: regNo }]
      });

      const studentData = {
        name: row["Student Name"],
        studentName: row["Student Name"],
        registrationNumber: regNo,
        email: email.toLowerCase(),
        role: "student",
        batch: row["Batch"] ? parseInt(row["Batch"]) : null,
        section: row["Section"],
        group: row["Group"] ? parseInt(row["Group"]) : null,
        department: row["Department"],
        semester: row["Semester"] ? parseInt(row["Semester"]) : null,
        mobile: row["Mobile Number"] ? String(row["Mobile Number"]) : null,
        createdBy: adminId,
        createdByModel: "User",
        isVerified: true, // Auto-verify imported students
        mustChangePassword: true
      };

      if (existingUser) {
        // Update existing
        Object.assign(existingUser, studentData);
        // Don't reset password on update unless requested?
        // Let's keep password as is for updates.
        await existingUser.save();
        results.success++;
      } else {
        // Create new
        const password = `Student@${regNo.slice(-4)}`; // Default password: Student@Last4Digits
        const salt = await bcrypt.genSalt(10);
        studentData.passwordHash = await bcrypt.hash(password, salt);

        await User.create(studentData);
        results.success++;
      }

    } catch (err) {
      results.failed++;
      results.errors.push(`Row ${row["Sl No."] || row["Sno"] || '?'}: ${err.message}`);
    }
  }

  return results;
};

module.exports = {
  verifyTeacher,
  bulkImportStudents
};
