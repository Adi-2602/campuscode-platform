/**
 * PHASE 7: TEACHER VERIFICATION ENHANCEMENTS
 * 
 * Add these email templates to utils/emailTemplates.util.js
 */

/**
 * Generate teacher account rejection email
 */
const generateAccountRejectionEmail = (data) => {
  const { facultyName, reason } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc3545; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Account Verification Status</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${facultyName}</strong>,</p>
        
        <p>We regret to inform you that your CampusCode faculty account verification was not approved.</p>
        
        <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <p style="margin: 0; color: #721c24;">
            <strong>Reason:</strong> ${reason || "Account verification could not be completed"}
          </p>
        </div>
        
        <p>If you believe this is an error or need further clarification, please contact the system administrator.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="margin: 5px 0; color: #6c757d; font-size: 14px;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate teacher verification approval email
 */
const generateTeacherVerificationEmail = (data) => {
  const { facultyName, email, assignedClasses } = data;

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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Account Verified!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">You can now access CampusCode</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${facultyName}</strong>,</p>
        
        <p>Great news! Your CampusCode faculty account has been verified by the administrator.</p>
        
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p style="margin: 0; color: #155724;">
            <strong>✓ Account Status:</strong> Verified and Active
          </p>
        </div>
        
        <p>You can now login with your credentials and access all features:</p>
        <ul style="color: #6c757d;">
          <li>View your class schedule</li>
          <li>Create and manage questions</li>
          <li>Schedule and conduct exams</li>
          <li>Evaluate student submissions</li>
        </ul>
        
        <h3 style="color: #11998e; margin-top: 30px;">Your Assigned Classes:</h3>
        <ul style="list-style: none; padding: 0;">
          ${classListHTML}
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="margin: 5px 0; font-size: 14px; color: #6c757d;">Login at:</p>
          <p style="margin: 5px 0;"><strong>${email}</strong></p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="margin: 5px 0; color: #6c757d; font-size: 14px;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Add to module.exports
module.exports = {
  // ... existing exports
  generateAccountRejectionEmail,
  generateTeacherVerificationEmail
};