const {
  saveDraft,
  recoverDraft,
  deleteDraft
} = require('../services/codeDraft.service');

/**
 * Auto-save code draft
 * POST /student/exams/:examId/questions/:questionId/autosave
 */
const autosaveHandler = async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    const { code, languageId } = req.body;
    const studentId = req.user.id; // From JWT middleware

    // Validate required fields
    if (!code || !languageId) {
      console.log('Autosave validation failed: missing code or languageId', { hasCode: !!code, languageId });
      return res.status(400).json({
        error: 'code and languageId are required'
      });
    }

    if (!examId || !questionId) {
      console.log('Autosave validation failed: missing examId or questionId', { examId, questionId });
      return res.status(400).json({
        error: 'examId and questionId are required'
      });
    }

    // Validate languageId is a number
    if (isNaN(parseInt(languageId))) {
      console.log('Autosave validation failed: invalid languageId', { languageId });
      return res.status(400).json({
        error: 'languageId must be a valid number'
      });
    }

    // Call service to save draft
    const result = await saveDraft({
      studentId,
      examId,
      questionId,
      code,
      languageId: parseInt(languageId)
    });

    res.status(200).json({
      success: true,
      message: result.message,
      ttl: result.ttl,
      expiresAt: result.expiresAt
    });

  } catch (error) {
    // Handle specific errors
    if (error.message.includes('Exam not found')) {
      return res.status(404).json({
        error: 'Exam not found'
      });
    }

    if (error.message.includes('Exam not started by student')) {
      console.log('Autosave failed: Exam not started by student', { studentId, examId });
      return res.status(400).json({
        error: 'You must start the exam before auto-saving'
      });
    }

    if (error.message.includes('Exam already submitted')) {
      console.log('Autosave failed: Exam already submitted', { studentId, examId });
      return res.status(400).json({
        error: 'Exam already submitted. Auto-save is disabled.'
      });
    }

    if (error.message.includes('Question not assigned to student')) {
      return res.status(403).json({
        error: 'This question is not assigned to you'
      });
    }

    if (error.message.includes('Code size')) {
      return res.status(400).json({
        error: error.message
      });
    }

    // Generic error
    console.error(`Unhandled autosave error [message: "${error.message}", length: ${error.message?.length}]:`, error);
    res.status(500).json({
      error: 'Failed to save draft',
      message: error.message
    });
  }
};

/**
 * Recover code draft
 * GET /student/exams/:examId/questions/:questionId/recover
 */
const recoverHandler = async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    const studentId = req.user.id; // From JWT middleware

    // Validate required params
    if (!examId || !questionId) {
      return res.status(400).json({
        error: 'examId and questionId are required'
      });
    }

    // Call service to recover draft
    const result = await recoverDraft({
      studentId,
      examId,
      questionId
    });

    // If no draft found, return null
    if (!result.draft) {
      return res.status(200).json({
        success: true,
        draft: null,
        message: 'No draft found'
      });
    }

    // Return draft
    res.status(200).json({
      success: true,
      draft: result.draft,
      message: result.message
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to recover draft',
      message: error.message
    });
  }
};

/**
 * Delete code draft (manual deletion)
 * DELETE /student/exams/:examId/questions/:questionId/draft
 */
const deleteDraftHandler = async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    const studentId = req.user.id; // From JWT middleware

    // Validate required params
    if (!examId || !questionId) {
      return res.status(400).json({
        error: 'examId and questionId are required'
      });
    }

    // Call service to delete draft
    const result = await deleteDraft({
      studentId,
      examId,
      questionId
    });

    res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete draft',
      message: error.message
    });
  }
};

module.exports = {
  autosaveHandler,
  recoverHandler,
  deleteDraftHandler
};