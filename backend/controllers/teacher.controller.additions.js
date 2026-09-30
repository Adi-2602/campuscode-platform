/**
 * PHASE 9: EXAM LAB SCHEDULE INTEGRATION
 * 
 * Add these handlers to your existing controllers/teacher.controller.js
 */

const {
  getClassSchedule,
  suggestExamSlots,
  validateExamTiming,
  getLabScheduleForExam
} = require("../services/teacher.service");

/**
 * Get class schedule
 * GET /teacher/classes/:classId/schedule
 */
const getClassScheduleHandler = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;

    const schedule = await getClassSchedule(classId, teacherId);

    res.json(schedule);

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get suggested exam slots
 * GET /teacher/classes/:classId/exam-slots/suggestions
 */
const getSuggestedExamSlotsHandler = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;

    const suggestions = await suggestExamSlots(classId, teacherId);

    res.json(suggestions);

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Validate exam timing
 * POST /teacher/classes/:classId/exam-slots/validate
 */
const validateExamTimingHandler = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startTime, endTime } = req.body;
    const teacherId = req.user.id;

    if (!startTime || !endTime) {
      return res.status(400).json({
        error: "Start time and end time are required"
      });
    }

    const validation = await validateExamTiming(classId, startTime, endTime, teacherId);

    res.json(validation);

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get lab schedule for exam creation
 * GET /teacher/classes/:classId/exam-prefill
 */
const getLabScheduleForExamHandler = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;

    const data = await getLabScheduleForExam(classId, teacherId);

    res.json(data);

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * MODIFIED: Create exam handler with auto-fill from lab schedule
 * This should REPLACE or ENHANCE your existing createExamHandler
 * 
 * Example integration:
 */
const createExamWithScheduleHandler = async (req, res) => {
  try {
    const { classId, title, description, startTime, endTime, duration, venue, autofill } = req.body;
    const teacherId = req.user.id;

    let examData = {
      classId,
      title,
      description,
      startTime,
      endTime,
      duration,
      venue
    };

    // If autofill is requested, get lab schedule data
    if (autofill) {
      const labSchedule = await getLabScheduleForExam(classId, teacherId);
      
      // Auto-fill missing fields from lab schedule
      if (!startTime) examData.startTime = labSchedule.prefillData.startTime;
      if (!endTime) examData.endTime = labSchedule.prefillData.endTime;
      if (!duration) examData.duration = labSchedule.prefillData.duration;
      if (!venue) examData.venue = labSchedule.prefillData.venue;
    }

    // Call your existing createExam service function here
    // const exam = await createExam(examData, teacherId);

    res.status(201).json({
      message: "Exam created successfully",
      // exam,
      autofilledFrom: autofill ? "lab_schedule" : null
    });

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

module.exports = {
  getClassScheduleHandler,
  getSuggestedExamSlotsHandler,
  validateExamTimingHandler,
  getLabScheduleForExamHandler,
  createExamWithScheduleHandler
};