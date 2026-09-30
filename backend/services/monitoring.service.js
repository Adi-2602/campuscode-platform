const User = require("../models/user.model");
const Class = require("../models/class.model");
const ClassStudent = require("../models/classStudent.model");
const Exam = require("../models/exam.model");
const StudentExam = require("../models/studentExam.model");
const Submission = require("../models/submission.model");
const Question = require("../models/question.model");
const AutoEvaluation = require("../models/autoEvaluation.model");
const ManualEvaluation = require("../models/manualEvaluation.model");
const FinalResult = require("../models/finalResult.model");

/**
 * Get all classes with statistics
 * Permission: VIEW_CLASSES
 */
const getAllClasses = async (filters = {}, options = {}) => {
  const { teacherId, isLocked, search, semesterId } = filters;
  const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;

  const query = {};

  if (teacherId) query.createdBy = teacherId;
  if (isLocked !== undefined) query.isLocked = isLocked;
  if (semesterId) query.semester = semesterId;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (page - 1) * limit;

  const [classes, total] = await Promise.all([
    Class.find(query)
      .populate("createdBy", "name email")
      .populate("mainFaculty", "facultyName email")
      .populate("coFaculties", "facultyName email")
      .populate("semester", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Class.countDocuments(query)
  ]);

  // Enrich with statistics
  const enrichedClasses = await Promise.all(
    classes.map(async (classItem) => {
      let studentCount = 0;

      // Calculate student count based on metadata if available
      if (classItem.batch !== null && classItem.section) {
        const studentQuery = {
          role: 'student',
          batch: classItem.batch,
          section: classItem.section
        };

        if (classItem.group !== null) {
          studentQuery.group = classItem.group;
        }

        // Add semester filter to student count if available in class
        if (classItem.semester) {
          // If semester is a number in User model but ObjectId in Class
          // We need to fetch the semester number if needed.
          // For now, assume batch+section+group is unique enough or links by semester name
        }

        studentCount = await User.countDocuments(studentQuery);
      } else {
        // Fallback to explicit enrollment
        studentCount = await ClassStudent.countDocuments({
          classId: classItem._id,
          leftAt: null
        });
      }

      const examCount = await Exam.countDocuments({ classId: classItem._id });

      return {
        ...classItem,
        studentCount,
        examCount
      };
    })
  );

  return {
    classes: enrichedClasses,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single class details with full statistics
 * Permission: VIEW_CLASSES
 */
const getClassDetails = async (classId) => {
  const classData = await Class.findById(classId)
    .populate("createdBy", "name email")
    .populate("mainFaculty", "facultyName email")
    .populate("coFaculties", "facultyName email")
    .lean();

  if (!classData) {
    throw new Error("Class not found");
  }

  // Get students in class
  const students = await ClassStudent.find({
    classId,
    leftAt: null
  })
    .populate("studentId", "name email rollNo")
    .sort({ joinedAt: -1 })
    .lean();

  // Get exams for this class
  const exams = await Exam.find({ classId })
    .populate("createdBy", "name email")
    .select("title state startTime endTime totalMarks")
    .sort({ createdAt: -1 })
    .lean();

  return {
    class: classData,
    studentCount: students.length,
    students: students.map((s) => ({
      ...s.studentId,
      joinedAt: s.joinedAt
    })),
    examCount: exams.length,
    exams
  };
};

/**
 * Get all students with statistics
 * Permission: VIEW_STUDENTS
 */
const getAllStudents = async (filters = {}, options = {}) => {
  const { search, status, batch, section, group } = filters;
  const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;

  const query = { role: "student" };

  if (status) query.status = status;
  if (batch) query.batch = batch;
  if (section) query.section = section;
  if (group) query.group = group;
  if (filters.semester) query.semester = filters.semester;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { rollNo: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (page - 1) * limit;

  const [students, total] = await Promise.all([
    User.find(query)
      .select("-passwordHash")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  // Enrich with statistics
  const enrichedStudents = await Promise.all(
    students.map(async (student) => {
      const [classCount, examCount, submissionCount] = await Promise.all([
        ClassStudent.countDocuments({
          studentId: student._id,
          leftAt: null
        }),
        StudentExam.countDocuments({ studentId: student._id }),
        Submission.countDocuments({ studentId: student._id })
      ]);

      return {
        ...student,
        classCount,
        examCount,
        submissionCount
      };
    })
  );

  return {
    students: enrichedStudents,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single student details with full statistics
 * Permission: VIEW_STUDENTS
 */
const getStudentDetails = async (studentId) => {
  const student = await User.findOne({
    _id: studentId,
    role: "student"
  })
    .select("-passwordHash")
    .lean();

  if (!student) {
    throw new Error("Student not found");
  }

  // Get enrolled classes
  const enrollments = await ClassStudent.find({
    studentId,
    leftAt: null
  })
    .populate("classId")
    .sort({ joinedAt: -1 })
    .lean();

  // Get exams taken
  const studentExams = await StudentExam.find({ studentId })
    .populate("examId", "title totalMarks state")
    .sort({ startedAt: -1 })
    .lean();

  // Get submissions
  const submissions = await Submission.find({ studentId })
    .populate("questionId", "title")
    .populate("examId", "title")
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Get results
  const results = await FinalResult.find({ studentId })
    .populate("examId", "title totalMarks")
    .sort({ createdAt: -1 })
    .lean();

  return {
    student,
    enrolledClasses: enrollments.map((e) => ({
      ...e.classId,
      joinedAt: e.joinedAt
    })),
    exams: studentExams,
    recentSubmissions: submissions,
    results,
    statistics: {
      totalClasses: enrollments.length,
      totalExams: studentExams.length,
      completedExams: studentExams.filter((e) => e.isSubmitted).length,
      totalSubmissions: await Submission.countDocuments({ studentId }),
      averageScore:
        results.length > 0
          ? (
            results.reduce((sum, r) => sum + r.finalTotal, 0) / results.length
          ).toFixed(2)
          : 0
    }
  };
};

/**
 * Get all teachers with statistics
 * Permission: VIEW_TEACHERS
 */
const getAllTeachers = async (filters = {}, options = {}) => {
  const { search, isVerified, status } = filters;
  const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;

  const query = { role: "teacher" };

  if (isVerified !== undefined) query.isVerified = isVerified;
  if (status) query.status = status;
  if (search) {
    const searchRegex = new RegExp(search.split(/\\s+/).filter(Boolean).map(term => `(?=.*${term})`).join(''), 'i');
    const searchConditions = [
      { name: { $regex: searchRegex } },
      { email: { $regex: searchRegex } }
    ];

    if (!isNaN(search) && search.trim() !== '') {
      searchConditions.push({ facultyId: Number(search) });
    }

    query.$or = searchConditions;
  }

  const skip = (page - 1) * limit;

  const [teachers, total] = await Promise.all([
    User.find(query)
      .select("-passwordHash")
      .populate("verifiedBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  // Enrich with statistics
  const enrichedTeachers = await Promise.all(
    teachers.map(async (teacher) => {
      const [classCount, examCount, questionCount] = await Promise.all([
        Class.countDocuments({ createdBy: teacher._id }),
        Exam.countDocuments({ createdBy: teacher._id }),
        Question.countDocuments({ createdBy: teacher._id })
      ]);

      return {
        ...teacher,
        classCount,
        examCount,
        questionCount
      };
    })
  );

  return {
    teachers: enrichedTeachers,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single teacher details with full statistics
 * Permission: VIEW_TEACHERS
 */
const getTeacherDetails = async (teacherId) => {
  const teacher = await User.findOne({
    _id: teacherId,
    role: "teacher"
  })
    .select("-passwordHash")
    .populate("verifiedBy", "name email")
    .lean();

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  // Get classes created
  const classes = await Class.find({ createdBy: teacherId })
    .sort({ createdAt: -1 })
    .lean();

  // Get exams created
  const exams = await Exam.find({ createdBy: teacherId })
    .populate("classId", "name")
    .sort({ createdAt: -1 })
    .lean();

  // Get questions created
  const questions = await Question.find({ createdBy: teacherId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return {
    teacher,
    classes,
    exams,
    recentQuestions: questions,
    statistics: {
      totalClasses: classes.length,
      totalExams: exams.length,
      totalQuestions: await Question.countDocuments({ createdBy: teacherId }),
      activeExams: exams.filter((e) => e.state === "ongoing").length
    }
  };
};

/**
 * Get all live/ongoing exams
 * Permission: VIEW_LIVE_EXAMS
 */
const getLiveExams = async () => {
  const now = new Date();

  // Find exams that are currently ongoing
  const liveExams = await Exam.find({
    state: "ongoing",
    startTime: { $lte: now },
    endTime: { $gte: now }
  })
    .populate("createdBy", "name email")
    .populate("classId", "name code")
    .sort({ startTime: 1 })
    .lean();

  // Enrich with real-time data
  const enrichedExams = await Promise.all(
    liveExams.map(async (exam) => {
      const [totalStudents, activeStudents, submittedStudents, submissions] =
        await Promise.all([
          StudentExam.countDocuments({ examId: exam._id }),
          StudentExam.countDocuments({
            examId: exam._id,
            isSubmitted: false
          }),
          StudentExam.countDocuments({
            examId: exam._id,
            isSubmitted: true
          }),
          Submission.countDocuments({ examId: exam._id })
        ]);

      const timeRemaining = Math.max(
        0,
        Math.floor((exam.endTime - now) / 1000 / 60)
      ); // minutes

      return {
        ...exam,
        totalStudents,
        activeStudents,
        submittedStudents,
        totalSubmissions: submissions,
        timeRemaining: `${timeRemaining} minutes`
      };
    })
  );

  return enrichedExams;
};

/**
 * Get detailed exam information
 * Permission: VIEW_EXAM_DETAILS
 */
const getExamDetails = async (examId) => {
  const exam = await Exam.findById(examId)
    .populate("createdBy", "name email")
    .populate("classId", "name code")
    .populate("questions")
    .lean();

  if (!exam) {
    throw new Error("Exam not found");
  }

  // Get students who started the exam
  const studentExams = await StudentExam.find({ examId })
    .populate("studentId", "name email rollNo")
    .sort({ startedAt: -1 })
    .lean();

  // Get all submissions for this exam
  const submissions = await Submission.find({ examId })
    .populate("studentId", "name email")
    .populate("questionId", "title")
    .sort({ createdAt: -1 })
    .lean();

  // Get results
  const results = await FinalResult.find({ examId })
    .populate("studentId", "name email")
    .lean();

  return {
    exam,
    students: studentExams.map((se) => ({
      ...se.studentId,
      startedAt: se.startedAt,
      isSubmitted: se.isSubmitted,
      submittedAt: se.submittedAt
    })),
    submissions,
    results,
    statistics: {
      totalStudents: studentExams.length,
      completedStudents: studentExams.filter((se) => se.isSubmitted).length,
      pendingStudents: studentExams.filter((se) => !se.isSubmitted).length,
      totalSubmissions: submissions.length,
      resultsPublished: results.filter((r) => r.published).length
    }
  };
};

/**
 * Get all code submissions with filters
 * Permission: VIEW_CODE_LOGS or VIEW_SUBMISSION_LOGS
 */
const getAllSubmissions = async (filters = {}, options = {}) => {
  const { studentId, examId, questionId, languageId, startDate, endDate } =
    filters;
  const { page = 1, limit = 50, sort = { createdAt: -1 } } = options;

  const query = {};

  if (studentId) query.studentId = studentId;
  if (examId) query.examId = examId;
  if (questionId) query.questionId = questionId;
  if (languageId) query.languageId = languageId;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [submissions, total] = await Promise.all([
    Submission.find(query)
      .populate("studentId", "name email rollNo")
      .populate("examId", "title")
      .populate("questionId", "title")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Submission.countDocuments(query)
  ]);

  return {
    submissions,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get compiler/execution logs
 * Permission: VIEW_COMPILER_LOGS
 */
const getCompilerLogs = async (filters = {}, options = {}) => {
  const { languageId, status, startDate, endDate } = filters;
  const { page = 1, limit = 50 } = options;

  const query = {};

  if (languageId) query.languageId = languageId;
  if (status) query.status = status;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    Submission.find(query)
      .select("languageId status time memory compileOutput stderr createdAt")
      .populate("studentId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Submission.countDocuments(query)
  ]);

  // Get statistics
  const stats = await Submission.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$languageId",
        count: { $sum: 1 },
        avgTime: { $avg: "$time" },
        avgMemory: { $avg: "$memory" },
        successCount: {
          $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] }
        }
      }
    }
  ]);

  return {
    logs,
    statistics: stats,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get user activity logs
 * Permission: VIEW_USER_ACTIVITY
 */
const getUserActivity = async (filters = {}, options = {}) => {
  const { userId, role, startDate, endDate } = filters;
  const { page = 1, limit = 50 } = options;

  // Activity is tracked through various collections
  // For now, we'll return submission activity
  const query = {};

  if (userId) query.studentId = userId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [activity, total] = await Promise.all([
    Submission.find(query)
      .populate("studentId", "name email role")
      .populate("examId", "title")
      .select("studentId examId createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Submission.countDocuments(query)
  ]);

  return {
    activity: activity.map((a) => ({
      user: a.studentId,
      action: "code_submission",
      exam: a.examId,
      timestamp: a.createdAt
    })),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get system-wide statistics
 */
const getSystemStats = async (semesterId = null) => {
  const userQuery = { role: "student" };
  const classQuery = {};
  const examQuery = {};
  const teacherQuery = { role: "teacher", isVerified: true };

  if (semesterId) {
    // Note: User model stores semester as Number (e.g. 4), 
    // while Class/Exam use ObjectId. This is a potential complex mapping.
    // For now, only filter Class and Exam by ObjectId.
    classQuery.semester = semesterId;
    examQuery.semesterId = semesterId; // Check field name in Exam model
  }

  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalExams,
    totalSubmissions,
    activeExams,
    ongoingExams
  ] = await Promise.all([
    User.countDocuments(userQuery),
    User.countDocuments(teacherQuery),
    Class.countDocuments(classQuery),
    Exam.countDocuments(examQuery),
    Submission.countDocuments(semesterId ? { examId: { $in: await Exam.find(examQuery).distinct('_id') } } : {}),
    Exam.countDocuments({ ...examQuery, state: { $in: ["published", "ongoing"] } }),
    Exam.countDocuments({ ...examQuery, state: "ongoing" })
  ]);

  return {
    users: {
      students: totalStudents,
      teachers: totalTeachers,
      total: totalStudents + totalTeachers
    },
    classes: totalClasses,
    exams: {
      total: totalExams,
      active: activeExams,
      ongoing: ongoingExams
    },
    submissions: totalSubmissions
  };
};

/**
 * Update user details
 * Permission: MANAGE_USERS
 */
const updateUser = async (userId, data) => {
  const allowedFields = [
    'name', 'email', 'rollNo', 'rollNumber', 'semester', 'batch', 'section', 'group', 'status', 'isVerified',
    'department', 'designation', 'facultyId', 'mobile',
    'program', 'branch', 'specialization', 'campus', 'gender', 'bloodGroup', 'dob', 'address',
    'parentName', 'parentMobile', 'parentEmail', 'facultyAdvisor', 'facultyAdvisorMobile'
  ];
  const updateData = {};

  Object.keys(data).forEach(key => {
    if (allowedFields.includes(key)) {
      updateData[key] = data[key];
    }
  });

  // Handle rollNo/rollNumber alias
  if (updateData.rollNumber) {
    updateData.rollNo = updateData.rollNumber;
    delete updateData.rollNumber;
  }

  const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-passwordHash");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

module.exports = {
  getAllClasses,
  getClassDetails,
  getAllStudents,
  getStudentDetails,
  getAllTeachers,
  getTeacherDetails,
  getLiveExams,
  getExamDetails,
  getAllSubmissions,
  getCompilerLogs,
  getUserActivity,
  getSystemStats,
  updateUser
};