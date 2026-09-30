const {
  createSemester,
  getAllSemesters,
  getSemesterById,
  updateSemester,
  deleteSemester,
  setActiveSemester,
  getActiveSemester,
  getSemesterStats
} = require("../services/semester.service");

/**
 * Create a new semester
 * POST /admin/semesters
 */
const createSemesterHandler = async (req, res) => {
  try {
    const { name, academicYear, startDate, endDate, isActive } = req.body;

    if (!name || !academicYear || !startDate || !endDate) {
      return res.status(400).json({
        error: "Missing required fields: name, academicYear, startDate, endDate"
      });
    }

    const semester = await createSemester({
      name,
      academicYear,
      startDate,
      endDate,
      isActive,
      adminId: req.user.id
    });

    res.status(201).json({
      message: "Semester created successfully",
      semester
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get all semesters with optional filters
 * GET /admin/semesters
 */
const getAllSemestersHandler = async (req, res) => {
  try {
    const { isActive, academicYear, page, limit, sort } = req.query;

    const result = await getAllSemesters(
      { isActive, academicYear },
      { page, limit, sort }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get semester by ID
 * GET /admin/semesters/:semesterId
 */
const getSemesterByIdHandler = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const semester = await getSemesterById(semesterId);

    res.json({
      semester
    });
  } catch (error) {
    res.status(404).json({
      error: error.message
    });
  }
};

/**
 * Update semester
 * PUT /admin/semesters/:semesterId
 */
const updateSemesterHandler = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { name, academicYear, startDate, endDate, isActive } = req.body;

    const semester = await updateSemester(semesterId, {
      name,
      academicYear,
      startDate,
      endDate,
      isActive
    });

    res.json({
      message: "Semester updated successfully",
      semester
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Delete semester
 * DELETE /admin/semesters/:semesterId
 */
const deleteSemesterHandler = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const result = await deleteSemester(semesterId);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Set semester as active
 * PATCH /admin/semesters/:semesterId/activate
 */
const setActiveSemesterHandler = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const semester = await setActiveSemester(semesterId);

    res.json({
      message: "Semester activated successfully",
      semester
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get currently active semester
 * GET /admin/semesters/active
 */
const getActiveSemesterHandler = async (req, res) => {
  try {
    const semester = await getActiveSemester();

    if (!semester) {
      return res.status(404).json({
        error: "No active semester found"
      });
    }

    res.json({
      semester
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get semester statistics
 * GET /admin/semesters/stats
 */
const getSemesterStatsHandler = async (req, res) => {
  try {
    const stats = await getSemesterStats();

    res.json({
      stats
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  createSemesterHandler,
  getAllSemestersHandler,
  getSemesterByIdHandler,
  updateSemesterHandler,
  deleteSemesterHandler,
  setActiveSemesterHandler,
  getActiveSemesterHandler,
  getSemesterStatsHandler
};