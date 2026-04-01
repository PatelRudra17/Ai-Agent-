const nodemailer = require('nodemailer');

let transporter;

const initTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const t = initTransporter();

  const info = await t.sendMail({
    from: `"Corporate AI Agent" <${process.env.GMAIL_USER}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    text,
    html,
  });

  console.log('Email sent:', info.messageId);
  return info;
};

// HTML email template wrapper
const wrapHtml = (title, body) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">${title}</h2>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    ${body}
  </div>
  <p style="color: #9ca3af; font-size: 12px; margin-top: 16px; text-align: center;">
    Sent by Corporate AI Agent
  </p>
</body>
</html>`;

const sendNotificationEmail = async (to, title, message) => {
  return sendEmail({
    to,
    subject: `[Corporate AI] ${title}`,
    text: message,
    html: wrapHtml(title, `<p style="color: #374151; line-height: 1.6;">${message}</p>`),
  });
};

const sendTaskEmail = async (to, taskTitle, assignedBy, dueDate) => {
  const body = `
    <p style="color: #374151;">You have been assigned a new task:</p>
    <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <h3 style="margin: 0 0 8px; color: #111827;">${taskTitle}</h3>
      <p style="margin: 0; color: #6b7280;">Assigned by: ${assignedBy}</p>
      ${dueDate ? `<p style="margin: 4px 0 0; color: #6b7280;">Due: ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
    </div>
    <p style="color: #374151;">Please log in to view the full details.</p>`;
  return sendEmail({ to, subject: `[Task] ${taskTitle}`, text: `New task: ${taskTitle}`, html: wrapHtml('New Task Assigned', body) });
};

const sendCallReminderEmail = async (to, callerName, message, scheduledAt) => {
  const body = `
    <p style="color: #374151;">You have a scheduled call reminder:</p>
    <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0; color: #111827;"><strong>From:</strong> ${callerName}</p>
      <p style="margin: 4px 0 0; color: #6b7280;"><strong>Time:</strong> ${new Date(scheduledAt).toLocaleString()}</p>
      <p style="margin: 4px 0 0; color: #6b7280;"><strong>Message:</strong> ${message}</p>
    </div>`;
  return sendEmail({ to, subject: `[Call Reminder] from ${callerName}`, text: message, html: wrapHtml('Call Reminder', body) });
};

module.exports = {
  sendEmail,
  sendNotificationEmail,
  sendTaskEmail,
  sendCallReminderEmail,
  wrapHtml,
};
