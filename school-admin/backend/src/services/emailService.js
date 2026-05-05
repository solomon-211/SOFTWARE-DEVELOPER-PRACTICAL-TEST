const nodemailer = require('nodemailer');

let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    transporter = {
      sendMail: async (opts) => {
        console.log('\n📧 [EMAIL - dev mode, not sent]');
        console.log('  To:', opts.to);
        console.log('  Subject:', opts.subject);
        return { messageId: 'dev-mode' };
      },
    };
  }
  return transporter;
};

const FROM = process.env.EMAIL_FROM || 'SchoolAdmin <no-reply@school.rw>';

const sendEmail = async ({ to, subject, html, text }) => {
  const t = await getTransporter();
  return t.sendMail({ from: FROM, to, subject, html, text });
};

const notify = {
  deviceVerified: (user) => sendEmail({
    to: user.email, subject: 'Device Verified — SchoolPortal',
    html: `<p>Hi ${user.firstName}, your device has been verified. You can now log in.</p>`,
    text: `Hi ${user.firstName}, your device has been verified.`,
  }),
  paymentApproved: (user, amount) => sendEmail({
    to: user.email, subject: 'Payment Approved — SchoolPortal',
    html: `<p>Hi ${user.firstName}, your payment of <strong>${Number(amount).toLocaleString()} RWF</strong> has been approved.</p>`,
    text: `Payment of ${Number(amount).toLocaleString()} RWF approved.`,
  }),
  paymentRejected: (user, amount) => sendEmail({
    to: user.email, subject: 'Payment Rejected — SchoolPortal',
    html: `<p>Hi ${user.firstName}, your payment of <strong>${Number(amount).toLocaleString()} RWF</strong> was rejected. Contact the school office.</p>`,
    text: `Payment of ${Number(amount).toLocaleString()} RWF rejected.`,
  }),
  refundApproved: (user, amount) => sendEmail({
    to: user.email, subject: 'Refund Approved — SchoolPortal',
    html: `<p>Hi ${user.firstName}, your refund of <strong>${Number(amount).toLocaleString()} RWF</strong> has been approved.</p>`,
    text: `Refund of ${Number(amount).toLocaleString()} RWF approved.`,
  }),
  gradesUpdated: (user, subject, term) => sendEmail({
    to: user.email, subject: `Grades Updated: ${subject} — SchoolPortal`,
    html: `<p>Hi ${user.firstName}, grades for <strong>${subject}</strong> (${term}) have been updated.</p>`,
    text: `Grades for ${subject} (${term}) updated.`,
  }),
  linkingApproved: (user, studentName) => sendEmail({
    to: user.email, subject: 'Child Account Linked — SchoolPortal',
    html: `<p>Hi ${user.firstName}, your account has been linked to <strong>${studentName}</strong>.</p>`,
    text: `Account linked to ${studentName}.`,
  }),
  staffPasswordReset: (user, resetUrl) => sendEmail({
    to: user.email, subject: 'Reset Your Password — SchoolAdmin',
    html: `<p>Hi ${user.firstName}, reset your password: <a href="${resetUrl}">Click here</a> (valid 1 hour).</p>`,
    text: `Reset your password: ${resetUrl}`,
  }),
};

module.exports = { sendEmail, notify };
