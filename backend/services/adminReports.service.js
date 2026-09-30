const Semester = require("../models/semester.model");
const Class = require("../models/class.model");
const ClassStudent = require("../models/classStudent.model");
const User = require("../models/user.model");
const LabSlot = require("../models/labSlot.model");

/**
 * Get semester enrollment statistics
 */
const getSemesterEnrollmentStats = async (semesterId) => {
  const semester = await Semester.findById(semesterId);
  if (!semester) {
    throw new Error("Semester not found");
  }

  // Get all classes in this semester
  const classes = await Class.find({ semester: semesterId });
  const classIds = classes.map(c => c._id);

  // Get enrollment stats
  const [
    totalEnrollments,
    totalStudents,
    totalClasses,
    byBatch,
    bySection,
    byGroup
  ] = await Promise.all([
    ClassStudent.countDocuments({ classId: { $in: classIds }, leftAt: null }),
    ClassStudent.distinct("studentId", { classId: { $in: classIds }, leftAt: null }).then(arr => arr.length),
    classes.length,
    
    // Group by batch
    ClassStudent.aggregate([
      { $match: { classId: { $in: classIds }, leftAt: null } },
      {
        $lookup: {
          from: "classes",
          localField: "classId",
          foreignField: "_id",
          as: "class"
        }
      },
      { $unwind: "$class" },
      {
        $group: {
          _id: "$class.batch",
          students: { $addToSet: "$studentId" },
          enrollments: { $sum: 1 },
          classes: { $addToSet: "$classId" }
        }
      },
      {
        $project: {
          batch: "$_id",
          studentCount: { $size: "$students" },
          enrollmentCount: "$enrollments",
          classCount: { $size: "$classes" }
        }
      },
      { $sort: { batch: 1 } }
    ]),
    
    // Group by section
    ClassStudent.aggregate([
      { $match: { classId: { $in: classIds }, leftAt: null } },
      {
        $lookup: {
          from: "classes",
          localField: "classId",
          foreignField: "_id",
          as: "class"
        }
      },
      { $unwind: "$class" },
      {
        $group: {
          _id: { batch: "$class.batch", section: "$class.section" },
          students: { $addToSet: "$studentId" },
          enrollments: { $sum: 1 }
        }
      },
      {
        $project: {
          batch: "$_id.batch",
          section: "$_id.section",
          studentCount: { $size: "$students" },
          enrollmentCount: "$enrollments"
        }
      },
      { $sort: { batch: 1, section: 1 } }
    ]),
    
    // Group by group
    ClassStudent.aggregate([
      { $match: { classId: { $in: classIds }, leftAt: null } },
      {
        $lookup: {
          from: "classes",
          localField: "classId",
          foreignField: "_id",
          as: "class"
        }
      },
      { $unwind: "$class" },
      {
        $group: {
          _id: "$class.group",
          students: { $addToSet: "$studentId" },
          enrollments: { $sum: 1 }
        }
      },
      {
        $project: {
          group: "$_id",
          studentCount: { $size: "$students" },
          enrollmentCount: "$enrollments"
        }
      },
      { $sort: { group: 1 } }
    ])
  ]);

  return {
    semester: {
      id: semester._id,
      name: semester.name,
      academicYear: semester.academicYear
    },
    overview: {
      totalEnrollments,
      totalStudents,
      totalClasses,
      averageEnrollmentsPerStudent: totalStudents > 0 ? (totalEnrollments / totalStudents).toFixed(2) : 0,
      averageStudentsPerClass: totalClasses > 0 ? (totalEnrollments / totalClasses).toFixed(2) : 0
    },
    byBatch,
    bySection,
    byGroup
  };
};

/**
 * Get lab utilization report
 */
const getLabUtilizationReport = async (semesterId) => {
  const semester = await Semester.findById(semesterId);
  if (!semester) {
    throw new Error("Semester not found");
  }

  // Get all lab slots
  const labSlots = await LabSlot.find({ isActive: true });

  // Get all classes in semester
  const classes = await Class.find({ semester: semesterId });

  // Calculate utilization per slot
  const utilization = labSlots.map(slot => {
    const classesUsingSlot = classes.filter(cls => 
      cls.labSlots?.some(s => s.toString() === slot._id.toString())
    );

    return {
      slotCode: slot.slotCode,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      batch: slot.batch,
      hourOrder: slot.hourOrder,
      classesUsing: classesUsingSlot.length,
      isUsed: classesUsingSlot.length > 0,
      classes: classesUsingSlot.map(c => ({
        className: c.name,
        courseCode: c.courseCode,
        section: c.section,
        group: c.group
      }))
    };
  });

  // Calculate overall stats
  const totalSlots = labSlots.length;
  const usedSlots = utilization.filter(u => u.isUsed).length;
  const utilizationRate = totalSlots > 0 ? ((usedSlots / totalSlots) * 100).toFixed(2) : 0;

  // Group by day
  const byDay = {};
  utilization.forEach(slot => {
    if (!byDay[slot.day]) {
      byDay[slot.day] = { total: 0, used: 0, slots: [] };
    }
    byDay[slot.day].total++;
    if (slot.isUsed) byDay[slot.day].used++;
    byDay[slot.day].slots.push(slot);
  });

  return {
    semester: {
      id: semester._id,
      name: semester.name,
      academicYear: semester.academicYear
    },
    overview: {
      totalSlots,
      usedSlots,
      unusedSlots: totalSlots - usedSlots,
      utilizationRate: parseFloat(utilizationRate)
    },
    byDay,
    detailedUtilization: utilization
  };
};

/**
 * Get teacher load distribution
 */
const getTeacherLoadDistribution = async (semesterId) => {
  const semester = semesterId ? await Semester.findById(semesterId) : null;

  const query = semesterId ? { semester: semesterId } : {};
  const classes = await Class.find(query).populate("mainFaculty", "facultyName email");

  // Calculate load per teacher
  const teacherLoad = {};

  classes.forEach(cls => {
    const teacherId = cls.mainFaculty?._id?.toString();
    if (!teacherId) return;

    if (!teacherLoad[teacherId]) {
      teacherLoad[teacherId] = {
        teacherId,
        facultyName: cls.mainFaculty.facultyName,
        email: cls.mainFaculty.email,
        classes: [],
        totalClasses: 0,
        totalWeeklyHours: 0,
        batches: new Set(),
        sections: new Set()
      };
    }

    teacherLoad[teacherId].classes.push({
      className: cls.name,
      courseCode: cls.courseCode,
      batch: cls.batch,
      section: cls.section,
      group: cls.group,
      duration: cls.labDuration || 0
    });
    teacherLoad[teacherId].totalClasses++;
    teacherLoad[teacherId].totalWeeklyHours += (cls.labDuration || 0);
    teacherLoad[teacherId].batches.add(cls.batch);
    teacherLoad[teacherId].sections.add(cls.section);
  });

  // Convert sets to counts
  const distribution = Object.values(teacherLoad).map(t => ({
    ...t,
    batches: t.batches.size,
    sections: t.sections.size,
    weeklyHours: Math.floor(t.totalWeeklyHours / 60),
    weeklyMinutes: t.totalWeeklyHours % 60
  }));

  // Sort by total classes (descending)
  distribution.sort((a, b) => b.totalClasses - a.totalClasses);

  return {
    semester: semester ? {
      id: semester._id,
      name: semester.name,
      academicYear: semester.academicYear
    } : null,
    overview: {
      totalTeachers: distribution.length,
      totalClasses: classes.length,
      averageClassesPerTeacher: distribution.length > 0 
        ? (classes.length / distribution.length).toFixed(2) 
        : 0
    },
    distribution
  };
};

/**
 * Get students by batch and section
 */
const getStudentsByBatchSection = async (semesterId, batch, section) => {
  // Find students enrolled in classes for this batch/section/semester
  const classes = await Class.find({
    semester: semesterId,
    batch,
    section
  });

  const classIds = classes.map(c => c._id);

  const enrollments = await ClassStudent.find({
    classId: { $in: classIds },
    leftAt: null
  })
    .populate("studentId", "registrationNumber studentName email semester batch section group")
    .populate("classId", "name courseCode courseName group")
    .lean();

  // Group by student
  const studentMap = {};
  enrollments.forEach(enrollment => {
    const studentId = enrollment.studentId._id.toString();
    
    if (!studentMap[studentId]) {
      studentMap[studentId] = {
        studentId: enrollment.studentId._id,
        registrationNumber: enrollment.studentId.registrationNumber,
        studentName: enrollment.studentId.studentName,
        email: enrollment.studentId.email,
        semester: enrollment.studentId.semester,
        batch: enrollment.studentId.batch,
        section: enrollment.studentId.section,
        group: enrollment.studentId.group,
        classes: []
      };
    }

    studentMap[studentId].classes.push({
      className: enrollment.classId.name,
      courseCode: enrollment.classId.courseCode,
      courseName: enrollment.classId.courseName,
      group: enrollment.classId.group,
      enrolledAt: enrollment.joinedAt
    });
  });

  const students = Object.values(studentMap);

  return {
    batch,
    section,
    totalStudents: students.length,
    students
  };
};

module.exports = {
  getSemesterEnrollmentStats,
  getLabUtilizationReport,
  getTeacherLoadDistribution,
  getStudentsByBatchSection
};