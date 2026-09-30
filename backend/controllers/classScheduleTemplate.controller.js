const {
  createClassScheduleTemplate,
  getAllClassScheduleTemplates,
  getClassScheduleTemplateById,
  updateClassScheduleTemplate,
  deleteClassScheduleTemplate,
  getTemplatesBySemester,
  getTemplatesByBatchSection,
  duplicateTemplate,
  getTemplateStats
} = require("../services/classScheduleTemplate.service");

/**
 * Create a class schedule template
 * POST /admin/class-schedules
 */
const createClassScheduleTemplateHandler = async (req, res) => {
  try {
    const {
      semesterId,
      batch,
      section,
      group,
      courseCode,
      courseName,
      venue,
      labSlots
    } = req.body;

    if (!semesterId || !batch || !section || !group || !courseCode || !courseName) {
      return res.status(400).json({
        error: "Missing required fields: semesterId, batch, section, group, courseCode, courseName"
      });
    }

    const template = await createClassScheduleTemplate({
      semesterId,
      batch,
      section,
      group,
      courseCode,
      courseName,
      venue,
      labSlots: labSlots || [],
      adminId: req.user.id
    });

    res.status(201).json({
      message: "Class schedule template created successfully",
      template
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get all class schedule templates with optional filters
 * GET /admin/class-schedules
 */
const getAllClassScheduleTemplatesHandler = async (req, res) => {
  try {
    const { semesterId, batch, section, group, courseCode, page, limit, sort } = req.query;

    const result = await getAllClassScheduleTemplates(
      { semesterId, batch, section, group, courseCode },
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
 * Get class schedule template by ID
 * GET /admin/class-schedules/:templateId
 */
const getClassScheduleTemplateByIdHandler = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await getClassScheduleTemplateById(templateId);

    res.json({
      template
    });
  } catch (error) {
    res.status(404).json({
      error: error.message
    });
  }
};

/**
 * Update class schedule template
 * PUT /admin/class-schedules/:templateId
 */
const updateClassScheduleTemplateHandler = async (req, res) => {
  try {
    const { templateId } = req.params;
    const {
      batch,
      section,
      group,
      courseCode,
      courseName,
      venue,
      labSlots
    } = req.body;

    const template = await updateClassScheduleTemplate(templateId, {
      batch,
      section,
      group,
      courseCode,
      courseName,
      venue,
      labSlots
    });

    res.json({
      message: "Class schedule template updated successfully",
      template
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Delete class schedule template
 * DELETE /admin/class-schedules/:templateId
 */
const deleteClassScheduleTemplateHandler = async (req, res) => {
  try {
    const { templateId } = req.params;

    const result = await deleteClassScheduleTemplate(templateId);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get templates by semester
 * GET /admin/class-schedules/semester/:semesterId
 */
const getTemplatesBySemesterHandler = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const templates = await getTemplatesBySemester(semesterId);

    res.json({
      semester: semesterId,
      templates,
      total: templates.length
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get templates by batch and section
 * GET /admin/class-schedules/semester/:semesterId/batch/:batch/section/:section
 */
const getTemplatesByBatchSectionHandler = async (req, res) => {
  try {
    const { semesterId, batch, section } = req.params;

    if (!batch || (batch !== "1" && batch !== "2")) {
      return res.status(400).json({
        error: "Batch must be 1 or 2"
      });
    }

    const templates = await getTemplatesByBatchSection(
      semesterId,
      parseInt(batch),
      section
    );

    res.json({
      semester: semesterId,
      batch: parseInt(batch),
      section: section.toUpperCase(),
      templates,
      total: templates.length
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Duplicate template
 * POST /admin/class-schedules/:templateId/duplicate
 */
const duplicateTemplateHandler = async (req, res) => {
  try {
    const { templateId } = req.params;
    const {
      semesterId,
      batch,
      section,
      group,
      courseCode,
      courseName,
      venue,
      labSlots
    } = req.body;

    const template = await duplicateTemplate(templateId, {
      semesterId,
      batch,
      section,
      group,
      courseCode,
      courseName,
      venue,
      labSlots,
      adminId: req.user.id
    });

    res.status(201).json({
      message: "Template duplicated successfully",
      template
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get template statistics
 * GET /admin/class-schedules/stats
 */
const getTemplateStatsHandler = async (req, res) => {
  try {
    const stats = await getTemplateStats();

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
 * Bulk import class schedules
 * POST /admin/class-schedules/bulk-import
 */
const bulkImportTemplatesHandler = async (req, res) => {
  try {
    const { semesterId, data } = req.body;

    if (!semesterId || !data || !Array.isArray(data)) {
      return res.status(400).json({ error: "Invalid payload. 'semesterId' and 'data' (array) are required." });
    }

    const result = await require("../services/classScheduleTemplate.service").bulkImportClassSchedules(semesterId, data, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createClassScheduleTemplateHandler,
  getAllClassScheduleTemplatesHandler,
  getClassScheduleTemplateByIdHandler,
  updateClassScheduleTemplateHandler,
  deleteClassScheduleTemplateHandler,
  getTemplatesBySemesterHandler,
  getTemplatesByBatchSectionHandler,
  duplicateTemplateHandler,
  getTemplateStatsHandler,
  bulkImportTemplatesHandler
};