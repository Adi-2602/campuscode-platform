/**
 * PHASE 9: EXAM LAB SCHEDULE INTEGRATION
 * 
 * Add these functions to your existing services/teacher.service.js
 */

const Class = require("../models/class.model");

/**
 * Get class schedule details
 * Returns lab schedule info for a specific class
 */
const getClassSchedule = async (classId, teacherId) => {
  const classData = await Class.findById(classId)
    .populate("semester", "name academicYear startDate endDate")
    .populate("mainFaculty", "facultyName email")
    .populate("coFaculties", "facultyName email")
    .populate("labSlots", "slotCode day startTime endTime hourOrder")
    .lean();

  if (!classData) {
    throw new Error("Class not found");
  }

  // Check if teacher has access to this class
  const isMainFaculty = classData.mainFaculty?._id?.toString() === teacherId.toString();
  const isCoFaculty = classData.coFaculties?.some(cf => cf._id?.toString() === teacherId.toString());

  if (!isMainFaculty && !isCoFaculty) {
    throw new Error("You do not have access to this class");
  }

  return {
    classId: classData._id,
    className: classData.name,
    code: classData.code,
    courseCode: classData.courseCode,
    courseName: classData.courseName,
    batch: classData.batch,
    section: classData.section,
    group: classData.group,
    venue: classData.venue,
    
    // Lab schedule details
    labSchedule: {
      day: classData.labDay,
      startTime: classData.labStartTime,
      endTime: classData.labEndTime,
      duration: classData.labDuration,
      slots: classData.labSlots?.map(slot => ({
        slotCode: slot.slotCode,
        startTime: slot.startTime,
        endTime: slot.endTime,
        hourOrder: slot.hourOrder
      })) || []
    },
    
    semester: classData.semester,
    mainFaculty: classData.mainFaculty,
    coFaculties: classData.coFaculties,
    isMainFaculty,
    isCoFaculty
  };
};

/**
 * Suggest exam slots based on lab schedule
 * Returns suggested time slots for conducting exam
 */
const suggestExamSlots = async (classId, teacherId) => {
  const classSchedule = await getClassSchedule(classId, teacherId);

  const suggestions = [];

  // Suggestion 1: Same as lab time (most common)
  suggestions.push({
    type: "same_as_lab",
    description: "Same day and time as regular lab session",
    day: classSchedule.labSchedule.day,
    startTime: classSchedule.labSchedule.startTime,
    endTime: classSchedule.labSchedule.endTime,
    duration: classSchedule.labSchedule.duration,
    venue: classSchedule.venue,
    recommended: true
  });

  // Suggestion 2: Same day, earlier time (if lab is in afternoon)
  if (classSchedule.labSchedule.startTime && classSchedule.labSchedule.startTime >= "12:00") {
    const earlierStartTime = "09:00";
    const duration = classSchedule.labSchedule.duration || 120;
    const endHour = 9 + Math.floor(duration / 60);
    const endMin = duration % 60;
    const earlierEndTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    suggestions.push({
      type: "earlier_same_day",
      description: "Earlier on the same day",
      day: classSchedule.labSchedule.day,
      startTime: earlierStartTime,
      endTime: earlierEndTime,
      duration: duration,
      venue: classSchedule.venue,
      recommended: false
    });
  }

  // Suggestion 3: Extended duration (for longer exams)
  const extendedDuration = (classSchedule.labSchedule.duration || 120) + 60; // Add 1 hour
  const [hours, mins] = classSchedule.labSchedule.startTime.split(":").map(Number);
  const endHour = hours + Math.floor(extendedDuration / 60);
  const endMin = (mins + (extendedDuration % 60)) % 60;
  const extendedEndTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

  suggestions.push({
    type: "extended_duration",
    description: "Extended duration for comprehensive exam",
    day: classSchedule.labSchedule.day,
    startTime: classSchedule.labSchedule.startTime,
    endTime: extendedEndTime,
    duration: extendedDuration,
    venue: classSchedule.venue,
    recommended: false
  });

  return {
    classId: classSchedule.classId,
    className: classSchedule.className,
    currentLabSchedule: classSchedule.labSchedule,
    suggestions,
    note: "These are suggested times based on your regular lab schedule. You can customize as needed."
  };
};

/**
 * Validate exam timing against lab schedule
 * Checks if proposed exam time is reasonable
 */
const validateExamTiming = async (classId, startTime, endTime, teacherId) => {
  const classSchedule = await getClassSchedule(classId, teacherId);

  const validation = {
    valid: true,
    warnings: [],
    errors: []
  };

  // Parse times
  const [examStartHour, examStartMin] = startTime.split(":").map(Number);
  const [examEndHour, examEndMin] = endTime.split(":").map(Number);
  const [labStartHour, labStartMin] = (classSchedule.labSchedule.startTime || "00:00").split(":").map(Number);
  const [labEndHour, labEndMin] = (classSchedule.labSchedule.endTime || "23:59").split(":").map(Number);

  const examStartMinutes = examStartHour * 60 + examStartMin;
  const examEndMinutes = examEndHour * 60 + examEndMin;
  const labStartMinutes = labStartHour * 60 + labStartMin;
  const labEndMinutes = labEndHour * 60 + labEndMin;

  // Check if exam duration is reasonable
  const examDuration = examEndMinutes - examStartMinutes;
  if (examDuration < 30) {
    validation.errors.push("Exam duration is too short (minimum 30 minutes)");
    validation.valid = false;
  }
  if (examDuration > 240) {
    validation.warnings.push("Exam duration is longer than 4 hours");
  }

  // Check if start time is before end time
  if (examStartMinutes >= examEndMinutes) {
    validation.errors.push("Exam start time must be before end time");
    validation.valid = false;
  }

  // Warning if exam time doesn't match lab time
  if (examStartMinutes !== labStartMinutes || examEndMinutes !== labEndMinutes) {
    validation.warnings.push(
      `Exam timing differs from regular lab schedule (${classSchedule.labSchedule.startTime} - ${classSchedule.labSchedule.endTime})`
    );
  }

  // Check if exam is during reasonable hours (7 AM - 7 PM)
  if (examStartHour < 7) {
    validation.warnings.push("Exam starts before 7 AM");
  }
  if (examEndHour > 19) {
    validation.warnings.push("Exam ends after 7 PM");
  }

  return {
    ...validation,
    examDuration,
    labDuration: classSchedule.labSchedule.duration,
    classSchedule: {
      day: classSchedule.labSchedule.day,
      startTime: classSchedule.labSchedule.startTime,
      endTime: classSchedule.labSchedule.endTime,
      venue: classSchedule.venue
    }
  };
};

/**
 * Get lab schedule for exam creation form
 * Returns pre-filled data for exam creation
 */
const getLabScheduleForExam = async (classId, teacherId) => {
  const classSchedule = await getClassSchedule(classId, teacherId);

  return {
    classId: classSchedule.classId,
    className: classSchedule.className,
    courseCode: classSchedule.courseCode,
    courseName: classSchedule.courseName,
    
    // Pre-fill data for exam form
    prefillData: {
      venue: classSchedule.venue,
      startTime: classSchedule.labSchedule.startTime,
      endTime: classSchedule.labSchedule.endTime,
      duration: classSchedule.labSchedule.duration,
      suggestedDay: classSchedule.labSchedule.day
    },
    
    labSchedule: classSchedule.labSchedule,
    semester: classSchedule.semester
  };
};

module.exports = {
  getClassSchedule,
  suggestExamSlots,
  validateExamTiming,
  getLabScheduleForExam
};