const {
  getStudentWeeklyTimetable,
  getStudentDailySchedule,
  getUpcomingLabs,
  getStudentAllClasses
} = require("../services/studentDashboard.service");

const {
  formatWeeklyTimetable,
  calculateWeeklyHours,
  getCurrentDayClasses,
  getNextClass
} = require("../utils/timetableFormatter.util");

/**
 * Get student's weekly timetable
 * GET /student/timetable/weekly
 */
const getWeeklyTimetableHandler = async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await getStudentWeeklyTimetable(studentId);

    // Add formatted data
    const formatted = formatWeeklyTimetable(result.timetable);
    const weeklyHours = calculateWeeklyHours(result.timetable);
    const currentDay = getCurrentDayClasses(result.timetable);
    const nextClass = getNextClass(result.timetable);

    res.json({
      timetable: result.timetable,
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
 * Get student's daily schedule
 * GET /student/timetable/day/:day
 */
const getDailyScheduleHandler = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { day } = req.params;

    // Capitalize first letter
    const dayFormatted = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();

    const result = await getStudentDailySchedule(studentId, dayFormatted);

    res.json(result);

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get upcoming labs (next 7 days)
 * GET /student/labs/upcoming
 */
const getUpcomingLabsHandler = async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await getUpcomingLabs(studentId);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get all enrolled classes
 * GET /student/classes
 */
const getAllClassesHandler = async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await getStudentAllClasses(studentId);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
/**
 * Get dashboard stats
 * GET /student/dashboard/stats
 */
const getDashboardStatsHandler = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { getStudentDashboardStats } = require("../services/studentDashboard.service");
    const result = await getStudentDashboardStats(studentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getWeeklyTimetableHandler,
  getDailyScheduleHandler,
  getUpcomingLabsHandler,
  getAllClassesHandler,
  getDashboardStatsHandler
};