const ClassScheduleTemplate = require("../models/classScheduleTemplate.model");
const SlotTimetable = require("../models/slotTimetable.model");
const Semester = require("../models/semester.model");

/**
 * Calculate lab schedule from lab slots
 * Determines: day, start time, end time, duration
 */
const calculateLabScheduleFromSlots = async (labSlotIds) => {
  if (!labSlotIds || labSlotIds.length === 0) {
    return {
      labDay: null,
      labStartTime: null,
      labEndTime: null,
      labDuration: null
    };
  }

  // Fetch all slots from SlotTimetable
  const slots = await SlotTimetable.find({ _id: { $in: labSlotIds } }).sort("hourOrder");

  if (slots.length === 0) {
    throw new Error("No valid lab slots found");
  }

  // Validate all slots are on the same day
  const days = [...new Set(slots.map(s => s.day))];
  if (days.length > 1) {
    throw new Error(`All lab slots must be on the same day. Found: ${days.join(", ")}`);
  }

  // Get start time from first slot
  const labStartTime = slots[0].startTime;

  // Get end time from last slot
  const labEndTime = slots[slots.length - 1].endTime;

  // Calculate duration in minutes
  const [startHour, startMin] = labStartTime.split(":").map(Number);
  const [endHour, endMin] = labEndTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const labDuration = endMinutes - startMinutes;

  return {
    labDay: days[0],
    labStartTime,
    labEndTime,
    labDuration
  };
};

/**
 * Create a class schedule template
 */
const createClassScheduleTemplate = async (data) => {
  const {
    semesterId,
    batch,
    section,
    group,
    courseCode,
    courseName,
    venue,
    labSlots,
    adminId
  } = data;

  // Validate semester exists
  const semester = await Semester.findById(semesterId);
  if (!semester) {
    throw new Error("Semester not found");
  }

  // Check if template already exists for this combination
  const existingTemplate = await ClassScheduleTemplate.findOne({
    semester: semesterId,
    batch,
    section: section.toUpperCase(),
    group,
    courseCode: courseCode.toUpperCase()
  });

  if (existingTemplate) {
    throw new Error(
      `Template already exists for Batch ${batch}, Section ${section}, Group ${group}, Course ${courseCode}`
    );
  }

  // Validate lab slots exist in SlotTimetable
  if (labSlots && labSlots.length > 0) {
    const slotsCount = await SlotTimetable.countDocuments({ _id: { $in: labSlots } });
    if (slotsCount !== labSlots.length) {
      throw new Error("Some lab slots are invalid");
    }
  }

  // Calculate lab schedule from slots
  const labSchedule = await calculateLabScheduleFromSlots(labSlots);

  const template = await ClassScheduleTemplate.create({
    semester: semesterId,
    batch,
    section: section.toUpperCase(),
    group,
    courseCode: courseCode.toUpperCase(),
    courseName,
    venue,
    labSlots: labSlots || [],
    ...labSchedule,
    createdBy: adminId
  });

  // Populate references
  await template.populate([
    { path: "semester", select: "name academicYear" },
    { path: "labSlots", select: "slotCode day startTime endTime hourOrder batch" },
    { path: "createdBy", select: "name email role" }
  ]);

  return template;
};

/**
 * Get all class schedule templates with filters
 */
const getAllClassScheduleTemplates = async (filters = {}, options = {}) => {
  const { semesterId, batch, section, group, courseCode } = filters;
  const { page = 1, limit = 50, sort = "batch section group" } = options;

  const query = {};

  if (semesterId) {
    query.semester = semesterId;
  }

  if (batch) {
    query.batch = parseInt(batch);
  }

  if (section) {
    query.section = section.toUpperCase();
  }

  if (group) {
    query.group = parseInt(group);
  }

  if (courseCode) {
    query.courseCode = new RegExp(courseCode, "i");
  }

  const skip = (page - 1) * limit;

  const [templates, total] = await Promise.all([
    ClassScheduleTemplate.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("semester", "name academicYear")
      .populate("labSlots", "slotCode day startTime endTime batch")
      .populate("createdBy", "name email role")
      .lean(),
    ClassScheduleTemplate.countDocuments(query)
  ]);

  return {
    templates,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get class schedule template by ID
 */
const getClassScheduleTemplateById = async (templateId) => {
  const template = await ClassScheduleTemplate.findById(templateId)
    .populate("semester", "name academicYear startDate endDate")
    .populate("labSlots", "slotCode day startTime endTime batch hourOrder")
    .populate("createdBy", "name email role")
    .lean();

  if (!template) {
    throw new Error("Class schedule template not found");
  }

  return template;
};

/**
 * Update class schedule template
 */
const updateClassScheduleTemplate = async (templateId, data) => {
  const {
    batch,
    section,
    group,
    courseCode,
    courseName,
    venue,
    labSlots
  } = data;

  const template = await ClassScheduleTemplate.findById(templateId);

  if (!template) {
    throw new Error("Class schedule template not found");
  }

  // If changing key fields, check for duplicates
  if (
    (batch && batch !== template.batch) ||
    (section && section.toUpperCase() !== template.section) ||
    (group && group !== template.group) ||
    (courseCode && courseCode.toUpperCase() !== template.courseCode)
  ) {
    const checkBatch = batch || template.batch;
    const checkSection = section ? section.toUpperCase() : template.section;
    const checkGroup = group || template.group;
    const checkCourseCode = courseCode ? courseCode.toUpperCase() : template.courseCode;

    const existingTemplate = await ClassScheduleTemplate.findOne({
      _id: { $ne: templateId },
      semester: template.semester,
      batch: checkBatch,
      section: checkSection,
      group: checkGroup,
      courseCode: checkCourseCode
    });

    if (existingTemplate) {
      throw new Error(
        `Template already exists for Batch ${checkBatch}, Section ${checkSection}, Group ${checkGroup}, Course ${checkCourseCode}`
      );
    }
  }

  // Update fields
  if (batch !== undefined) template.batch = batch;
  if (section) template.section = section.toUpperCase();
  if (group !== undefined) template.group = group;
  if (courseCode) template.courseCode = courseCode.toUpperCase();
  if (courseName) template.courseName = courseName;
  if (venue !== undefined) template.venue = venue;

  // If lab slots are updated, recalculate schedule
  if (labSlots !== undefined) {
    // Validate lab slots exist
    if (labSlots.length > 0) {
      const slotsCount = await SlotTimetable.countDocuments({ _id: { $in: labSlots } });
      if (slotsCount !== labSlots.length) {
        throw new Error("Some lab slots are invalid");
      }
    }

    template.labSlots = labSlots;

    // Recalculate lab schedule
    const labSchedule = await calculateLabScheduleFromSlots(labSlots);
    template.labDay = labSchedule.labDay;
    template.labStartTime = labSchedule.labStartTime;
    template.labEndTime = labSchedule.labEndTime;
    template.labDuration = labSchedule.labDuration;
  }

  await template.save();

  // Populate references
  await template.populate([
    { path: "semester", select: "name academicYear" },
    { path: "labSlots", select: "slotCode day startTime endTime" },
    { path: "createdBy", select: "name email role" }
  ]);

  return template;
};

/**
 * Delete class schedule template
 */
const deleteClassScheduleTemplate = async (templateId) => {
  const template = await ClassScheduleTemplate.findById(templateId);

  if (!template) {
    throw new Error("Class schedule template not found");
  }

  // TODO: Check if template has been used to create classes
  // For now, just delete

  await ClassScheduleTemplate.findByIdAndDelete(templateId);

  return {
    message: "Class schedule template deleted successfully",
    templateId
  };
};

/**
 * Get templates by semester
 */
const getTemplatesBySemester = async (semesterId) => {
  const templates = await ClassScheduleTemplate.find({ semester: semesterId })
    .sort("batch section group")
    .populate("labSlots", "slotCode day startTime endTime")
    .lean();

  return templates;
};

/**
 * Get templates by batch and section
 */
const getTemplatesByBatchSection = async (semesterId, batch, section) => {
  const templates = await ClassScheduleTemplate.find({
    semester: semesterId,
    batch,
    section: section.toUpperCase()
  })
    .sort("group")
    .populate("labSlots", "slotCode day startTime endTime")
    .lean();

  return templates;
};

/**
 * Duplicate template (for creating similar templates)
 */
const duplicateTemplate = async (templateId, newData) => {
  const originalTemplate = await ClassScheduleTemplate.findById(templateId);

  if (!originalTemplate) {
    throw new Error("Template not found");
  }

  // Create new template with modified fields
  const template = await createClassScheduleTemplate({
    semesterId: newData.semesterId || originalTemplate.semester,
    batch: newData.batch || originalTemplate.batch,
    section: newData.section || originalTemplate.section,
    group: newData.group || originalTemplate.group,
    courseCode: newData.courseCode || originalTemplate.courseCode,
    courseName: newData.courseName || originalTemplate.courseName,
    venue: newData.venue || originalTemplate.venue,
    labSlots: newData.labSlots || originalTemplate.labSlots,
    adminId: newData.adminId
  });

  return template;
};

/**
 * Get template statistics
 */
const getTemplateStats = async () => {
  const [total, bySemester, byBatch, byCourse] = await Promise.all([
    ClassScheduleTemplate.countDocuments(),
    ClassScheduleTemplate.aggregate([
      {
        $lookup: {
          from: "semesters",
          localField: "semester",
          foreignField: "_id",
          as: "semesterInfo"
        }
      },
      {
        $unwind: "$semesterInfo"
      },
      {
        $group: {
          _id: "$semester",
          name: { $first: "$semesterInfo.name" },
          academicYear: { $first: "$semesterInfo.academicYear" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { academicYear: -1 }
      }
    ]),
    ClassScheduleTemplate.aggregate([
      {
        $group: {
          _id: "$batch",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]),
    ClassScheduleTemplate.aggregate([
      {
        $group: {
          _id: "$courseCode",
          courseName: { $first: "$courseName" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ])
  ]);

  return {
    total,
    bySemester,
    byBatch,
    topCourses: byCourse
  };
};

/**
 * Validate template data before upload processing
 * Checks if templates exist for all batch-section-group-course combinations
 */
const validateTemplatesForUpload = async (semesterId, combinations) => {
  const missingTemplates = [];

  for (const combo of combinations) {
    const template = await ClassScheduleTemplate.findOne({
      semester: semesterId,
      batch: combo.batch,
      section: combo.section.toUpperCase(),
      group: combo.group,
      courseCode: combo.courseCode.toUpperCase()
    });

    if (!template) {
      missingTemplates.push({
        batch: combo.batch,
        section: combo.section,
        group: combo.group,
        courseCode: combo.courseCode
      });
    }
  }

  return {
    valid: missingTemplates.length === 0,
    missingTemplates
  };
};

module.exports = {
  createClassScheduleTemplate,
  getAllClassScheduleTemplates,
  getClassScheduleTemplateById,
  updateClassScheduleTemplate,
  deleteClassScheduleTemplate,
  getTemplatesBySemester,
  getTemplatesByBatchSection,
  duplicateTemplate,
  getTemplateStats,
  validateTemplatesForUpload,
  calculateLabScheduleFromSlots
};