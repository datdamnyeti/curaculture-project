// src/services/emailService.ts

/**
 * Email service for sending survey invitations
 * For development, this just logs to console
 * In production, integrate with SendGrid, Mailchimp, etc.
 */

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

/**
 * Send an email
 * This is a mock implementation that simulates email sending
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  // In a real implementation, this would use an email API
  console.log('=== EMAIL SENDING SIMULATION ===');
  console.log(`TO: ${options.to}`);
  console.log(`SUBJECT: ${options.subject}`);
  console.log(`BODY: ${options.body}`);
  console.log('===============================');
  
  // Simulate success with occasional failures to test error handling
  const success = Math.random() > 0.1; // 90% success rate
  
  if (!success) {
    console.log(`Email sending to ${options.to} failed (simulated)`);
  } else {
    console.log(`Email sent to ${options.to} successfully (simulated)`);
  }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return success;
};

/**
 * Send a survey invitation email
 */
export const sendSurveyInvitation = async (
  email: string,
  surveyLink: string,
  subject: string,
  body: string
): Promise<boolean> => {
  // Replace {{surveyLink}} with the actual link
  const processedBody = body.replace(/{{surveyLink}}/g, surveyLink);
  
  return sendEmail({
    to: email,
    subject,
    body: processedBody
  });
};