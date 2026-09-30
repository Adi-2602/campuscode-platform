const Semester = require("../models/semester.model");

/**
 * Create a new semester
 */
const createSemester = async (data) => {
  const { name, academicYear, startDate, endDate, isActive, adminId } = data;

  // Check if semester with same name and academic year already exists
  const existingSemester = await Semester.findOne({
    name,
    academicYear
  });

  if (existingSemester) {
    throw new Error(`Semester "${name}" for academic year "${academicYear}" already exists`);
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) {
    throw new Error("Start date must be before end date");
  }

  // No longer deactivating others - multiple semesters can be active simultaneously

  const semester = await Semester.create({
    name,
    academicYear,
    startDate: start,
    endDate: end,
    isActive: isActive !== undefined ? isActive : false,
    createdBy: adminId
  });

  return semester;
};

/**
 * Get all semesters with optional filters and pagination
 */
const getAllSemesters = async (filters = {}, options = {}) => {
  const { isActive, academicYear } = filters;
  const { page = 1, limit = 20, sort = "-createdAt" } = options;

  const query = {};

  if (isActive !== undefined) {
    query.isActive = isActive === "true" || isActive === true;
  }

  if (academicYear) {
    query.academicYear = academicYear;
  }

  const skip = (page - 1) * limit;

  const [semesters, total] = await Promise.all([
    Semester.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email role")
      .lean(),
    Semester.countDocuments(query)
  ]);

  return {
    semesters,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get semester by ID
 */
const getSemesterById = async (semesterId) => {
  const semester = await Semester.findById(semesterId)
    .populate("createdBy", "name email role")
    .lean();

  if (!semester) {
    throw new Error("Semester not found");
  }

  return semester;
};

/**
 * Update semester
 */
const updateSemester = async (semesterId, data) => {
  const { name, academicYear, startDate, endDate, isActive } = data;

  const semester = await Semester.findById(semesterId);

  if (!semester) {
    throw new Error("Semester not found");
  }

  // If changing name or academic year, check for duplicates
  if ((name && name !== semester.name) || (academicYear && academicYear !== semester.academicYear)) {
    const checkName = name || semester.name;
    const checkYear = academicYear || semester.academicYear;

    const existingSemester = await Semester.findOne({
      _id: { $ne: semesterId },
      name: checkName,
      academicYear: checkYear
    });

    if (existingSemester) {
      throw new Error(`Semester "${checkName}" for academic year "${checkYear}" already exists`);
    }
  }

  // Validate dates if provided
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : semester.startDate;
    const end = endDate ? new Date(endDate) : semester.endDate;

    if (start >= end) {
      throw new Error("Start date must be before end date");
    }

    semester.startDate = start;
    semester.endDate = end;
  }

  // Update fields
  if (name) semester.name = name;
  if (academicYear) semester.academicYear = academicYear;

  // Handle isActive separately - removing auto-deactivation
  if (isActive !== undefined) {
    semester.isActive = isActive === true || isActive === "true";
  }

  await semester.save();

  return semester;
};

/**
 * Delete semester
 */
const deleteSemester = async (semesterId) => {
  const semester = await Semester.findById(semesterId);

  if (!semester) {
    throw new Error("Semester not found");
  }

  // Check if semester has any associated data (classes, uploads, etc.)
  // TODO: Add checks for related data when those models are implemented
  // For now, just delete

  await Semester.findByIdAndDelete(semesterId);

  return {
    message: "Semester deleted successfully",
    semesterId
  };
};

/**
 * Set a semester as active (deactivates all others)
 */
const setActiveSemester = async (semesterId) => {
  const semester = await Semester.findById(semesterId);

  if (!semester) {
    throw new Error("Semester not found");
  }

  // Activate this semester without deactivating others
  semester.isActive = true;
  await semester.save();

  return semester;
};

/**
 * Get the currently active semester
 */
const getActiveSemester = async () => {
  const semester = await Semester.findOne({ isActive: true })
    .populate("createdBy", "name email role")
    .lean();

  return semester; // Can be null if no active semester
};

/**
 * Get semester statistics
 */
const getSemesterStats = async () => {
  const [total, activeSems, byYear] = await Promise.all([
    Semester.countDocuments(),
    Semester.find({ isActive: true }).lean(),
    Semester.aggregate([
      {
        $group: {
          _id: "$academicYear",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ])
  ]);

  return {
    total,
    activeList: activeSems,
    activeCount: activeSems.length,
    byAcademicYear: byYear
  };
};

module.exports = {
  createSemester,
  getAllSemesters,
  getSemesterById,
  updateSemester,
  deleteSemester,
  setActiveSemester,
  getActiveSemester,
  getSemesterStats
};