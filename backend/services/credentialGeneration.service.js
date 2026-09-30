const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const { generateSimplePassword } = require("../utils/passwordGenerator.util");

/**
 * Generate credentials for a student
 */
const generateStudentCredentials = async (studentData, uploadId) => {
  const {
    registrationNumber,
    studentName,
    email,
    semester,
    batch,
    section,
    group,
    department,
    facultyAdvisor
  } = studentData;

  // Generate username and password
  const username = registrationNumber; // Use registration number as username
  const password = generateSimplePassword();
  const passwordHash = await bcrypt.hash(password, 10);

  // Check if student already exists
  const existingStudent = await User.findOne({ registrationNumber });

  if (existingStudent) {
    // Update existing student
    existingStudent.studentName = studentName;
    existingStudent.email = email || existingStudent.email;
    existingStudent.semester = semester;
    existingStudent.batch = batch;
    existingStudent.section = section;
    existingStudent.group = group;
    existingStudent.department = department || existingStudent.department;

    await existingStudent.save();

    return {
      user: existingStudent,
      password: null, // Don't regenerate password for existing users
      isNew: false
    };
  }

  // Create new student
  const student = await User.create({
    role: "student",
    name: studentName,
    email: email || `${registrationNumber}@student.srmist.edu.in`,
    registrationNumber,
    studentName,
    rollNo: registrationNumber, // For backward compatibility
    semester,
    batch,
    section,
    group,
    department,
    passwordHash,
    mustChangePassword: true,
    isVerified: true, // Auto-verify students
    createdBy: uploadId,
    createdByModel: "Upload"
  });

  return {
    user: student,
    password,
    username,
    isNew: true
  };
};

/**
 * Generate credentials for a teacher
 */
const generateTeacherCredentials = async (facultyData, uploadId) => {
  const {
    facultyId,
    facultyName,
    email,
    mobile,
    designation,
    isPlaceholder,
    needsEmailUpdate
  } = facultyData;

  // Generate username and password
  const username = email;
  const password = generateSimplePassword();
  const passwordHash = await bcrypt.hash(password, 10);

  // Check if teacher already exists (by facultyId or email)
  let existingTeacher = null;

  if (facultyId) {
    existingTeacher = await User.findOne({ facultyId });
  }

  if (!existingTeacher && email) {
    existingTeacher = await User.findOne({ email });
  }

  if (existingTeacher) {
    // Update existing teacher
    existingTeacher.facultyName = facultyName;
    existingTeacher.facultyId = facultyId || existingTeacher.facultyId;
    existingTeacher.mobile = mobile || existingTeacher.mobile;
    existingTeacher.designation = designation || existingTeacher.designation;

    await existingTeacher.save();

    return {
      user: existingTeacher,
      password: null, // Don't regenerate password for existing users
      isNew: false
    };
  }

  // Create new teacher
  const teacher = await User.create({
    role: "teacher",
    name: facultyName,
    email,
    facultyId,
    facultyName,
    mobile,
    designation,
    passwordHash,
    mustChangePassword: true,
    isVerified: false, // Teachers need admin verification
    isPlaceholder: isPlaceholder || false,
    needsEmailUpdate: needsEmailUpdate || false,
    createdBy: uploadId,
    createdByModel: "Upload"
  });

  return {
    user: teacher,
    password,
    username,
    isNew: true
  };
};

/**
 * Batch create student credentials (Optimized)
 */
const batchCreateStudentCredentials = async (studentsData, uploadId) => {
  const results = {
    created: [],
    updated: [],
    errors: []
  };

  if (!studentsData || studentsData.length === 0) return results;

  try {
    console.log(`[OCR] Optimizing student credentials for ${studentsData.length} students...`);

    // 1. Fetch all existing students in one query
    const regNumbers = studentsData.map(s => s.registrationNumber).filter(Boolean);
    const existingUsers = await User.find({ registrationNumber: { $in: regNumbers } });
    const userMap = new Map(existingUsers.map(u => [u.registrationNumber, u]));

    // 2. Prepare passwords and hashes in parallel
    // We use a small delay or chunking if the list is massive (e.g., > 500)
    // but for standard uploads, Promise.all is fine.
    const hashPromises = studentsData.map(async (studentData) => {
      try {
        const existing = userMap.get(studentData.registrationNumber);
        if (existing) return { studentData, password: null, hash: null, exists: true };

        const password = generateSimplePassword();
        const hash = await bcrypt.hash(password, 10);
        return { studentData, password, hash, exists: false };
      } catch (e) {
        console.error(`[OCR-ERROR] Hashing failed for student ${studentData.registrationNumber}:`, e);
        return { studentData, password: null, hash: null, exists: false, error: e.message };
      }
    });

    const processedData = (await Promise.all(hashPromises)).filter(p => !p.error);

    // 3. Prepare Bulk Operations
    const bulkOps = [];

    for (const item of processedData) {
      const { studentData, password, hash, exists } = item;
      const { registrationNumber, studentName, email, semester, batch, section, group, department } = studentData;

      if (exists) {
        // Update op
        bulkOps.push({
          updateOne: {
            filter: { registrationNumber },
            update: {
              $set: {
                studentName,
                email: email || undefined,
                semester,
                batch,
                section,
                group,
                department: department || undefined,

                // Update new fields
                program: studentData.program || undefined,
                branch: studentData.branch || undefined,
                specialization: studentData.specialization || undefined,
                facultyAdvisor: studentData.facultyAdvisor || undefined,
                facultyAdvisorMobile: studentData.facultyAdvisorMobile || undefined,
                mobile: studentData.mobile || undefined,
                gender: studentData.gender || undefined,
                campus: studentData.campus || undefined,
                dob: studentData.dob || undefined,
                bloodGroup: studentData.bloodGroup || undefined,
                address: studentData.address || undefined,
                parentName: studentData.parentName || undefined,
                parentMobile: studentData.parentMobile || undefined,
                parentEmail: studentData.parentEmail || undefined,
                rawData: studentData.rawData || undefined
              }
            }
          }
        });
      } else {
        // Create op
        bulkOps.push({
          insertOne: {
            document: {
              role: "student",
              name: studentName,
              email: email || `${registrationNumber}@student.srmist.edu.in`,
              registrationNumber,
              studentName,
              rollNo: registrationNumber,
              semester,
              batch,
              section,
              group,
              department,

              // Insert new fields
              program: studentData.program,
              branch: studentData.branch,
              specialization: studentData.specialization,
              facultyAdvisor: studentData.facultyAdvisor,
              facultyAdvisorMobile: studentData.facultyAdvisorMobile,
              mobile: studentData.mobile,
              gender: studentData.gender,
              campus: studentData.campus,
              dob: studentData.dob,
              bloodGroup: studentData.bloodGroup,
              address: studentData.address,
              parentName: studentData.parentName,
              parentMobile: studentData.parentMobile,
              parentEmail: studentData.parentEmail,
              rawData: studentData.rawData,

              passwordHash: hash,
              mustChangePassword: true,
              isVerified: true,
              createdBy: uploadId,
              createdByModel: "Upload"
            }
          }
        });
      }
    }

    // 4. Execute Bulk Write
    const bulkResult = await User.bulkWrite(bulkOps, { ordered: false });
    console.log(`[OCR] Bulk write completed: ${bulkResult.insertedCount} created, ${bulkResult.modifiedCount} updated.`);

    // 5. Gather results for the response (we need IDs, but bulkWrite doesn't return all docs)
    // For "created" we need the passwords to show the admin.
    // We'll re-fetch or use the processedData.
    // Actually, we can fetch all again to get IDs.
    const allUsers = await User.find({ registrationNumber: { $in: regNumbers } }).select('_id registrationNumber').lean();
    const idMap = new Map(allUsers.map(u => [u.registrationNumber, u._id]));

    for (const item of processedData) {
      const { studentData, password, exists } = item;
      const userId = idMap.get(studentData.registrationNumber);

      if (exists) {
        results.updated.push({
          userId,
          registrationNumber: studentData.registrationNumber
        });
      } else {
        results.created.push({
          userId,
          username: studentData.registrationNumber,
          password: password,
          email: studentData.email || `${studentData.registrationNumber}@student.srmist.edu.in`,
          studentName: studentData.studentName,
          registrationNumber: studentData.registrationNumber
        });
      }
    }

  } catch (error) {
    console.error(`[OCR] Error in batchCreateStudentCredentials:`, error);
    results.errors.push({ error: error.message });
  }

  return results;
};

/**
 * Batch create teacher credentials (Optimized)
 */
const batchCreateTeacherCredentials = async (facultyList, uploadId) => {
  const results = {
    created: [],
    updated: [],
    errors: []
  };

  if (!facultyList || facultyList.length === 0) return results;

  try {
    console.log(`[OCR] Optimizing teacher credentials for ${facultyList.length} faculty...`);

    const emails = facultyList.map(f => f.email ? f.email.toLowerCase() : null).filter(Boolean);
    const facultyIds = facultyList.map(f => f.facultyId).filter(Boolean);

    // 1. Fetch existing by email or facultyId
    // MongoDB regex for case-insensitive match or just rely on stored lowercase emails
    // Since we enforce lowercase in model, we can just search for lowercase emails
    const existingUsers = await User.find({
      $or: [
        { email: { $in: emails } }, // Emails in DB are lowercase
        { facultyId: { $in: facultyIds } }
      ]
    });

    const emailMap = new Map(existingUsers.map(u => [u.email.toLowerCase(), u]));
    const idMap = new Map(existingUsers.filter(u => u.facultyId).map(u => [u.facultyId, u]));

    // 2. Parallel Hashing
    const hashPromises = facultyList.map(async (facultyData) => {
      try {
        const emailKey = facultyData.email ? facultyData.email.toLowerCase() : null;
        const existing = (emailKey ? emailMap.get(emailKey) : null) || idMap.get(facultyData.facultyId);
        if (existing) return { facultyData, password: null, hash: null, exists: true };

        const password = generateSimplePassword();
        const hash = await bcrypt.hash(password, 10);
        return { facultyData, password, hash, exists: false };
      } catch (e) {
        console.error(`[OCR-ERROR] Hashing failed for faculty ${facultyData.facultyName}:`, e);
        return { facultyData, password: null, hash: null, exists: false, error: e.message };
      }
    });

    const processedData = (await Promise.all(hashPromises)).filter(p => !p.error);

    // 3. Bulk Operations
    const bulkOps = processedData
      .map((item) => {
        const { facultyData, hash, exists } = item;
        const { facultyId, facultyName, email, mobile, designation, isPlaceholder, needsEmailUpdate } = facultyData;

        if (exists) {
          // If facultyId exists, match by it. Otherwise, match by email.
          const filterQuery = facultyId ? { facultyId } : { email };
          
          return {
            updateOne: {
              filter: filterQuery,
              update: {
                $set: {
                  facultyName,
                  mobile: mobile || undefined,
                  designation: designation || undefined
                }
              }
            }
          };
        } else {
          return {
            insertOne: {
              document: {
                role: "teacher",
                name: facultyName,
                email,
                facultyId,
                facultyName,
                mobile,
                designation,
                passwordHash: hash,
                mustChangePassword: true,
                isVerified: false,
                isPlaceholder: isPlaceholder || false,
                needsEmailUpdate: needsEmailUpdate || false,
                createdBy: uploadId,
                createdByModel: "Upload"
              }
            }
          };
        }
      });

    if (bulkOps.length > 0) {
      try {
        await User.bulkWrite(bulkOps, { ordered: false });
      } catch (err) {
        // Ignore duplicate key errors to let the remaining inserts proceed
        if (err.code === 11000) {
          console.warn('[OCR] Duplicate user insertion ignored in teacher batch');
        } else {
          throw err; // rethrow other errors
        }
      }
    }

    // 4. Gather results
    const allUsers = await User.find({
      $or: [
        { email: { $in: emails } },
        { facultyId: { $in: facultyIds } }
      ]
    }).select('_id email facultyId').lean();

    const finalUserMap = new Map();
    allUsers.forEach(u => {
      if (u.email) finalUserMap.set(u.email.toLowerCase(), u._id);
      if (u.facultyId) finalUserMap.set(u.facultyId, u._id);
    });

    for (const item of processedData) {
      const { facultyData, password, exists } = item;
      const emailKey = facultyData.email ? facultyData.email.toLowerCase() : null;
      const userId = (emailKey ? finalUserMap.get(emailKey) : null) || finalUserMap.get(facultyData.facultyId);

      if (exists) {
        results.updated.push({
          userId,
          facultyName: facultyData.facultyName
        });
      } else {
        results.created.push({
          userId,
          username: facultyData.email,
          password,
          email: facultyData.email,
          facultyName: facultyData.facultyName,
          facultyId: facultyData.facultyId,
          isPlaceholder: facultyData.isPlaceholder
        });
      }
    }

  } catch (error) {
    console.error(`[OCR] Error in batchCreateTeacherCredentials:`, error);
    results.errors.push({ error: error.message });
  }

  return results;
};

module.exports = {
  generateStudentCredentials,
  generateTeacherCredentials,
  batchCreateStudentCredentials,
  batchCreateTeacherCredentials
};