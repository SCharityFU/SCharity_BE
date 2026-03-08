import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"${process.env.SMTP_FROM_NAME || 'SCharity'}" <${process.env.SMTP_FROM_EMAIL || 'no-reply@scharity.org'}>`;

async function sendMail(to: string, subject: string, html: string) {
  await transporter.sendMail({ from: FROM, to, subject, html });
}

export const emailService = {
  async sendVerificationEmail(email: string, name: string, token: string) {
    const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await sendMail(
      email,
      'Verify your SCharity email',
      `<p>Hi ${name},</p><p>Please verify your email by clicking <a href="${link}">here</a>.</p><p>This link expires in 24 hours.</p>`,
    );
  },

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendMail(
      email,
      'Reset your SCharity password',
      `<p>Hi ${name},</p><p>Click <a href="${link}">here</a> to reset your password. This link expires in 1 hour.</p><p>If you did not request this, please ignore this email.</p>`,
    );
  },

  async sendDonationReceipt(
    email: string,
    donorName: string,
    campaignTitle: string,
    amount: number,
    donationId: string,
  ) {
    await sendMail(
      email,
      'Donation Receipt - SCharity',
      `<p>Dear ${donorName},</p><p>Thank you for your generous donation of <strong>${amount.toLocaleString('vi-VN')} VND</strong> to <strong>${campaignTitle}</strong>.</p><p>Transaction ID: ${donationId}</p><p>Together we make a difference!</p>`,
    );
  },

  async sendNewDonationNotification(
    email: string,
    creatorName: string,
    campaignTitle: string,
    amount: number,
    donorName: string,
  ) {
    await sendMail(
      email,
      'New Donation Received - SCharity',
      `<p>Hi ${creatorName},</p><p><strong>${donorName}</strong> just donated <strong>${amount.toLocaleString('vi-VN')} VND</strong> to your campaign <strong>${campaignTitle}</strong>.</p>`,
    );
  },

  async sendCampaignApprovedEmail(email: string, creatorName: string, campaignTitle: string) {
    await sendMail(
      email,
      'Campaign Approved - SCharity',
      `<p>Hi ${creatorName},</p><p>Your campaign <strong>${campaignTitle}</strong> has been approved and is now live!</p>`,
    );
  },

  async sendCampaignRejectedEmail(
    email: string,
    creatorName: string,
    campaignTitle: string,
    reason: string,
  ) {
    await sendMail(
      email,
      'Campaign Request Rejected - SCharity',
      `<p>Hi ${creatorName},</p><p>Unfortunately, your campaign request <strong>${campaignTitle}</strong> was rejected.</p><p>Reason: ${reason}</p>`,
    );
  },

  async sendCampaignSuspendedEmail(
    email: string,
    creatorName: string,
    campaignTitle: string,
    reason: string,
  ) {
    await sendMail(
      email,
      'Campaign Suspended - SCharity',
      `<p>Hi ${creatorName},</p><p>Your campaign <strong>${campaignTitle}</strong> has been suspended.</p><p>Reason: ${reason}</p><p>Please contact support for more information.</p>`,
    );
  },

  async sendWithdrawApprovedEmail(
    email: string,
    creatorName: string,
    campaignTitle: string,
    amount: number,
  ) {
    await sendMail(
      email,
      'Withdrawal Approved - SCharity',
      `<p>Hi ${creatorName},</p><p>Your withdrawal request of <strong>${amount.toLocaleString('vi-VN')} VND</strong> for campaign <strong>${campaignTitle}</strong> has been approved and will be processed shortly.</p>`,
    );
  },

  async sendWithdrawRejectedEmail(
    email: string,
    creatorName: string,
    campaignTitle: string,
    reason: string,
  ) {
    await sendMail(
      email,
      'Withdrawal Rejected - SCharity',
      `<p>Hi ${creatorName},</p><p>Your withdrawal request for campaign <strong>${campaignTitle}</strong> has been rejected.</p><p>Reason: ${reason}</p>`,
    );
  },

  async sendCampaignUpdateNotification(
    emails: string[],
    campaignTitle: string,
    updateTitle: string,
    campaignId: string,
  ) {
    const link = `${process.env.FRONTEND_URL}/campaigns/${campaignId}`;
    await Promise.all(
      emails.map((email) =>
        sendMail(
          email,
          `Update on "${campaignTitle}" - SCharity`,
          `<p>The campaign <strong>${campaignTitle}</strong> has a new update: <strong>${updateTitle}</strong>.</p><p><a href="${link}">View update</a></p>`,
        ),
      ),
    );
  },
};
