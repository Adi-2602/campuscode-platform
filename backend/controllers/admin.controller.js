const {
  verifyTeacher
} = require("../services/admin.service");

/**
 * Verify a teacher account (Super Admin)
 */
const verifyTeacherAccount = async (req, res) => {
  try {
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({
        error: "teacherId is required"
      });
    }

    // superAdminId will come from JWT later (req.user)
    const superAdminId = req.user?.id;

    const result = await verifyTeacher({
      teacherId,
      superAdminId
    });

    res.json({
      message: "Teacher verified successfully",
      teacher: result
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Bulk import students
 * POST /admin/students/bulk-import
 */
const bulkImportStudentsHandler = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: "Invalid payload. 'data' (array) is required." });
    }

    const result = await require("../services/admin.service").bulkImportStudents(data, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  verifyTeacherAccount,
  bulkImportStudentsHandler
};
