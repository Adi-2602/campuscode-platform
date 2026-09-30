const {
  orchestrateUpload,
  getUploadStatus,
  getAllUploads,
  getUploadStatistics,
  sendEmailsForUpload,
  clearSemesterData
} = require("../services/dataUpload.service");

/**
 * Upload semester data (students + teachers + faculty emails)
 * POST /admin/upload/semester-data
 */
const uploadSemesterDataHandler = async (req, res) => {
  console.log("[OCR] Entering uploadSemesterDataHandler...");
  try {
    const { semesterId } = req.body;
    console.log("[OCR] Semester ID:", semesterId);
    console.log("[OCR] Files present:", req.files ? Object.keys(req.files) : "None");

    if (!semesterId) {
      return res.status(400).json({
        error: "Semester ID is required"
      });
    }

    // Check if files are uploaded
    if (!req.files || !req.files.students || !req.files.teachers || !req.files.facultyEmails) {
      return res.status(400).json({
        error: "All three files are required: students (Fake.json), teachers (FilteredTeachers.json), facultyEmails (FacultyEmailMapping.json)"
      });
    }

    const files = {
      students: req.files.students[0].buffer,
      studentsName: req.files.students[0].originalname,
      teachers: req.files.teachers[0].buffer,
      teachersName: req.files.teachers[0].originalname,
      facultyEmails: req.files.facultyEmails[0].buffer,
      facultyEmailsName: req.files.facultyEmails[0].originalname
    };

    // Start upload processing
    const result = await orchestrateUpload(files, semesterId, req.user.id);

    res.status(201).json({
      message: "Semester data uploaded and processed successfully",
      result
    });

  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get upload status
 * GET /admin/uploads/:uploadId/status
 */
const getUploadStatusHandler = async (req, res) => {
  try {
    const { uploadId } = req.params;

    const upload = await getUploadStatus(uploadId);

    res.json({
      upload
    });

  } catch (error) {
    res.status(404).json({
      error: error.message
    });
  }
};

/**
 * Get all uploads
 * GET /admin/uploads
 */
const getAllUploadsHandler = async (req, res) => {
  try {
    const { semesterId, status, page, limit, sort } = req.query;

    const result = await getAllUploads(
      { semesterId, status },
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
 * Get upload report
 * GET /admin/uploads/:uploadId/report
 */
const getUploadReportHandler = async (req, res) => {
  try {
    const { uploadId } = req.params;

    const upload = await getUploadStatus(uploadId);

    // Format report
    const report = {
      uploadId: upload._id,
      semester: upload.semester,
      uploadedBy: upload.uploadedBy,
      uploadedAt: upload.uploadedAt,
      status: upload.status,
      processingTime: upload.processingTime,

      summary: {
        studentsCreated: upload.stats.studentsCreated,
        studentsUpdated: upload.stats.studentsUpdated,
        teachersCreated: upload.stats.teachersCreated,
        teachersUpdated: upload.stats.teachersUpdated,
        classesCreated: upload.stats.classesCreated,
        enrollmentsCreated: upload.stats.enrollmentsCreated,
        emailsSent: upload.stats.emailsSent,
        emailsFailed: upload.stats.emailsFailed
      },

      warnings: upload.warnings,
      errors: upload.errors,

      files: upload.files
    };

    res.json({
      report
    });

  } catch (error) {
    res.status(404).json({
      error: error.message
    });
  }
};

/**
 * Get upload statistics
 * GET /admin/uploads/stats
 */
const getUploadStatisticsHandler = async (req, res) => {
  try {
    const stats = await getUploadStatistics();

    res.json({
      stats
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Send credential emails for an upload
 * POST /admin/upload/:uploadId/send-emails
 */
const sendEmailsHandler = async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { email, password } = req.body;

    const customCredentials = (email && password) ? { email, password } : null;

    const result = await sendEmailsForUpload(uploadId, customCredentials);

    res.json({
      message: "Emails dispatched successfully",
      result
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

const clearSemesterDataHandler = async (req, res) => {
  try {
    const { semesterId } = req.body;

    if (!semesterId) {
      return res.status(400).json({
        error: "Semester ID is required"
      });
    }

    const result = await clearSemesterData(semesterId);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  uploadSemesterDataHandler,
  getUploadStatusHandler,
  getAllUploadsHandler,
  getUploadReportHandler,
  getUploadStatisticsHandler,
  sendEmailsHandler,
  clearSemesterDataHandler
};