const ClassStudent = require("../models/classStudent.model");
const Class = require("../models/class.model");
const User = require("../models/user.model");
const Exam = require("../models/exam.model");
const StudentExam = require("../models/studentExam.model");
const AutoEvaluation = require("../models/autoEvaluation.model");
const ManualEvaluation = require("../models/manualEvaluation.model");
const FinalResult = require("../models/finalResult.model");
const Semester = require("../models/semester.model");

/**
 * Get student's weekly timetable
 * Returns all classes grouped by day with time slots
 */
const getStudentWeeklyTimetable = async (studentId) => {
  // Get all enrolled classes
  const enrollments = await ClassStudent.find({
    studentId,
    leftAt: null
  })
    .populate({
      path: "classId",
      populate: [
        { path: "mainFaculty", select: "facultyName email" },
        { path: "coFaculties", select: "facultyName email" },
        { path: "semester", select: "name academicYear" }
      ]
    })
    .lean();

  // Filter out null classes (in case class was deleted)
  const validEnrollments = enrollments.filter(e => e.classId);

  // Group by day
  const timetable = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: []
  };

  validEnrollments.forEach(enrollment => {
    const classData = enrollment.classId;
    
    if (classData.labDay) {
      const entry = {
        classId: classData._id,
        className: classData.name,
        name: classData.name, // Alias
        code: classData.code,
        courseCode: classData.courseCode,
        courseName: classData.courseName,
        venue: classData.venue,
        labDay: classData.labDay,
        labStartTime: classData.labStartTime,
        startTime: classData.labStartTime, // Alias
        labEndTime: classData.labEndTime,
        endTime: classData.labEndTime, // Alias
        labDuration: classData.labDuration,
        mainFaculty: classData.mainFaculty?.facultyName || "TBA",
        mainFacultyEmail: classData.mainFaculty?.email || null,
        coFaculties: classData.coFaculties?.map(cf => cf.facultyName) || [],
        semester: classData.semester?.name || null,
        batch: classData.batch,
        section: classData.section,
        group: classData.group,
        autoEnrolled: enrollment.autoEnrolled
      };

      if (timetable[classData.labDay]) {
        timetable[classData.labDay].push(entry);
      }
    }
  });

  // Sort each day by start time
  Object.keys(timetable).forEach(day => {
    timetable[day].sort((a, b) => {
      if (!a.labStartTime) return 1;
      if (!b.labStartTime) return -1;
      return a.labStartTime.localeCompare(b.labStartTime);
    });
  });

  // Calculate Weekly Hours
  let totalMinutes = 0;
  validEnrollments.forEach(e => {
    if (e.classId?.labDuration) {
      totalMinutes += e.classId.labDuration;
    } else if (e.classId?.labStartTime && e.classId?.labEndTime) {
      // Fallback: calculate from start/end if duration missing
      const [sh, sm] = e.classId.labStartTime.split(':').map(Number);
      const [eh, em] = e.classId.labEndTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) totalMinutes += diff;
    }
  });

  const weeklyHours = {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60
  };

  // Find Next Class
  const upcomingData = await getUpcomingLabs(studentId);
  const nextClassRaw = upcomingData.upcoming?.[0] || null;
  let nextClass = null;
  
  if (nextClassRaw) {
    nextClass = {
      name: nextClassRaw.className,
      startTime: nextClassRaw.labStartTime,
      endTime: nextClassRaw.labEndTime,
      day: nextClassRaw.dayName,
      venue: nextClassRaw.venue,
      courseCode: nextClassRaw.courseCode
    };
  }

  return {
    timetable,
    totalClasses: validEnrollments.length,
    daysWithClasses: Object.keys(timetable).filter(day => timetable[day].length > 0),
    weeklyHours,
    nextClass
  };
};

/**
 * Get student's daily schedule for a specific day
 */
const getStudentDailySchedule = async (studentId, day) => {
  // Validate day
  const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if (!validDays.includes(day)) {
    throw new Error(`Invalid day. Must be one of: ${validDays.join(", ")}`);
  }

  // Get all enrolled classes for this day
  const enrollments = await ClassStudent.find({
    studentId,
    leftAt: null
  })
    .populate({
      path: "classId",
      match: { labDay: day },
      populate: [
        { path: "mainFaculty", select: "facultyName email mobile" },
        { path: "coFaculties", select: "facultyName email" },
        { path: "semester", select: "name academicYear" }
      ]
    })
    .lean();

  // Filter out null classes
  const validEnrollments = enrollments.filter(e => e.classId);

  // Format schedule
  const schedule = validEnrollments.map(enrollment => {
    const classData = enrollment.classId;
    return {
      classId: classData._id,
      className: classData.name,
      code: classData.code,
      courseCode: classData.courseCode,
      courseName: classData.courseName,
      venue: classData.venue,
      labStartTime: classData.labStartTime,
      labEndTime: classData.labEndTime,
      labDuration: classData.labDuration,
      mainFaculty: {
        name: classData.mainFaculty?.facultyName || "TBA",
        email: classData.mainFaculty?.email || null,
        mobile: classData.mainFaculty?.mobile || null
      },
      coFaculties: classData.coFaculties?.map(cf => ({
        name: cf.facultyName,
        email: cf.email
      })) || [],
      semester: classData.semester?.name || null,
      batch: classData.batch,
      section: classData.section,
      group: classData.group
    };
  });

  // Sort by start time
  schedule.sort((a, b) => {
    if (!a.labStartTime) return 1;
    if (!b.labStartTime) return -1;
    return a.labStartTime.localeCompare(b.labStartTime);
  });

  return {
    day,
    schedule,
    totalClasses: schedule.length
  };
};

/**
 * Get upcoming labs (next 7 days)
 */
const getUpcomingLabs = async (studentId) => {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const currentDay = daysOfWeek[today.getDay()];
  
  // Get all enrolled classes
  const enrollments = await ClassStudent.find({
    studentId,
    leftAt: null
  })
    .populate({
      path: "classId",
      populate: [
        { path: "mainFaculty", select: "facultyName email" },
        { path: "semester", select: "name academicYear" }
      ]
    })
    .lean();

  // Filter out null classes
  const validEnrollments = enrollments.filter(e => e.classId);

  // Build upcoming schedule
  const upcoming = [];
  
  for (let i = 0; i < 7; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const dayName = daysOfWeek[futureDate.getDay()];
    
    const classesOnDay = validEnrollments
      .filter(e => e.classId.labDay === dayName)
      .map(enrollment => {
        const classData = enrollment.classId;
        return {
          date: futureDate.toISOString().split('T')[0],
          dayName,
          classId: classData._id,
          className: classData.name,
          code: classData.code,
          courseCode: classData.courseCode,
          courseName: classData.courseName,
          venue: classData.venue,
          labStartTime: classData.labStartTime,
          startTime: classData.labStartTime, // Alias
          labEndTime: classData.labEndTime,
          endTime: classData.labEndTime, // Alias
          mainFaculty: classData.mainFaculty?.facultyName || "TBA",
          semester: classData.semester?.name || null
        };
      })
      .sort((a, b) => a.labStartTime.localeCompare(b.labStartTime));

    if (classesOnDay.length > 0) {
      upcoming.push(...classesOnDay);
    }
  }

  return {
    upcoming,
    totalUpcoming: upcoming.length,
    startDate: today.toISOString().split('T')[0],
    endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };
};

/**
 * Get all student's enrolled classes (simple list)
 */
const getStudentAllClasses = async (studentId) => {
  const enrollments = await ClassStudent.find({
    studentId,
    leftAt: null
  })
    .populate({
      path: "classId",
      populate: [
        { path: "mainFaculty", select: "facultyName email" },
        { path: "coFaculties", select: "facultyName email" },
        { path: "semester", select: "name academicYear" }
      ]
    })
    .lean();

  // Filter out null classes
  const validEnrollments = enrollments.filter(e => e.classId);

  const classes = validEnrollments.map(enrollment => {
    const classData = enrollment.classId;
    return {
      classId: classData._id,
      className: classData.name,
      code: classData.code,
      courseCode: classData.courseCode,
      courseName: classData.courseName,
      venue: classData.venue,
      labDay: classData.labDay,
      labStartTime: classData.labStartTime,
      labEndTime: classData.labEndTime,
      mainFaculty: classData.mainFaculty?.facultyName || "TBA",
      coFaculties: classData.coFaculties?.map(cf => cf.facultyName) || [],
      semester: classData.semester?.name || null,
      batch: classData.batch,
      section: classData.section,
      group: classData.group,
      joinedAt: enrollment.joinedAt,
      autoEnrolled: enrollment.autoEnrolled
    };
  });

  return {
    classes,
    total: classes.length
  };
};

/**
 * Get dashboard aggregated statistics for student
 */
const getStudentDashboardStats = async (studentId) => {
  const Exam = require("../models/exam.model");
  const StudentExam = require("../models/studentExam.model");
  const AutoEvaluation = require("../models/autoEvaluation.model");
  const ManualEvaluation = require("../models/manualEvaluation.model");
  const FinalResult = require("../models/finalResult.model");

  // 1. Get student's enrolled classes
  const enrollments = await ClassStudent.find({ studentId, leftAt: null })
    .populate({
      path: "classId",
      select: "name courseCode courseName semester",
      populate: { path: "semester", select: "startDate" }
    })
    .lean();
  const classIds = enrollments.map(e => e.classId?._id).filter(id => id);
  const classMap = new Map();
  enrollments.forEach(e => {
    if (e.classId) classMap.set(e.classId._id.toString(), e.classId);
  });

  // 2. Fetch all exams for these classes
  const exams = await Exam.find({
    classId: { $in: classIds },
    state: { $in: ["published", "ongoing", "ended", "resultPublished", "completed"] }
  }).sort({ startTime: 1 }).lean();

  const examIds = exams.map(e => e._id);

  // 3. Fetch submissions and results
  const [studentExams, finalResults, autoEvals, manualEvals] = await Promise.all([
    StudentExam.find({ studentId, examId: { $in: examIds } }).lean(),
    FinalResult.find({ studentId, examId: { $in: examIds } }).lean(),
    AutoEvaluation.find({ studentId, examId: { $in: examIds } }).lean(),
    ManualEvaluation.find({ studentId, examId: { $in: examIds } }).lean()
  ]);

  const seMap = new Map(studentExams.map(se => [se.examId.toString(), se]));
  const frMap = new Map(finalResults.map(fr => [fr.examId.toString(), fr]));

  // 4. Aggregates and Progress logic
  let completedExamsCount = 0;
  let totalPercentage = 0;
  let scoredExamsCount = 0;
  let pendingExamsCount = 0;

  let totalPassedTestCases = 0;
  let totalPossibleTestCases = 0;
  let totalExecutionTimeMs = 0;
  let executionTimeCount = 0;
  
  let totalCompletionTimeMs = 0;
  let completionTimeCount = 0;
  
  let totalMarksObtainedSum = 0;
  let totalPossibleMarksSum = 0;

  const weeklyData = new Map(); // "YYYY-WW" -> { totalPct: 0, count: 0, startDate: Date }
  const subjectScores = new Map(); // courseName -> { totalPct: 0, count: 0 }

  exams.forEach((exam) => {
    const examIdStr = exam._id.toString();
    const studentExam = seMap.get(examIdStr);
    const finalResult = frMap.get(examIdStr);
    
    const examAutoEvals = autoEvals.filter(ae => ae.examId.toString() === examIdStr);
    const examManualEvals = manualEvals.filter(me => me.examId.toString() === examIdStr);

    // Aggregate Test Cases and Execution stats
    examAutoEvals.forEach(ae => {
      totalPassedTestCases += ae.passedTestCases || 0;
      totalPossibleTestCases += ae.totalTestCases || 0;
      
      if (ae.executionStats?.time) {
        // Parse "0.05s" or similar
        const timeVal = parseFloat(ae.executionStats.time);
        if (!isNaN(timeVal)) {
          totalExecutionTimeMs += timeVal * 1000;
          executionTimeCount++;
        }
      }
    });

    let scorePct = null;

    if (finalResult && finalResult.published) {
      scorePct = (finalResult.finalTotal / exam.totalMarks) * 100;
    } else if (studentExam && studentExam.isSubmitted) {
      let autoSum = 0;
      examAutoEvals.forEach(ae => autoSum += ae.marksObtained);
      
      let finalSum = autoSum;
      if (examManualEvals.length > 0) {
        let manualSum = 0;
        examManualEvals.forEach(me => manualSum += me.totalMarks);
        finalSum = manualSum;
      }
      
      scorePct = (finalSum / exam.totalMarks) * 100;
    }

    if (studentExam && studentExam.isSubmitted) {
      completedExamsCount++;
      if (studentExam.startedAt && studentExam.submittedAt) {
        const duration = new Date(studentExam.submittedAt) - new Date(studentExam.startedAt);
        if (duration > 0) {
          totalCompletionTimeMs += duration;
          completionTimeCount++;
        }
      }
    } else {
      const now = new Date();
      if (now >= exam.startTime && now <= exam.endTime && exam.state !== "resultPublished") {
        pendingExamsCount++;
      }
    }

    if (scorePct !== null) {
      scoredExamsCount++;
      totalPercentage += scorePct;
      
      const obtained = (scorePct / 100) * exam.totalMarks;
      totalMarksObtainedSum += obtained;
      totalPossibleMarksSum += exam.totalMarks;
      
      // Weekly Progress logic (Relative to Semester Start)
      const examDate = new Date(exam.startTime);
      const cls = classMap.get(exam.classId.toString());
      const semStartDate = cls?.semester?.startDate ? new Date(cls.semester.startDate) : null;
      
      let weekNo;
      let weekKey;

      if (semStartDate) {
          const diffMs = examDate - semStartDate;
          weekNo = Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
          weekKey = `SEM-W${weekNo.toString().padStart(2, '0')}`;
      } else {
          // Fallback to ISO week if semester info missing
          const d = new Date(Date.UTC(examDate.getFullYear(), examDate.getMonth(), examDate.getDate()));
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
          weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
          weekKey = `${examDate.getFullYear()}-W${weekNo}`;
      }

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, { totalPct: 0, count: 0, weekNo });
      }
      const weekInfo = weeklyData.get(weekKey);
      weekInfo.totalPct += scorePct;
      weekInfo.count += 1;

      // Subject Analysis
      let subject = cls?.courseName || cls?.name;
      if (!subject || subject === "N/A" || subject.trim() === "") {
        subject = exam.title;
      }
      
      if (!subjectScores.has(subject)) {
        subjectScores.set(subject, { totalPct: 0, count: 0 });
      }
      const subInfo = subjectScores.get(subject);
      subInfo.totalPct += scorePct;
      subInfo.count += 1;
    }
  });

  const averageScore = scoredExamsCount > 0 ? Number((totalPercentage / scoredExamsCount).toFixed(1)) : 0;
  const testCasePassRate = totalPossibleTestCases > 0 ? Number(((totalPassedTestCases / totalPossibleTestCases) * 100).toFixed(1)) : 0;
  const avgExecutionTime = executionTimeCount > 0 ? Number((totalExecutionTimeMs / executionTimeCount).toFixed(0)) : 0;
  const avgCompletionTime = completionTimeCount > 0 ? Number((totalCompletionTimeMs / (completionTimeCount * 60000)).toFixed(0)) : 0;

  // Format Performance Trend (Weekly)
  const performanceTrend = Array.from(weeklyData.entries())
    .map(([key, info]) => ({
      name: `Week ${info.weekNo}`,
      score: Math.round(info.totalPct / info.count),
      rawKey: key
    }))
    .sort((a, b) => a.rawKey.localeCompare(b.rawKey));

  // Format Skill Analysis (Radar Chart)
  const skillAnalysis = Array.from(subjectScores.entries()).map(([subject, info]) => ({
    subject: subject.length > 15 ? subject.substring(0, 12) + "..." : subject,
    A: Math.round(info.totalPct / info.count),
    fullMark: 100
  }));

  // 4. Get upcoming labs
  const labsData = await getUpcomingLabs(studentId);

  return {
    totalExams: exams.length,
    completedExams: completedExamsCount,
    averageScore,
    pendingLabs: labsData.totalUpcoming,
    pendingExams: pendingExamsCount,
    testCasePassRate,
    avgExecutionTime,
    avgCompletionTime,
    totalMarksObtained: Math.round(totalMarksObtainedSum * 10) / 10,
    totalPossibleMarks: totalPossibleMarksSum,
    performanceTrend,
    skillAnalysis: skillAnalysis.length >= 3 ? skillAnalysis : [
      ...skillAnalysis,
      ...Array(Math.max(0, 3 - skillAnalysis.length)).fill(0).map((_, i) => ({ 
        subject: `Class ${String.fromCharCode(65 + i + skillAnalysis.length)}`, 
        A: 0, 
        fullMark: 100 
      }))
    ]
  };
};

module.exports = {
  getStudentWeeklyTimetable,
  getStudentDailySchedule,
  getUpcomingLabs,
  getStudentAllClasses,
  getStudentDashboardStats
};