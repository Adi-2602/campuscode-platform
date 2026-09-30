const mongoose = require("mongoose");
const Upload = require("../models/upload.model");
const Semester = require("../models/semester.model");
const ClassScheduleTemplate = require("../models/classScheduleTemplate.model");
const User = require("../models/user.model");
const Class = require("../models/class.model");

const { validateFiles, cleanupFiles } = require("../utils/jsonParser.util");
const { processStudentData } = require("./studentDataProcessor.service");
const { processTeacherData, extractTeacherCombinations } = require("./teacherDataProcessor.service");
const {
  createClassesFromAssignments,
  validateTemplatesForAssignments,
  autoCreateTemplatesFromAssignments
} = require("./classCreation.service");
const { autoEnrollStudentsFromUpload, getStudentEnrolledClasses } = require("./studentAutoEnroll.service");
const { sendCredentialEmailsForUpload } = require("./email.service");

const processBackgroundUpload = async (upload, files, semesterId, adminId, startTime) => {
  try {
    // STEP 1: Process student data
    console.log("Step 1: Processing student data...");
    const studentResult = await processStudentData(files.students, upload._id);

    upload.stats.studentsCreated = studentResult.studentsCreated;
    upload.stats.studentsUpdated = studentResult.studentsUpdated;
    upload.stats.studentsTotal = studentResult.total;
    upload.stats.studentsValid = studentResult.valid;
    upload.stats.studentsInvalid = studentResult.invalid;

    if (studentResult.errors.length > 0) {
      upload.errors.push(...studentResult.errors.map(e => ({
        type: "INVALID_DATA",
        message: e.error || "Student data error",
        data: e,
        timestamp: new Date()
      })));
    }

    // STEP 2: Process teacher data
    console.log("Step 2: Processing teacher data...");
    const teacherResult = await processTeacherData(
      files.teachers,
      files.facultyEmails,
      upload._id,
      semesterId
    );

    upload.stats.teachersCreated = teacherResult.teachersCreated;
    upload.stats.teachersUpdated = teacherResult.teachersUpdated;
    upload.stats.teachersTotal = teacherResult.totalAssignments; // Total assignments processed
    upload.stats.teachersValid = teacherResult.validAssignments;
    upload.stats.teachersInvalid = teacherResult.invalidAssignments;
    upload.stats.facultyMatched = teacherResult.facultyMatched;
    upload.stats.facultyMissing = teacherResult.facultyMissing;

    if (teacherResult.errors.length > 0) {
      upload.errors.push(...teacherResult.errors.map(e => ({
        type: "INVALID_DATA",
        message: e.error || "Teacher data error",
        data: e,
        timestamp: new Date()
      })));
    }

    // Add warnings for missing faculty emails
    if (teacherResult.missingFacultyList.length > 0) {
      upload.warnings.push(...teacherResult.missingFacultyList.map(m => ({
        type: "MISSING_CO_FACULTY",
        message: `Faculty email not found: ${m.facultyName}`,
        data: m,
        timestamp: new Date()
      })));
    }

    // STEP 3: Validate templates exist for all teacher assignments
    console.log("Step 3: Validating templates (Only for Practical 'J' courses)...");
    const teacherCombinations = extractTeacherCombinations(teacherResult.teacherAssignments);
    
    // We keep ALL courses for Account generation (Step 2), but we only generate 
    // Timetable templates and Active Classes for the "J" lab courses
    const jCourseCombinations = teacherCombinations.filter(assignment => {
      if (!assignment.courseCode) return false;
      const courseCodeUpper = String(assignment.courseCode).toUpperCase();
      return courseCodeUpper.endsWith('J');
    });

    const templateValidation = await validateTemplatesForAssignments(semesterId, jCourseCombinations);

    // Auto-create missing templates if any
    if (!templateValidation.valid) {
      console.log(`[OCR] Step 3.1: Auto-creating ${templateValidation.missing} missing templates for semester ${semesterId}...`);
      const newTemplates = await autoCreateTemplatesFromAssignments(
        semesterId,
        templateValidation.missingTemplates,
        adminId
      );
      console.log(`[OCR] Step 3.1: Successfully created ${newTemplates.length} templates.`);

      // Merge newly created templates into the found list
      templateValidation.foundTemplates.push(...newTemplates);
      upload.warnings.push({
        type: "OTHER",
        message: `Auto-created ${newTemplates.length} schedule templates from upload data.`,
        timestamp: new Date()
      });
    }

    // STEP 4: Create classes from templates and teacher assignments
    console.log("Step 4: Creating classes (Only for Practical 'J' courses)...");
    const classResult = await createClassesFromAssignments(
      jCourseCombinations,
      templateValidation.foundTemplates,
      upload._id,
      semesterId
    );

    upload.stats.classesCreated = classResult.created.length;

    if (classResult.errors.length > 0) {
      upload.errors.push(...classResult.errors.map(e => ({
        type: "OTHER",
        message: e.error || "Class creation error",
        data: e.assignment,
        timestamp: new Date()
      })));
    }

    if (classResult.warnings.length > 0) {
      upload.warnings.push(...classResult.warnings.map(w => ({
        type: "OTHER",
        message: w.warning || "Class creation warning",
        data: w.assignment,
        timestamp: new Date()
      })));
    }

    // STEP 5: Auto-enroll students
    console.log("Step 5: Auto-enrolling students...");
    const enrollmentResult = await autoEnrollStudentsFromUpload(upload._id, semesterId);

    upload.stats.enrollmentsCreated = enrollmentResult.totalEnrollments;

    if (enrollmentResult.errors.length > 0) {
      upload.errors.push(...enrollmentResult.errors.map(e => ({
        type: "OTHER",
        message: e.error || "Enrollment error",
        data: { studentId: e.studentId },
        timestamp: new Date()
      })));
    }

    // STEP 7: Complete upload
    upload.status = "completed";
    upload.completedAt = new Date();
    upload.processingTime = Date.now() - startTime;

    await upload.save();

    console.log(`Upload completed in ${upload.processingTime}ms`);

  } catch (error) {
    // Upload failed - update status
    upload.status = "failed";
    upload.completedAt = new Date();
    upload.processingTime = Date.now() - startTime;

    upload.errors.push({
      type: "OTHER",
      message: error.message,
      data: { stack: error.stack },
      timestamp: new Date()
    });

    await upload.save();
    console.error("Background upload processing failed:", error);
  }
};

/**
 * Main upload orchestrator
 * Processes all 3 files (buffers or paths) and creates users, classes, enrollments
 */
const orchestrateUpload = async (files, semesterId, adminId) => {
  const startTime = Date.now();

  // Validate semesterId
  if (!semesterId || !mongoose.Types.ObjectId.isValid(semesterId)) {
    throw new Error(`Invalid or missing semesterId: ${semesterId}`);
  }

  // Validate semester exists
  const semester = await Semester.findById(semesterId);
  if (!semester) {
    throw new Error("Semester not found");
  }

  // Create upload record
  const upload = await Upload.create({
    semester: semesterId,
    uploadedBy: adminId,
    uploadedAt: new Date(),
    files: [
      { fileName: files.studentsName || "students.json", fileType: "students", filePath: null },
      { fileName: files.teachersName || "teachers.json", fileType: "teachers", filePath: null },
      { fileName: files.facultyEmailsName || "faculty_emails.json", fileType: "faculty_emails", filePath: null }
    ],
    status: "processing"
  });

  // Fire and forget background process
  processBackgroundUpload(upload, files, semesterId, adminId, startTime).catch(err => {
    console.error("Critical error in processBackgroundUpload wrapper:", err);
  });

  return {
    uploadId: upload._id,
    status: "processing",
    message: "Upload initiated successfully. Processing in background."
  };
};

/**
 * Get upload status and details
 */
const getUploadStatus = async (uploadId) => {
  const upload = await Upload.findById(uploadId)
    .populate("semester", "name academicYear")
    .populate("uploadedBy", "name email role")
    .lean();

  if (!upload) {
    throw new Error("Upload not found");
  }

  return upload;
};

/**
 * Get all uploads with optional filters
 */
const getAllUploads = async (filters = {}, options = {}) => {
  const { semesterId, status } = filters;
  const { page = 1, limit = 20, sort = "-uploadedAt" } = options;

  const query = {};

  if (semesterId) {
    query.semester = semesterId;
  }

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [uploads, total] = await Promise.all([
    Upload.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("semester", "name academicYear")
      .populate("uploadedBy", "name email")
      .lean(),
    Upload.countDocuments(query)
  ]);

  return {
    uploads,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get upload statistics
 */
const getUploadStatistics = async () => {
  const [total, byStatus, recent] = await Promise.all([
    Upload.countDocuments(),
    Upload.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]),
    Upload.find()
      .sort("-uploadedAt")
      .limit(5)
      .populate("semester", "name academicYear")
      .populate("uploadedBy", "name email")
      .lean()
  ]);

  return {
    total,
    byStatus,
    recentUploads: recent
  };
};

/**
 * Manually trigger credential emails for an upload
 */
const sendEmailsForUpload = async (uploadId, customCredentials = null) => {
  const upload = await Upload.findById(uploadId);
  if (!upload) {
    throw new Error("Upload not found");
  }

  if (upload.status !== "completed") {
    throw new Error(`Cannot send emails for upload with status: ${upload.status}`);
  }

  if (upload.credentialsSent) {
    throw new Error("Credentials have already been sent for this upload");
  }

  // 1. Get all students created/updated in this upload
  const studentIds = [
    ...(upload.stats.studentsCreatedDetail || []),
    ...(upload.stats.studentsUpdatedDetail || [])
  ];

  const studentUsers = await User.find({
    role: "student",
    _id: { $in: studentIds }
  }).lean();

  // 2. Prepare students with their enrolled classes
  const studentsWithClasses = await Promise.all(
    studentUsers.map(async (student) => {
      const enrolledClasses = await getStudentEnrolledClasses(student._id);
      return {
        ...student,
        studentName: student.name,
        enrolledClasses: enrolledClasses.map(ec => ({
          courseName: ec.courseName,
          courseCode: ec.courseCode,
          labDay: ec.labDay,
          labStartTime: ec.labStartTime,
          labEndTime: ec.labEndTime,
          venue: ec.venue
        }))
      };
    })
  );

  // 3. Get all teachers created/updated in this upload
  const teacherIds = [
    ...(upload.stats.teachersCreatedDetail || []),
    ...(upload.stats.teachersUpdatedDetail || [])
  ];

  const teacherUsers = await User.find({
    role: "teacher",
    _id: { $in: teacherIds }
  }).lean();

  // 4. Prepare teachers with their assigned classes
  const uploadClasses = await Class.find({
    _id: { $in: upload.stats.classesCreatedDetail || [] }
  }).lean();

  const teachersWithClasses = await Promise.all(
    teacherUsers.map(async (teacher) => {
      const assignedClasses = uploadClasses.filter(
        c => c.mainFaculty === teacher.name
      );
      return {
        ...teacher,
        facultyName: teacher.name,
        assignedClasses: assignedClasses.map(ac => ({
          courseName: ac.name,
          courseCode: ac.courseCode,
          batch: ac.batch,
          section: ac.section,
          group: ac.group,
          labDay: ac.labDay,
          labStartTime: ac.labStartTime,
          labEndTime: ac.labEndTime,
          venue: ac.venue
        }))
      };
    })
  );

  // 5. Send emails
  const emailResult = await sendCredentialEmailsForUpload(
    studentsWithClasses,
    teachersWithClasses,
    customCredentials
  );

  // 6. Update upload record
  upload.credentialsSent = true;
  upload.credentialsSentAt = new Date();
  upload.stats.emailsSent = (emailResult.sent || []).length;
  upload.stats.emailsFailed = (emailResult.failed || []).length;

  if (emailResult.failed && emailResult.failed.length > 0) {
    upload.errors.push(...emailResult.failed.map(e => ({
      type: "EMAIL_SEND_FAILED",
      message: `Failed to send email to ${e.to}: ${e.error}`,
      data: e,
      timestamp: new Date()
    })));
  }

  await upload.save();

  return {
    sent: (emailResult.sent || []).length,
    failed: (emailResult.failed || []).length,
    timestamp: upload.credentialsSentAt
  };
};

/**
 * Clear all semester-related data (Classes, Templates, Students, etc.)
 * This is used for a clean start when re-uploading data
 */
const clearSemesterData = async (semesterId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log(`[OCR] Starting clear data for semester: ${semesterId}`);

    // 1. Find all classes for this semester
    const classes = await Class.find({ semester: semesterId }).session(session);
    const classIds = classes.map(c => c._id);

    // 2. Import dependent models (lazy load to avoid circular deps if any)
    const ClassStudent = require("../models/classStudent.model");
    const Submission = require("../models/submission.model");
    const Exam = require("../models/exam.model");
    const StudentExam = require("../models/studentExam.model");
    const FinalResult = require("../models/finalResult.model");

    // 3. Clear all dependent records linked to these classes
    if (classIds.length > 0) {
      await ClassStudent.deleteMany({ classId: { $in: classIds } }).session(session);
      await Submission.deleteMany({ classId: { $in: classIds } }).session(session);
      
      // Find exams to clear their student entries
      const exams = await Exam.find({ classId: { $in: classIds } }).session(session);
      const examIds = exams.map(e => e._id);
      
      if (examIds.length > 0) {
        await StudentExam.deleteMany({ examId: { $in: examIds } }).session(session);
        await FinalResult.deleteMany({ examId: { $in: examIds } }).session(session);
      }
      
      // Clear exams themselves
      await Exam.deleteMany({ classId: { $in: classIds } }).session(session);
    }

    // 4. Clear core data (Classes, Templates, Uploads)
    await Class.deleteMany({ semester: semesterId }).session(session);
    await ClassScheduleTemplate.deleteMany({ semester: semesterId }).session(session);
    await Upload.deleteMany({ semester: semesterId }).session(session);

    // 5. Clear users (students/teachers)
    // Keep admins and superadmins
    const deletedUsers = await User.deleteMany({ 
      role: { $in: ["student", "teacher"] } 
    }).session(session);

    await session.commitTransaction();
    console.log(`[OCR] Successfully cleared data for ${classes.length} classes and ${deletedUsers.deletedCount} users.`);

    return {
      success: true,
      deletedClasses: classes.length,
      deletedUsers: deletedUsers.deletedCount
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("[OCR] Failed to clear semester data:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  orchestrateUpload,
  getUploadStatus,
  getAllUploads,
  getUploadStatistics,
  sendEmailsForUpload,
  clearSemesterData
};