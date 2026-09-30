const {
  joinClass,
  getJoinedClasses,
  leaveClass
} = require("../services/classStudent.service");

/**
 * Student joins a class via code
 * POST /student/classes/join
 */
const joinClassHandler = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        error: "Class code is required"
      });
    }

    const result = await joinClass({
      code: code.toUpperCase().trim(),
      studentId: req.user.id
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get all classes student has joined
 * GET /student/classes
 */
const getJoinedClassesHandler = async (req, res) => {
  try {
    const classes = await getJoinedClasses(req.user.id);

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
 * Student leaves a class
 * DELETE /student/classes/:classId/leave
 */
const leaveClassHandler = async (req, res) => {
  try {
    const { classId } = req.params;

    const result = await leaveClass({
      classId,
      studentId: req.user.id
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

module.exports = {
  joinClassHandler,
  getJoinedClassesHandler,
  leaveClassHandler
};