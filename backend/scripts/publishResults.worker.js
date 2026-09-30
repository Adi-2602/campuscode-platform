const mongoose = require("mongoose");
const Exam = require("../models/exam.model");
const { publishExamResults } = require("../services/resultPublish.service");
const logger = require("../config/logger.config");

/**
 * Background task to publish scheduled results
 */
const publishScheduledResults = async () => {
  try {
    const now = new Date();
    
    // Find exams that are not yet "resultPublished" but have a schedule date in the past
    const examsToPublish = await Exam.find({
      state: { $ne: "resultPublished" },
      publishResultsAt: { $lte: now, $ne: null }
    });

    if (examsToPublish.length > 0) {
      logger.info(`Found ${examsToPublish.length} exams with scheduled results to publish`);
      
      for (const exam of examsToPublish) {
        try {
          await publishExamResults({
            examId: exam._id.toString(),
            teacherId: exam.createdBy.toString(),
            isWorker: true
          });
          logger.info(`Successfully processed scheduled results for exam: ${exam.title} (${exam._id})`);
        } catch (error) {
          logger.error(`Failed to publish scheduled results for exam ${exam._id}: ${error.message}`);
        }
      }
    }
  } catch (error) {
    logger.error(`Error in publishScheduledResults cron: ${error.message}`);
  }
};

module.exports = publishScheduledResults;
