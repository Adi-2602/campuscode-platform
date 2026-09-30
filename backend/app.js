const express = require("express");
const compilerRoutes = require("./routes/compiler.routes");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const teacherRoutes = require("./routes/teacher.routes");
const studentRoutes = require("./routes/student.routes");
const submissionRoutes = require("./routes/submission.routes");
const examSubmitRoutes = require("./routes/examSubmit.routes");
const manualEvaluationRoutes = require("./routes/manualEvaluation.routes");
const resultPublishRoutes = require("./routes/resultPublish.routes");
const studentResultRoutes = require("./routes/studentResult.routes");
const evaluationCriteriaRoutes = require("./routes/evaluationCriteria.routes");
const finalResultRoutes = require("./routes/finalResult.routes");
// 🔥 NEW ROUTES
const classRoutes = require("./routes/class.routes");
const classStudentRoutes = require("./routes/classStudent.routes");
const autoEvaluationRoutes = require("./routes/autoEvaluation.routes");
// ✨ NEW: Code Draft Routes (Auto-save system)
const codeDraftRoutes = require("./routes/codeDraft.routes");
// 🔥 ADMIN MONITORING ROUTES (NEW - Third Eye System)
const monitoringRoutes = require("./routes/monitoring.routes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const errorHandler = require("./middlewares/error.middleware");
const analyticsRoutes = require("./routes/analytics.routes");
const notificationRoutes = require("./routes/notification.routes");
const reportingRoutes = require("./routes/reporting.routes");

// ✨ NEW: Import Redis config
const { createRedisClient } = require("./config/redis");

//upgrade mode
const semesterRoutes = require("./routes/semester.routes");
const labSlotRoutes = require("./routes/labSlot.routes");

const classScheduleTemplateRoutes = require("./routes/classScheduleTemplate.routes");

const dataUploadRoutes = require("./routes/dataUpload.routes");

const passwordResetRoutes = require("./routes/passwordReset.routes");

const studentDashboardRoutes = require("./routes/studentDashboard.routes");

const teacherDashboardRoutes = require("./routes/teacherDashboard.routes");

const adminReportsRoutes = require("./routes/adminReports.routes");

const slotTimetableRoutes = require("./routes/slotTimetable.routes");

const app = express();

const cors = require("cors");
const requestLogger = require("./middlewares/logger.middleware");

app.use(express.json());
app.use(requestLogger);

// ✨ NEW: Initialize Redis on app startup
createRedisClient();

app.use(cors({
   origin: process.env.FRONTEND_URL || "http://localhost:5173",
   credentials: true
}));

// ✨ NEW: Rate Limiter
const { apiLimiter, authLimiter } = require("./middlewares/rateLimiter.middleware");
app.use(apiLimiter); // Apply global rate limiter

/* =====================
   AUTH & ADMIN
===================== */
// Auth routes
app.use("/auth", authRoutes);  //checked -n check

// Admin routes (basic - teacher verification)
app.use("/admin", adminRoutes);  //checked

// 🔥 Admin monitoring routes (NEW - Third Eye System)
// This includes: admin management, monitoring, audit logs

app.use("/admin/monitoring", monitoringRoutes);  //checked

app.use("/admin/monitoring/analytics", analyticsRoutes); //checked

/* =====================
   TEACHER ROUTES
   (specific → generic)
===================== */
// 🔥 Teacher class management (IMPORTANT: before /teacher)
app.use("/teacher/classes", classRoutes);

// Manual evaluation
app.use("/teacher", manualEvaluationRoutes);

// 🔥 Auto evaluation (NEW)
app.use("/teacher", autoEvaluationRoutes);

// Result publish
app.use("/teacher", resultPublishRoutes);

// Evaluation criteria
app.use("/teacher", evaluationCriteriaRoutes);

// Final result selection & publish
app.use("/teacher", finalResultRoutes);

// Generic teacher routes (LAST)
app.use("/teacher", teacherRoutes);

/* =====================
   STUDENT ROUTES
   (specific → generic)
===================== */
// 🔥 Student class enrollment (IMPORTANT: before /student)
app.use("/student/classes", classStudentRoutes);

// ✨ NEW: Code draft auto-save/recover (IMPORTANT: specific routes before generic)
app.use("/student", codeDraftRoutes);

// Student submissions
app.use("/student", submissionRoutes);

// Exam submission
app.use("/student", examSubmitRoutes);

// Student results
app.use("/student", studentResultRoutes);

// Generic student routes (LAST)
app.use("/student", studentRoutes);

/* =====================
   OTHER ROUTES
===================== */
// Compiler routes
app.use("/compiler", compilerRoutes);

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// User notifications (all authenticated users)
app.use("/notifications", notificationRoutes);  //checked

// Admin notification management
app.use("/admin/monitoring/notifications", notificationRoutes);  //checked

//admin monitoring report 
app.use("/admin/monitoring/reports", reportingRoutes);   //checked



// Mount semester routes
app.use("/admin/semesters", semesterRoutes);   //checked

// Mount lab slot routes
app.use("/admin/lab-slots", labSlotRoutes);  //checked

// Mount class schedule template routes
app.use("/admin/class-schedules", classScheduleTemplateRoutes);  //checked

// Mount data upload routes
app.use("/admin/upload", dataUploadRoutes);  //checked

//password reset
app.use("/auth/password", passwordResetRoutes);  //checked


//Student dashboard -
app.use("/student", studentDashboardRoutes);

//Teacher dashboard 
app.use("/teacher", teacherDashboardRoutes);

//admin report 
app.use("/admin/reports", adminReportsRoutes);  //checked

//slot time table 
app.use("/admin/slot-timetable", slotTimetableRoutes); //checked

app.get("/", (req, res) => {
   res.send("Welcome to backend");
});

// ❗ MUST be last
app.use(errorHandler);

module.exports = app;