const nodemailer = require("nodemailer");
const {
  generateStudentCredentialEmail,
  generateTeacherCredentialEmail,
  generateStudentCredentialEmailPlainText,
  generateTeacherCredentialEmailPlainText
} = require("../utils/emailTemplates.util");

/**
 * Create nodemailer transporter
 * Configure with SMTP settings from environment variables or custom credentials
 */
const createTransporter = (customCredentials = null) => {
  const config = {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: customCredentials?.email || process.env.EMAIL_USER,
      pass: customCredentials?.password || process.env.EMAIL_PASSWORD
    }
  };

  return nodemailer.createTransport(config);
};

/**
 * Send a single email
 */
const sendEmail = async (options, customCredentials = null) => {
  const { to, subject, html, text } = options;

  try {
    const transporter = createTransporter(customCredentials);
    const senderEmail = customCredentials?.email || process.env.EMAIL_USER;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'CampusCode'}" <${process.env.EMAIL_FROM || senderEmail}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, "") // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      to
    };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    return {
      success: false,
      error: error.message,
      to
    };
  }
};

/**
 * Send credential email to student
 */
const sendStudentCredentialEmail = async (studentData, customCredentials = null) => {
  const { email, studentName, registrationNumber, username, password, enrolledClasses } = studentData;

  const html = generateStudentCredentialEmail({
    studentName,
    registrationNumber,
    username,
    password,
    enrolledClasses: enrolledClasses || []
  });

  const text = generateStudentCredentialEmailPlainText({
    studentName,
    registrationNumber,
    username,
    password,
    enrolledClasses: enrolledClasses || []
  });

  return await sendEmail({
    to: email,
    subject: "Your CampusCode Login Credentials",
    html,
    text
  }, customCredentials);
};

/**
 * Send credential email to teacher
 */
const sendTeacherCredentialEmail = async (teacherData, customCredentials = null) => {
  const { email, facultyName, username, password, assignedClasses, isVerified } = teacherData;

  const html = generateTeacherCredentialEmail({
    facultyName,
    username,
    password,
    assignedClasses: assignedClasses || [],
    isVerified: isVerified || false
  });

  const text = generateTeacherCredentialEmailPlainText({
    facultyName,
    username,
    password,
    assignedClasses: assignedClasses || []
  });

  return await sendEmail({
    to: email,
    subject: "Your CampusCode Faculty Account",
    html,
    text
  }, customCredentials);
};

/**
 * Send emails in batches (to avoid rate limits)
 */
const sendEmailBatch = async (emailList, batchSize = 50, delayMs = 1000, customCredentials = null) => {
  const results = {
    sent: [],
    failed: []
  };

  for (let i = 0; i < emailList.length; i += batchSize) {
    const batch = emailList.slice(i, i + batchSize);

    // Send batch in parallel
    const batchResults = await Promise.all(
      batch.map(emailData => {
        if (emailData.type === "student") {
          return sendStudentCredentialEmail(emailData, customCredentials);
        } else if (emailData.type === "teacher") {
          return sendTeacherCredentialEmail(emailData, customCredentials);
        }
      })
    );

    // Collect results
    batchResults.forEach(result => {
      if (result.success) {
        results.sent.push(result);
      } else {
        results.failed.push(result);
      }
    });

    // Delay between batches
    if (i + batchSize < emailList.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
};

/**
 * Send credential emails for uploaded users
 */
const sendCredentialEmailsForUpload = async (students, teachers, customCredentials = null) => {
  const emailList = [];

  // Prepare student emails
  students.forEach(student => {
    if (student.password && student.email) {
      emailList.push({
        type: "student",
        email: student.email,
        studentName: student.studentName,
        registrationNumber: student.registrationNumber,
        username: student.username,
        password: student.password,
        enrolledClasses: student.enrolledClasses || []
      });
    }
  });

  // Prepare teacher emails
  teachers.forEach(teacher => {
    if (teacher.password && teacher.email && !teacher.isPlaceholder) {
      emailList.push({
        type: "teacher",
        email: teacher.email,
        facultyName: teacher.facultyName,
        username: teacher.username,
        password: teacher.password,
        assignedClasses: teacher.assignedClasses || [],
        isVerified: false
      });
    }
  });

  // Send emails in batches
  const batchSize = parseInt(process.env.EMAIL_BATCH_SIZE || "50");
  const delayMs = parseInt(process.env.EMAIL_BATCH_DELAY || "1000");

  return await sendEmailBatch(emailList, batchSize, delayMs, customCredentials);
};

/**
 * Test email configuration
 */
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: "Email configuration is valid" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Send test email
 */
const sendTestEmail = async (to) => {
  return await sendEmail({
    to,
    subject: "CampusCode - Test Email",
    html: `
      <h1>Test Email</h1>
      <p>This is a test email from CampusCode.</p>
      <p>If you received this email, your email configuration is working correctly.</p>
    `,
    text: "This is a test email from CampusCode. If you received this email, your email configuration is working correctly."
  });
};

module.exports = {
  sendEmail,
  sendStudentCredentialEmail,
  sendTeacherCredentialEmail,
  sendEmailBatch,
  sendCredentialEmailsForUpload,
  testEmailConfiguration,
  sendTestEmail
};