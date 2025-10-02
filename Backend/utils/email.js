const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  emailVerification: (data) => ({
    subject: 'Verify Your Email Address',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Nature Pulse</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.name}!</h2>
            <p>Thank you for registering with our healthcare platform. To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${data.verificationURL}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${data.verificationURL}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with us, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nature Pulse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  doctorEmailVerification: (data) => ({
    subject: 'Verify Your Doctor Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Doctor Account Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Nature Pulse - Doctor Portal</h1>
          </div>
          <div class="content">
            <h2>Hello Dr. ${data.name}!</h2>
            <p>Thank you for registering as a doctor on our healthcare platform. We're excited to have you join our community of healthcare professionals.</p>
            <p><strong>Specialization:</strong> ${data.specialization}</p>
            <p>To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${data.verificationURL}" class="button">Verify Doctor Account</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${data.verificationURL}</p>
            <p>This link will expire in 24 hours.</p>
            <p>After verification, your account will be reviewed by our admin team before activation.</p>
            <p>If you didn't create a doctor account with us, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nature Pulse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  passwordReset: (data) => ({
    subject: 'Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.name}!</h2>
            <p>We received a request to reset your password for your Nature Pulse account.</p>
            <p>To reset your password, please click the button below:</p>
            <a href="${data.resetURL}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${data.resetURL}</p>
            <p>This link will expire in 10 minutes for security reasons.</p>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nature Pulse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  appointmentConfirmation: (data) => ({
    subject: 'Appointment Confirmation',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .appointment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Confirmed</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.patientName}!</h2>
            <p>Your appointment has been confirmed. Here are the details:</p>
            <div class="appointment-details">
              <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
              <p><strong>Date:</strong> ${data.appointmentDate}</p>
              <p><strong>Time:</strong> ${data.appointmentTime}</p>
              <p><strong>Type:</strong> ${data.appointmentType}</p>
              <p><strong>Reason:</strong> ${data.reason}</p>
              ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">Join Meeting</a></p>` : ''}
            </div>
            <p>Please arrive 10 minutes before your scheduled time.</p>
            <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nature Pulse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  appointmentReminder: (data) => ({
    subject: 'Appointment Reminder',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .appointment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Reminder</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.patientName}!</h2>
            <p>This is a reminder about your upcoming appointment:</p>
            <div class="appointment-details">
              <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
              <p><strong>Date:</strong> ${data.appointmentDate}</p>
              <p><strong>Time:</strong> ${data.appointmentTime}</p>
              <p><strong>Type:</strong> ${data.appointmentType}</p>
              ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">Join Meeting</a></p>` : ''}
            </div>
            <p>Please don't forget to bring any relevant medical documents or test results.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nature Pulse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  paymentSuccess: (data) => ({
    subject: 'Payment Successful - Appointment Confirmed',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Successful</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .payment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4CAF50; }
          .appointment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .success-icon { color: #4CAF50; font-size: 48px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Successful!</h1>
          </div>
          <div class="content">
            <div class="success-icon">✅</div>
            <h2>Hello ${data.patientName}!</h2>
            <p>Great news! Your payment has been processed successfully and your appointment is now confirmed.</p>
            
            <div class="payment-details">
              <h3>Payment Details</h3>
              <p><strong>Amount:</strong> $${data.amount}</p>
              <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
              <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
              <p><strong>Date:</strong> ${data.paymentDate}</p>
            </div>

            <div class="appointment-details">
              <h3>Appointment Details</h3>
              <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
              <p><strong>Date:</strong> ${data.appointmentDate}</p>
              <p><strong>Time:</strong> ${data.appointmentTime}</p>
              <p><strong>Type:</strong> ${data.appointmentType || 'Consultation'}</p>
              ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">Join Meeting</a></p>` : ''}
            </div>

            <p>You will receive a reminder email 24 hours before your appointment.</p>
            <p>If you need to cancel or reschedule, please do so at least 5 hours before your appointment time.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nature Pulse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
const sendEmail = async (options) => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email not configured, skipping email send for:', options.template);
      return { messageId: 'demo-email-disabled' };
    }

    const transporter = createTransporter();
    
    // Get email template
    const template = emailTemplates[options.template];
    if (!template) {
      throw new Error(`Email template '${options.template}' not found`);
    }
    
    const emailContent = template(options.data);
    
    const mailOptions = {
      from: `"Nature Pulse" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    // Don't throw error to prevent blocking the main process
    return { messageId: 'email-failed', error: error.message };
  }
};

// Send bulk email function
const sendBulkEmail = async (recipients, template, data) => {
  try {
    const transporter = createTransporter();
    const emailContent = emailTemplates[template];
    
    if (!emailContent) {
      throw new Error(`Email template '${template}' not found`);
    }
    
    const promises = recipients.map(async (email) => {
      const mailOptions = {
        from: `"Nature Pulse" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html
      };
      
      return transporter.sendMail(mailOptions);
    });
    
    const results = await Promise.all(promises);
    console.log(`Bulk email sent to ${recipients.length} recipients`);
    return results;
  } catch (error) {
    console.error('Bulk email sending failed:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  emailTemplates
};
