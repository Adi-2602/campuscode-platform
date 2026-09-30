const {
  getTeacherWeeklySchedule,
  getTeacherDailySchedule,
  getUpcomingClasses,
  getTeacherAllClasses,
  getTeacherLoadSummary
} = require("../services/teacherDashboard.service");

const {
  formatWeeklyTimetable,
  calculateWeeklyHours,
  getCurrentDayClasses,
  getNextClass
} = require("../utils/timetableFormatter.util");

/**
 * Get teacher's weekly schedule
 * GET /teacher/schedule/weekly
 */
const getWeeklyScheduleHandler = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const result = await getTeacherWeeklySchedule(teacherId);

    // Add formatted data
    const formatted = formatWeeklyTimetable(result.schedule);
    const weeklyHours = calculateWeeklyHours(result.schedule);
    const currentDay = getCurrentDayClasses(result.schedule);
    const nextClass = getNextClass(result.schedule);

    res.json({
      schedule: result.schedule,
      formatted,
      totalClasses: result.totalClasses,
      daysWithClasses: result.daysWithClasses,
      weeklyHours,
      currentDay,
      nextClass
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get teacher's daily schedule
 * GET /teacher/schedule/day/:day
 */
const getDailyScheduleHandler = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { day } = req.params;

    // Capitalize first letter
    const dayFormatted = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();

    const result = await getTeacherDailySchedule(teacherId, dayFormatted);

    res.json(result);

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get upcoming classes (next 7 days)
 * GET /teacher/classes/upcoming
 */
const getUpcomingClassesHandler = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const result = await getUpcomingClasses(teacherId);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get all assigned classes
 * GET /teacher/classes/all
 */
const getAllClassesHandler = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const result = await getTeacherAllClasses(teacherId);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get teacher's teaching load summary
 * GET /teacher/load/summary
 */
const getLoadSummaryHandler = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const result = await getTeacherLoadSummary(teacherId);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  getWeeklyScheduleHandler,
  getDailyScheduleHandler,
  getUpcomingClassesHandler,
  getAllClassesHandler,
  getLoadSummaryHandler
};