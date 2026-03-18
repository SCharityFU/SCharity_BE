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

const FROM = `"${process.env.SMTP_FROM_NAME || 'FCam'}" <${process.env.SMTP_FROM_EMAIL || 'no-reply@fcam.org'}>`;

async function sendMail(to: string, subject: string, html: string) {
  await transporter.sendMail({ from: FROM, to, subject, html });
}

export const emailService = {
  async sendVerificationEmail(email: string, name: string, token: string) {
    const link = `${process.env.CLIENT_URL || 'http://localhost:3001'}/verify-email?token=${token}`;
    await sendMail(
      email,
      'Xác Thực Tài Khoản FCam',
      `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fce7f3; margin: 0; padding: 40px 0; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
              .header { background: linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center; }
              .header img { width: 120px; margin-bottom: 20px; }
              .header h1 { color: #ffffff; font-size: 28px; margin: 0; font-weight: 700; }
              .content { padding: 40px 40px; text-align: center; }
              .content h2 { color: #18181b; font-size: 24px; margin-top: 0; margin-bottom: 10px; font-weight: 700; }
              .content p { color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
              .button { display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%); color: #ffffff; font-weight: bold; text-decoration: none; padding: 15px 35px; border-radius: 30px; font-size: 16px; transition: transform 0.2s; box-shadow: 0 4px 15px rgba(244, 63, 94, 0.3); }
              .footer { padding: 30px 40px; background-color: #fafafa; text-align: center; border-top: 1px solid #f4f4f5; }
              .footer p { color: #a1a1aa; font-size: 13px; margin: 0; line-height: 1.5; }
              .footer a { color: #8b5cf6; text-decoration: none; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <!-- Optional: Replace with actual logo URL later if available -->
                  <h1 style="font-size: 40px;">FCam</h1>
              </div>
              <div class="content">
                  <h2>Xác thực địa chỉ email</h2>
                  <p style="font-weight: bold; color: #18181b;">Chào mừng ${name} đến với FCam!</p>
                  <p>Vui lòng nhấn vào nút bên dưới để xác nhận địa chỉ email của bạn và hoàn tất quá trình đăng ký tài khoản. Đường link này sẽ hết hạn trong vòng 24 giờ.</p>
                  <a href="${link}" class="button" style="color: #ffffff;">Xác Nhận Email</a>
                  <p style="margin-top: 30px; font-size: 14px; color: #a1a1aa;">Nếu bạn không tạo tài khoản trên FCam, bạn có thể bỏ qua email này.</p>
              </div>
              <div class="footer">
                  <p>Copyright © 2026, FCam Platform</p>
                  <p>Cùng nhau tạo nên những thay đổi tích cực.</p>
              </div>
          </div>
      </body>
      </html>
      `
    );
  },

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const link = `${process.env.CLIENT_URL || 'http://localhost:3001'}/reset-password?token=${token}`;
    await sendMail(
      email,
      'Khôi Phục Mật Khẩu FCam',
      `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fce7f3; margin: 0; padding: 40px 0; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
              .header { background: linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center; }
              .header img { width: 120px; margin-bottom: 20px; }
              .header h1 { color: #ffffff; font-size: 28px; margin: 0; font-weight: 700; }
              .content { padding: 40px 40px; text-align: center; }
              .content h2 { color: #18181b; font-size: 24px; margin-top: 0; margin-bottom: 10px; font-weight: 700; }
              .content p { color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
              .button { display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%); color: #ffffff; font-weight: bold; text-decoration: none; padding: 15px 35px; border-radius: 30px; font-size: 16px; transition: transform 0.2s; box-shadow: 0 4px 15px rgba(244, 63, 94, 0.3); }
              .footer { padding: 30px 40px; background-color: #fafafa; text-align: center; border-top: 1px solid #f4f4f5; }
              .footer p { color: #a1a1aa; font-size: 13px; margin: 0; line-height: 1.5; }
              .footer a { color: #8b5cf6; text-decoration: none; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>FCam</h1>
              </div>
              <div class="content">
                  <h2>Yêu cầu khôi phục mật khẩu</h2>
                  <p style="font-weight: bold; color: #18181b;">Chào ${name},</p>
                  <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn trên FCam. Vui lòng nhấn vào nút bên dưới để thiết lập mật khẩu mới.</p>
                  <a href="${link}" class="button" style="color: #ffffff;">Đặt Lại Mật Khẩu</a>
                  <p style="margin-top: 30px; font-size: 14px; color: #a1a1aa;">Đường dẫn này sẽ hết hạn trong 1 giờ.<br/>Nếu bạn không gửi yêu cầu này, xin vui lòng bỏ qua email.</p>
              </div>
              <div class="footer">
                  <p>Copyright © 2026, FCam Platform</p>
                  <p>Cùng nhau tạo nên những thay đổi tích cực.</p>
              </div>
          </div>
      </body>
      </html>
      `
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
      'Donation Receipt - FCam',
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
      'New Donation Received - FCam',
      `<p>Hi ${creatorName},</p><p><strong>${donorName}</strong> just donated <strong>${amount.toLocaleString('vi-VN')} VND</strong> to your campaign <strong>${campaignTitle}</strong>.</p>`,
    );
  },

  async sendCampaignApprovedEmail(email: string, creatorName: string, campaignTitle: string) {
    await sendMail(
      email,
      'Campaign Approved - FCam',
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
      'Campaign Request Rejected - FCam',
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
      'Campaign Suspended - FCam',
      `<p>Hi ${creatorName},</p><p>Your campaign <strong>${campaignTitle}</strong> has been suspended.</p><p>Reason: ${reason}</p><p>Please contact support for more information.</p>`,
    );
  },

  async sendCampaignUnsuspendedEmail(
    email: string,
    creatorName: string,
    campaignTitle: string,
    restoredStatus: string,
  ) {
    const statusText = restoredStatus === 'closed' ? 'đã đóng (hết hạn)' : 'đang hoạt động';
    await sendMail(
      email,
      'Campaign Unsuspended - FCam',
      `<p>Hi ${creatorName},</p><p>Your campaign <strong>${campaignTitle}</strong> has been unsuspended and is now <strong>${statusText}</strong>.</p><p>Thank you for your patience.</p>`,
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
      'Withdrawal Approved - FCam',
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
      'Withdrawal Rejected - FCam',
      `<p>Hi ${creatorName},</p><p>Your withdrawal request for campaign <strong>${campaignTitle}</strong> has been rejected.</p><p>Reason: ${reason}</p>`,
    );
  },

  async sendCampaignUpdateNotification(
    emails: string[],
    campaignTitle: string,
    updateTitle: string,
    campaignId: string,
  ) {
    const link = `${process.env.CLIENT_URL || 'http://localhost:3001'}/campaigns/${campaignId}`;
    await Promise.all(
      emails.map((email) =>
        sendMail(
          email,
          `Update on "${campaignTitle}" - SFCam`,
          `<p>The campaign <strong>${campaignTitle}</strong> has a new update: <strong>${updateTitle}</strong>.</p><p><a href="${link}">View update</a></p>`,
        ),
      ),
    );
  },

  async sendBankChangeRequestNotification(
    requesterName: string,
    requesterEmail: string,
    currentBankName: string,
    currentAccountNumber: string,
    currentAccountHolderName: string,
    newBankName: string,
    newAccountNumber: string,
    newAccountHolderName: string,
    changeRequestId: string,
  ) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fcam.org';
    const loginLink = `${process.env.CLIENT_URL || 'http://localhost:3001'}/admin/login`;

    await sendMail(
      adminEmail,
      'New Bank Account Change Request - FCam',
      `<p>Admin action required</p>
      <p>User <strong>${requesterName}</strong> (${requesterEmail}) has requested to change their bank account information.</p>
      <h3>Current Info:</h3>
      <ul>
        <li>Bank: ${currentBankName}</li>
        <li>Account: ${currentAccountNumber}</li>
        <li>Holder: ${currentAccountHolderName}</li>
      </ul>
      <h3>Requested New Info:</h3>
      <ul>
        <li>Bank: ${newBankName}</li>
        <li>Account: ${newAccountNumber}</li>
        <li>Holder: ${newAccountHolderName}</li>
      </ul>
      <p>Log in to the <a href="${loginLink}">Admin Dashboard</a> to review and approve/reject this request (ID: ${changeRequestId}).</p>`,
    );
  },

  async sendBankChangeApprovedEmail(
    email: string,
    userName: string,
    bankName: string,
    accountNumber: string,
  ) {
    await sendMail(
      email,
      'Bank Account Change Approved - FCam',
      `<p>Hi ${userName},</p>
       <p>Great news! Your request to change your bank account information to <strong>${bankName} - ${accountNumber}</strong> has been approved.</p>
       <p>You can now use this account to withdraw funds from your closed campaigns.</p>`,
    );
  },

  async sendBankChangeRejectedEmail(email: string, userName: string, reason: string) {
    await sendMail(
      email,
      'Bank Account Change Rejected - FCam',
      `<p>Hi ${userName},</p>
       <p>Unfortunately, your request to change your bank account information has been rejected.</p>
       <p><strong>Reason:</strong> ${reason}</p>
       <p>Your previous bank account information remains active.</p>`,
    );
  },
};

