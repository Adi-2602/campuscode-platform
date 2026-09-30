const { getRedisClient } = require('../config/redis');
const Exam = require('../models/exam.model');
const StudentExam = require('../models/studentExam.model');
const logger = require('../config/logger.config');

/**
 * Generate Redis key for code draft
 * Format: campuscode:draft:{studentId}:{examId}:{questionId}
 */
const getDraftKey = (studentId, examId, questionId) => {
  const prefix = process.env.REDIS_KEY_PREFIX || 'campuscode:draft';
  return `${prefix}:${studentId}:${examId}:${questionId}`;
};

/**
 * Calculate TTL (Time To Live) for draft
 * TTL = (exam end time - now) + buffer
 */
const calculateTTL = (examEndTime) => {
  const now = new Date();
  const endTime = new Date(examEndTime);
  const bufferHours = parseInt(process.env.DRAFT_TTL_BUFFER_HOURS) || 1;
  
  // Calculate seconds until exam ends
  const secondsUntilEnd = Math.floor((endTime - now) / 1000);
  
  // Add buffer (convert hours to seconds)
  const bufferSeconds = bufferHours * 3600;
  
  // Total TTL
  const ttl = secondsUntilEnd + bufferSeconds;
  
  // Minimum TTL: 1 hour (in case exam already ended)
  return Math.max(ttl, 3600);
};

/**
 * Validate code size
 */
const validateCodeSize = (code) => {
  const maxSizeBytes = parseInt(process.env.MAX_CODE_SIZE_BYTES) || 204800; // 200KB
  const codeSize = Buffer.byteLength(code, 'utf8');
  
  if (codeSize > maxSizeBytes) {
    throw new Error(`Code size (${codeSize} bytes) exceeds limit (${maxSizeBytes} bytes)`);
  }
  
  return true;
};

/**
 * Save code draft to Redis
 */
const saveDraft = async ({
  studentId,
  examId,
  questionId,
  code,
  languageId
}) => {
  try {
    // 1. Validate code size
    validateCodeSize(code);

    // 2. Get exam details for TTL calculation
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new Error('Exam not found');
    }

    // 3. Check if student has started the exam
    const studentExam = await StudentExam.findOne({
      studentId,
      examId
    });

    if (!studentExam) {
      throw new Error('Exam not started by student');
    }

    // 4. Check if exam is already submitted
    if (studentExam.isSubmitted) {
      throw new Error('Exam already submitted. Auto-save disabled.');
    }

    // 5. Verify question is assigned to student
    const isAssigned = studentExam.assignedQuestions.some(
      qId => qId.toString() === questionId
    );

    if (!isAssigned) {
      throw new Error('Question not assigned to student');
    }

    // 6. Prepare draft data
    const draftData = {
      code,
      languageId: parseInt(languageId),
      updatedAt: new Date().toISOString()
    };

    // 7. Calculate TTL
    const ttl = calculateTTL(exam.endTime);

    // 8. Save to Redis
    const redis = getRedisClient();
    const key = getDraftKey(studentId, examId, questionId);
    
    await redis.set(
      key,
      JSON.stringify(draftData),
      'EX', // Set expiration
      ttl
    );

    logger.info('Draft saved successfully', {
      studentId,
      examId,
      questionId,
      codeSize: Buffer.byteLength(code, 'utf8'),
      ttl
    });

    return {
      success: true,
      message: 'Draft saved successfully',
      ttl,
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString()
    };

  } catch (error) {
    logger.error('Error saving draft:', {
      studentId,
      examId,
      questionId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Recover code draft from Redis
 */
const recoverDraft = async ({
  studentId,
  examId,
  questionId
}) => {
  try {
    // 1. Get draft from Redis
    const redis = getRedisClient();
    const key = getDraftKey(studentId, examId, questionId);
    
    const draftJson = await redis.get(key);

    // 2. If no draft found
    if (!draftJson) {
      logger.info('No draft found', {
        studentId,
        examId,
        questionId
      });
      
      return {
        success: true,
        draft: null,
        message: 'No draft found'
      };
    }

    // 3. Parse draft data
    const draft = JSON.parse(draftJson);

    // 4. Get remaining TTL
    const ttl = await redis.ttl(key);

    logger.info('Draft recovered successfully', {
      studentId,
      examId,
      questionId,
      remainingTTL: ttl
    });

    return {
      success: true,
      draft: {
        code: draft.code,
        languageId: draft.languageId,
        updatedAt: draft.updatedAt,
        expiresIn: ttl > 0 ? ttl : 0
      },
      message: 'Draft recovered successfully'
    };

  } catch (error) {
    logger.error('Error recovering draft:', {
      studentId,
      examId,
      questionId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Delete draft from Redis
 * Called when student submits the question
 */
const deleteDraft = async ({
  studentId,
  examId,
  questionId
}) => {
  try {
    const redis = getRedisClient();
    const key = getDraftKey(studentId, examId, questionId);
    
    const deleted = await redis.del(key);

    if (deleted === 1) {
      logger.info('Draft deleted successfully', {
        studentId,
        examId,
        questionId
      });
      
      return {
        success: true,
        message: 'Draft deleted successfully'
      };
    } else {
      return {
        success: true,
        message: 'No draft to delete'
      };
    }

  } catch (error) {
    logger.error('Error deleting draft:', {
      studentId,
      examId,
      questionId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Delete all drafts for a student's exam
 * Called when student submits entire exam
 */
const deleteAllExamDrafts = async ({
  studentId,
  examId
}) => {
  try {
    const redis = getRedisClient();
    const prefix = process.env.REDIS_KEY_PREFIX || 'campuscode:draft';
    const pattern = `${prefix}:${studentId}:${examId}:*`;
    
    // Find all keys matching pattern
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      return {
        success: true,
        message: 'No drafts to delete',
        deletedCount: 0
      };
    }

    // Delete all keys
    const deleted = await redis.del(...keys);

    logger.info('All exam drafts deleted', {
      studentId,
      examId,
      deletedCount: deleted
    });

    return {
      success: true,
      message: `Deleted ${deleted} draft(s)`,
      deletedCount: deleted
    };

  } catch (error) {
    logger.error('Error deleting exam drafts:', {
      studentId,
      examId,
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  saveDraft,
  recoverDraft,
  deleteDraft,
  deleteAllExamDrafts
};