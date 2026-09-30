/**
 * Generate student credential email HTML
 */
const generateStudentCredentialEmail = (data) => {
  const { studentName, registrationNumber, username, password, enrolledClasses } = data;

  const classListHTML = enrolledClasses && enrolledClasses.length > 0
    ? enrolledClasses.map(cls => `
        <li style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">
          <strong>${cls.courseName}</strong> (${cls.courseCode})<br>
          <span style="color: #6c757d; font-size: 14px;">
            ${cls.labDay} | ${cls.labStartTime} - ${cls.labEndTime} | ${cls.venue || 'Venue TBA'}
          </span>
        </li>
      `).join("")
    : '<li style="color: #6c757d;">No classes enrolled yet.</li>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Welcome to CampusCode!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Your Coding Exam Platform</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${studentName}</strong>,</p>
        
        <p>Your CampusCode account has been created successfully. Here are your login credentials:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 5px 0;"><strong>Registration Number:</strong> ${registrationNumber}</p>
          <p style="margin: 5px 0;"><strong>Username:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${username}</code></p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${password}</code></p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404;">
            <strong>⚠️ Important:</strong> You will be required to change your password on first login for security reasons.
          </p>
        </div>
        
        <h3 style="color: #667eea; margin-top: 30px;">Your Enrolled Classes:</h3>
        <ul style="list-style: none; padding: 0;">
          ${classListHTML}
        </ul>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="margin: 5px 0;">If you have any questions or issues, please contact your faculty advisor.</p>
          <p style="margin: 5px 0; color: #6c757d; font-size: 14px;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate teacher credential email HTML
 */
const generateTeacherCredentialEmail = (data) => {
  const { facultyName, username, password, assignedClasses, isVerified } = data;

  const classListHTML = assignedClasses && assignedClasses.length > 0
    ? assignedClasses.map(cls => `
        <li style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">
          <strong>${cls.courseName}</strong> (${cls.courseCode})<br>
          <span style="color: #6c757d; font-size: 14px;">
            Batch ${cls.batch} | Section ${cls.section} | Group ${cls.group}<br>
            ${cls.labDay} | ${cls.labStartTime} - ${cls.labEndTime} | ${cls.venue || 'Venue TBA'}
          </span>
        </li>
      `).join("")
    : '<li style="color: #6c757d;">No classes assigned yet.</li>';

  const verificationNotice = !isVerified
    ? `
      <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
        <p style="margin: 0; color: #0c5460;">
          <strong>ℹ️ Notice:</strong> Your account is pending verification by the administrator. You will be able to access all features once verified.
        </p>
      </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Welcome to CampusCode!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Faculty Portal</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${facultyName}</strong>,</p>
        
        <p>Your CampusCode faculty account has been created. Here are your login credentials:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #11998e;">
          <p style="margin: 5px 0;"><strong>Username:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${username}</code></p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${password}</code></p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404;">
            <strong>⚠️ Important:</strong> You will be required to change your password on first login for security reasons.
          </p>
        </div>
        
        ${verificationNotice}
        
        <h3 style="color: #11998e; margin-top: 30px;">Your Assigned Classes:</h3>
        <ul style="list-style: none; padding: 0;">
          ${classListHTML}
        </ul>
        
        <h3 style="color: #11998e; margin-top: 30px;">Getting Started:</h3>
        <ol style="color: #6c757d;">
          <li>Login with your credentials</li>
          <li>Change your temporary password</li>
          <li>View your assigned classes</li>
          <li>Create questions for your courses</li>
          <li>Schedule and publish exams</li>
        </ol>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="margin: 5px 0;">If you have any questions, please contact the system administrator.</p>
          <p style="margin: 5px 0; color: #6c757d; font-size: 14px;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate password reset email HTML
 */
const generatePasswordResetEmail = (data) => {
  const { name, resetLink, expiryTime } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc3545; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${name}</strong>,</p>
        
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #6c757d; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="background: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px;">
          ${resetLink}
        </p>
        
        <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <p style="margin: 0; color: #721c24;">
            <strong>⚠️ Security Notice:</strong> This link will expire in ${expiryTime || "1 hour"}. If you didn't request this reset, please ignore this email.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="margin: 5px 0; color: #6c757d; font-size: 14px;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate plain text version of student credential email
 */
const generateStudentCredentialEmailPlainText = (data) => {
  const { studentName, registrationNumber, username, password, enrolledClasses } = data;

  const classList = enrolledClasses && enrolledClasses.length > 0
    ? enrolledClasses.map(cls => 
        `- ${cls.courseName} (${cls.courseCode}) | ${cls.labDay} ${cls.labStartTime}-${cls.labEndTime}`
      ).join("\n")
    : "No classes enrolled yet.";

  return `
Welcome to CampusCode!

Dear ${studentName},

Your CampusCode account has been created successfully. Here are your login credentials:

Registration Number: ${registrationNumber}
Username: ${username}
Temporary Password: ${password}

IMPORTANT: You will be required to change your password on first login for security reasons.

Your Enrolled Classes:
${classList}

If you have any questions or issues, please contact your faculty advisor.

This is an automated email. Please do not reply.
  `.trim();
};

/**
 * Generate plain text version of teacher credential email
 */
const generateTeacherCredentialEmailPlainText = (data) => {
  const { facultyName, username, password, assignedClasses } = data;

  const classList = assignedClasses && assignedClasses.length > 0
    ? assignedClasses.map(cls => 
        `- ${cls.courseName} (${cls.courseCode}) | Batch ${cls.batch} Section ${cls.section} Group ${cls.group}`
      ).join("\n")
    : "No classes assigned yet.";

  return `
Welcome to CampusCode - Faculty Portal

Dear ${facultyName},

Your CampusCode faculty account has been created. Here are your login credentials:

Username: ${username}
Temporary Password: ${password}

IMPORTANT: You will be required to change your password on first login for security reasons.

Your Assigned Classes:
${classList}

If you have any questions, please contact the system administrator.

This is an automated email. Please do not reply.
  `.trim();
};

module.exports = {
  generateStudentCredentialEmail,
  generateTeacherCredentialEmail,
  generatePasswordResetEmail,
  generateStudentCredentialEmailPlainText,
  generateTeacherCredentialEmailPlainText
};