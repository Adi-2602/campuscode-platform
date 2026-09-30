/**
 * CSV Exporter Utility
 * Converts data to CSV format with proper escaping
 */

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
const escapeCSVField = (field) => {
  if (field === null || field === undefined) {
    return '';
  }
  
  const stringField = String(field);
  
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  
  return stringField;
};

/**
 * Convert array of objects to CSV
 */
const exportToCSV = (data, fields) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Generate header row
  const headers = fields.map(f => f.label || f.key);
  const headerRow = headers.map(escapeCSVField).join(',');

  // Generate data rows
  const dataRows = data.map(row => {
    return fields.map(field => {
      const value = field.getValue 
        ? field.getValue(row) 
        : row[field.key];
      return escapeCSVField(value);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Generate enrollment CSV
 */
const generateEnrollmentCSV = (enrollments) => {
  const fields = [
    { key: 'registrationNumber', label: 'Registration Number' },
    { key: 'studentName', label: 'Student Name' },
    { key: 'email', label: 'Email' },
    { key: 'batch', label: 'Batch' },
    { key: 'section', label: 'Section' },
    { key: 'group', label: 'Group' },
    { key: 'courseCode', label: 'Course Code' },
    { key: 'courseName', label: 'Course Name' },
    { key: 'className', label: 'Class Name' },
    { 
      key: 'enrolledAt', 
      label: 'Enrolled At',
      getValue: (row) => row.enrolledAt ? new Date(row.enrolledAt).toISOString() : ''
    }
  ];

  return exportToCSV(enrollments, fields);
};

/**
 * Generate teachers CSV
 */
const generateTeachersCSV = (teachers) => {
  const fields = [
    { key: 'facultyId', label: 'Faculty ID' },
    { key: 'facultyName', label: 'Faculty Name' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'designation', label: 'Designation' },
    { key: 'totalClasses', label: 'Total Classes' },
    { 
      key: 'weeklyHours', 
      label: 'Weekly Hours',
      getValue: (row) => `${row.weeklyHours || 0}h ${row.weeklyMinutes || 0}m`
    },
    { key: 'batches', label: 'Unique Batches' },
    { key: 'sections', label: 'Unique Sections' },
    { 
      key: 'isVerified', 
      label: 'Verified',
      getValue: (row) => row.isVerified ? 'Yes' : 'No'
    }
  ];

  return exportToCSV(teachers, fields);
};

/**
 * Generate students CSV
 */
const generateStudentsCSV = (students) => {
  const fields = [
    { key: 'registrationNumber', label: 'Registration Number' },
    { key: 'studentName', label: 'Student Name' },
    { key: 'email', label: 'Email' },
    { key: 'semester', label: 'Semester' },
    { key: 'batch', label: 'Batch' },
    { key: 'section', label: 'Section' },
    { key: 'group', label: 'Group' },
    { key: 'department', label: 'Department' },
    { 
      key: 'totalClasses', 
      label: 'Enrolled Classes',
      getValue: (row) => row.classes?.length || 0
    }
  ];

  return exportToCSV(students, fields);
};

/**
 * Generate lab utilization CSV
 */
const generateLabUtilizationCSV = (slots) => {
  const fields = [
    { key: 'slotCode', label: 'Slot Code' },
    { key: 'day', label: 'Day' },
    { key: 'startTime', label: 'Start Time' },
    { key: 'endTime', label: 'End Time' },
    { key: 'batch', label: 'Batch' },
    { key: 'hourOrder', label: 'Hour Order' },
    { key: 'classesUsing', label: 'Classes Using' },
    { 
      key: 'isUsed', 
      label: 'Status',
      getValue: (row) => row.isUsed ? 'Used' : 'Unused'
    }
  ];

  return exportToCSV(slots, fields);
};

/**
 * Generate class schedule CSV
 */
const generateClassScheduleCSV = (classes) => {
  const fields = [
    { key: 'code', label: 'Class Code' },
    { key: 'courseName', label: 'Course Name' },
    { key: 'courseCode', label: 'Course Code' },
    { key: 'batch', label: 'Batch' },
    { key: 'section', label: 'Section' },
    { key: 'group', label: 'Group' },
    { key: 'labDay', label: 'Lab Day' },
    { key: 'labStartTime', label: 'Start Time' },
    { key: 'labEndTime', label: 'End Time' },
    { key: 'labDuration', label: 'Duration (min)' },
    { key: 'venue', label: 'Venue' },
    { 
      key: 'mainFaculty', 
      label: 'Main Faculty',
      getValue: (row) => row.mainFaculty?.facultyName || 'TBA'
    },
    { key: 'studentCount', label: 'Student Count' }
  ];

  return exportToCSV(classes, fields);
};

/**
 * Set CSV headers for HTTP response
 */
const setCSVHeaders = (res, filename) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  // Add BOM for Excel UTF-8 support
  res.write('\ufeff');
};

module.exports = {
  exportToCSV,
  generateEnrollmentCSV,
  generateTeachersCSV,
  generateStudentsCSV,
  generateLabUtilizationCSV,
  generateClassScheduleCSV,
  escapeCSVField,
  setCSVHeaders
};