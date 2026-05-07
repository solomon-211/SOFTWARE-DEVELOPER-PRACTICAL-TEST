const nodemailer = require('nodemailer');

let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    transporter = {
      sendMail: async (opts) => {
        console.log('\n📧 [EMAIL - not sent, no SMTP config]');
        console.log('  To:', opts.to);
        console.log('  Subject:', opts.subject);
        console.log('  Text:', opts.text?.slice(0, 200));
        return { messageId: 'dev-mode' };
      },
    };
  }

  return transporter;
};

const FROM = process.env.EMAIL_FROM || 'SchoolPortal <no-reply@school.rw>';

const sendEmail = async ({ to, subject, html, text }) => {
  const t = await getTransporter();
  return t.sendMail({ from: FROM, to, subject, html, text });
};

const notify = {
  deviceVerified: (user) => sendEmail({
    to:      user.email,
    subject: 'Your device has been verified — SchoolPortal',
    html: `<p>Hi ${user.firstName},</p>
           <p>Your device has been <strong>verified</strong> by the school admin. You can now log in to SchoolPortal.</p>
           <p>If you did not request this, please contact the school immediately.</p>`,
    text: `Hi ${user.firstName}, your device has been verified. You can now log in to SchoolPortal.`,
  }),

  paymentApproved: (user, amount) => sendEmail({
    to:      user.email,
    subject: 'Payment Approved — SchoolPortal',
    html: `<p>Hi ${user.firstName},</p>
           <p>Your fee payment of <strong>${Number(amount).toLocaleString()} RWF</strong> has been <strong>approved</strong> and added to your balance.</p>`,
    text: `Hi ${user.firstName}, your payment of ${Number(amount).toLocaleString()} RWF has been approved.`,
  }),

  paymentRejected: (user, amount) => sendEmail({
    to:      user.email,
    subject: 'Payment Rejected — SchoolPortal',
    html: `<p>Hi ${user.firstName},</p>
           <p>Your fee payment of <strong>${Number(amount).toLocaleString()} RWF</strong> was <strong>rejected</strong>. Please contact the school office for details.</p>`,
    text: `Hi ${user.firstName}, your payment of ${Number(amount).toLocaleString()} RWF was rejected.`,
  }),

  refundApproved: (user, amount) => sendEmail({
    to:      user.email,
    subject: 'Refund Approved — SchoolPortal',
    html: `<p>Hi ${user.firstName},</p>
           <p>Your refund request of <strong>${Number(amount).toLocaleString()} RWF</strong> has been <strong>approved</strong>.</p>`,
    text: `Hi ${user.firstName}, your refund of ${Number(amount).toLocaleString()} RWF has been approved.`,
  }),

  gradesUpdated: (user, subject, term) => sendEmail({
    to:      user.email,
    subject: `Grades Updated: ${subject} — SchoolPortal`,
    html: `<p>Hi ${user.firstName},</p>
           <p>Your grades for <strong>${subject}</strong> (${term}) have been updated. Log in to SchoolPortal to view them.</p>`,
    text: `Hi ${user.firstName}, your grades for ${subject} (${term}) have been updated.`,
  }),

  passwordReset: (user, resetUrl) => sendEmail({
    to:      user.email,
    subject: 'Reset Your Password — SchoolPortal',
    html: `<p>Hi ${user.firstName},</p>
           <p>You requested a password reset. Click the link below (valid for 1 hour):</p>
           <p><a href="${resetUrl}" style="background:#f97316;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
           <p>If you did not request this, ignore this email.</p>`,
    text: `Hi ${user.firstName}, reset your password here: ${resetUrl}`,
  }),

  linkingApproved: (user, studentName) => sendEmail({
    to:      user.email,
    subject: 'Child Account Linked — SchoolPortal',
    html: `<p>Hi ${user.firstName},</p>
           <p>Your request to link your account to <strong>${studentName}</strong> has been approved. You can now view their academic records and fees.</p>`,
    text: `Hi ${user.firstName}, your account has been linked to ${studentName}.`,
  }),
};

module.exports = { sendEmail, notify };
