const {
  createClass,
  getClassesByTeacher,
  getClassById,
  updateClass,
  toggleClassLock,
  deleteClass,
  getStudentsInClass
} = require("../services/class.service");

/**
 * Create a new class
 * POST /teacher/classes
 */
const createClassHandler = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Class name is required"
      });
    }

    const newClass = await createClass({
      name,
      description,
      teacherId: req.user.id
    });

    res.status(201).json({
      message: "Class created successfully",
      class: newClass
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get all classes created by teacher
 * GET /teacher/classes
 */
const getMyClassesHandler = async (req, res) => {
  try {
    const classes = await getClassesByTeacher(req.user.id);

    res.json({
      classes
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get single class by ID
 * GET /teacher/classes/:classId
 */
const getClassByIdHandler = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await getClassById(classId, req.user.id);

    if (!classData) {
      return res.status(404).json({
        error: "Class not found or unauthorized"
      });
    }

    res.json({
      class: classData
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Update class details
 * PATCH /teacher/classes/:classId
 */
const updateClassHandler = async (req, res) => {
  try {
    const { classId } = req.params;
    const { name, description } = req.body;

    const updatedClass = await updateClass({
      classId,
      name,
      description,
      teacherId: req.user.id
    });

    if (!updatedClass) {
      return res.status(404).json({
        error: "Class not found or unauthorized"
      });
    }

    res.json({
      message: "Class updated successfully",
      class: updatedClass
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Lock or unlock a class
 * PATCH /teacher/classes/:classId/lock
 */
const toggleClassLockHandler = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await toggleClassLock(classId, req.user.id);

    if (!classData) {
      return res.status(404).json({
        error: "Class not found or unauthorized"
      });
    }

    res.json({
      message: `Class ${classData.isLocked ? "locked" : "unlocked"} successfully`,
      class: classData
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Delete a class
 * DELETE /teacher/classes/:classId
 */
const deleteClassHandler = async (req, res) => {
  try {
    const { classId } = req.params;

    const result = await deleteClass(classId, req.user.id);

    if (!result) {
      return res.status(404).json({
        error: "Class not found or unauthorized"
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get all students in a class
 * GET /teacher/classes/:classId/students
 */
const getStudentsInClassHandler = async (req, res) => {
  try {
    const { classId } = req.params;

    const students = await getStudentsInClass(classId, req.user.id);

    if (students === null) {
      return res.status(404).json({
        error: "Class not found or unauthorized"
      });
    }

    res.json({
      students
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  createClassHandler,
  getMyClassesHandler,
  getClassByIdHandler,
  updateClassHandler,
  toggleClassLockHandler,
  deleteClassHandler,
  getStudentsInClassHandler
};