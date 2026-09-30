/**
 * PHASE 7: TEACHER VERIFICATION ENHANCEMENTS
 * 
 * Add these handlers to your existing controllers/admin.controller.js
 * Or create admin.controller.js if it doesn't exist
 */

const {
  getUnverifiedTeachers,
  bulkVerifyTeachers,
  resendTeacherCredentials,
  rejectTeacherAccount,
  updateTeacherEmail,
  getTeacherVerificationStats
} = require("../services/admin.service");

/**
 * Get unverified teachers
 * GET /admin/teachers/unverified
 */
const getUnverifiedTeachersHandler = async (req, res) => {
  try {
    const { isPlaceholder, needsEmailUpdate, page, limit, sort } = req.query;

    const filters = {};
    if (isPlaceholder !== undefined) {
      filters.isPlaceholder = isPlaceholder === "true";
    }
    if (needsEmailUpdate !== undefined) {
      filters.needsEmailUpdate = needsEmailUpdate === "true";
    }

    const result = await getUnverifiedTeachers(filters, { page, limit, sort });

    res.json(result);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Bulk verify teachers
 * POST /admin/teachers/verify-bulk
 */
const bulkVerifyTeachersHandler = async (req, res) => {
  try {
    const { teacherIds } = req.body;

    if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
      return res.status(400).json({
        error: "teacherIds array is required and must not be empty"
      });
    }

    const result = await bulkVerifyTeachers(teacherIds, req.user.id);

    res.json(result);

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Resend teacher credentials
 * POST /admin/teachers/:teacherId/resend-credentials
 */
const resendTeacherCredentialsHandler = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const result = await resendTeacherCredentials(teacherId, req.user.id);

    res.json(result);

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Reject teacher account
 * POST /admin/teachers/:teacherId/reject
 */
const rejectTeacherHandler = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { reason } = req.body;

    const result = await rejectTeacherAccount(teacherId, reason, req.user.id);

    res.json(result);

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Update teacher email
 * PUT /admin/teachers/:teacherId/email
 */
const updateTeacherEmailHandler = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required"
      });
    }

    const result = await updateTeacherEmail(teacherId, email, req.user.id);

    res.json(result);

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get teacher verification statistics
 * GET /admin/teachers/verification-stats
 */
const getTeacherVerificationStatsHandler = async (req, res) => {
  try {
    const stats = await getTeacherVerificationStats();

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
  getUnverifiedTeachersHandler,
  bulkVerifyTeachersHandler,
  resendTeacherCredentialsHandler,
  rejectTeacherHandler,
  updateTeacherEmailHandler,
  getTeacherVerificationStatsHandler
};