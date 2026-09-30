const Class = require("../models/class.model");
const ClassStudent = require("../models/classStudent.model");

/**
 * Student joins a class via code
 */
const joinClass = async ({ code, studentId }) => {
  // Find class by code
  const classData = await Class.findOne({ code });

  if (!classData) {
    throw new Error("Invalid class code");
  }

  // Check if class is locked
  if (classData.isLocked) {
    throw new Error("Class is locked. Cannot join at this time.");
  }

  // Check if student already enrolled (and not left)
  const existingEnrollment = await ClassStudent.findOne({
    classId: classData._id,
    studentId,
    leftAt: null
  });

  if (existingEnrollment) {
    throw new Error("You are already enrolled in this class");
  }

  // Check if student previously left and is re-joining
  const previousEnrollment = await ClassStudent.findOne({
    classId: classData._id,
    studentId,
    leftAt: { $ne: null }
  });

  if (previousEnrollment) {
    // Re-activate enrollment
    previousEnrollment.leftAt = null;
    previousEnrollment.joinedAt = new Date();
    await previousEnrollment.save();

    return {
      class: classData,
      enrollment: previousEnrollment,
      message: "Re-joined class successfully"
    };
  }

  // Create new enrollment
  const enrollment = await ClassStudent.create({
    classId: classData._id,
    studentId
  });

  return {
    class: classData,
    enrollment,
    message: "Joined class successfully"
  };
};

/**
 * Get all classes a student has joined (active only)
 */
const getJoinedClasses = async (studentId) => {
  const enrollments = await ClassStudent.find({
    studentId,
    leftAt: null
  })
    .populate("classId")
    .sort({ joinedAt: -1 });

  if (!enrollments.length) return [];

  const classIds = enrollments.map(e => e.classId._id);
  
  const studentCounts = await ClassStudent.aggregate([
    { $match: { classId: { $in: classIds }, leftAt: null } },
    { $group: { _id: "$classId", count: { $sum: 1 } } }
  ]);

  const countMap = {};
  studentCounts.forEach(c => {
    countMap[c._id.toString()] = c.count;
  });

  return enrollments.map((enrollment) => {
    const classData = enrollment.classId.toObject();
    classData.joinedAt = enrollment.joinedAt;
    classData.enrollmentId = enrollment._id;
    classData.studentCount = countMap[classData._id.toString()] || 0;
    return classData;
  });
};

/**
 * Student leaves a class
 */
const leaveClass = async ({ classId, studentId }) => {
  const enrollment = await ClassStudent.findOne({
    classId,
    studentId,
    leftAt: null
  });

  if (!enrollment) {
    throw new Error("You are not enrolled in this class");
  }

  // Mark as left
  enrollment.leftAt = new Date();
  await enrollment.save();

  return {
    message: "Left class successfully",
    leftAt: enrollment.leftAt
  };
};

/**
 * Check if student is enrolled in a class (active)
 */
const isStudentInClass = async (studentId, classId) => {
  const enrollment = await ClassStudent.findOne({
    classId,
    studentId,
    leftAt: null
  });

  return !!enrollment;
};

module.exports = {
  joinClass,
  getJoinedClasses,
  leaveClass,
  isStudentInClass
};