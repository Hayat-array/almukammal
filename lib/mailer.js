import nodemailer from 'nodemailer';

/**
 * Configure Nodemailer SMTP Transporter
 */
function getCleanAuth() {
  const host = process.env.SMTP_HOST?.replace(/["']/g, '').trim();
  const port = parseInt((process.env.SMTP_PORT || '587').replace(/["']/g, '').trim(), 10);
  const user = process.env.SMTP_USER?.replace(/["']/g, '').trim();
  const pass = process.env.SMTP_PASSWORD?.replace(/["']/g, '').trim();
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  let fromName = process.env.SMTP_FROM_NAME?.replace(/["']/g, '').trim() || 'ALMUKAMMAL COMPUTERS';
  let fromAddress = user || 'noreply@almukammal.ae';

  const rawFrom = process.env.SMTP_FROM?.trim();
  if (rawFrom) {
    if (rawFrom.includes('<') && rawFrom.includes('>')) {
      const match = rawFrom.match(/^(?:["']?([^"'<]+)["']?\s*)?<([^>]+)>$/);
      if (match) {
        if (match[1]?.trim()) fromName = match[1].trim();
        if (match[2]?.trim()) fromAddress = match[2].trim();
      }
    } else if (rawFrom.includes('@')) {
      fromAddress = rawFrom.replace(/["']/g, '').trim();
    } else {
      fromName = rawFrom.replace(/["']/g, '').trim();
    }
  }

  // Ensure fromName avoids special characters like dots, quotes, or excessive length (>35) that trigger RFC 2822 header folding
  if (!fromName || fromName.length > 35 || fromName.includes('.')) {
    fromName = 'ALMUKAMMAL COMPUTERS';
  }

  return {
    host,
    port,
    user,
    pass,
    secure,
    from: {
      name: fromName,
      address: fromAddress,
    },
  };
}

function getTransporter() {
  const { host, port, user, pass, secure } = getCleanAuth();

  if (!user || !pass || (!host && !process.env.SMTP_SERVICE)) {
    return null; // SMTP credentials not configured
  }

  // Gmail-specific optimized transport
  if ((host && host.includes('gmail')) || process.env.SMTP_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
}

/**
 * Luxury HTML Email Template Generator
 */
function generateEmailHtml({ title, preheader, headline, bodyContent, otp, expiryMinutes }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0b0f19;
      padding: 40px 0 60px 0;
    }
    .main {
      background-color: #111827;
      margin: 0 auto;
      width: 100%;
      max-width: 580px;
      border-radius: 16px;
      border: 1px solid #1f2937;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #0d1b2a 0%, #1a2332 100%);
      padding: 36px 40px;
      text-align: center;
      border-bottom: 1px solid #2d3748;
    }
    .logo-text {
      color: #d4af37;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0;
    }
    .sub-brand {
      color: #94a3b8;
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .content {
      padding: 40px 40px 32px 40px;
      text-align: center;
    }
    .headline {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .description {
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.6;
      margin: 0 0 28px 0;
    }
    .otp-container {
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 24px 20px;
      margin: 24px 0 28px 0;
      text-align: center;
    }
    .otp-label {
      color: #d4af37;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 12px;
      color: #ffffff;
      margin: 0;
      padding-left: 12px;
    }
    .meta-box {
      background-color: rgba(212, 175, 55, 0.08);
      border-left: 3px solid #d4af37;
      border-radius: 6px;
      padding: 12px 16px;
      text-align: left;
      margin-bottom: 24px;
    }
    .meta-text {
      color: #cbd5e1;
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
    }
    .warning {
      color: #64748b;
      font-size: 12px;
      line-height: 1.5;
      margin: 24px 0 0 0;
    }
    .footer {
      background-color: #0b0f19;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #1f2937;
    }
    .footer-text {
      color: #64748b;
      font-size: 12px;
      line-height: 1.6;
      margin: 0;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <table class="wrapper" role="presentation">
    <tr>
      <td align="center">
        <table class="main" role="presentation">
          <!-- Header -->
          <tr>
            <td class="header">
              <div class="logo-text">AL MUKAMMAL</div>
              <div class="sub-brand">Computer Trading LLC • Dubai, UAE</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="content">
              <h1 class="headline">${headline}</h1>
              <p class="description">${bodyContent}</p>
              
              <div class="otp-container">
                <div class="otp-label">Verification Code</div>
                <div class="otp-code">${otp}</div>
              </div>

              <div class="meta-box">
                <p class="meta-text">
                  ⏱️ <strong>Valid for ${expiryMinutes} minutes.</strong><br/>
                  🔒 For your security, this code can only be used once.
                </p>
              </div>

              <div class="meta-box" style="margin-top: 14px; border-left: 3px solid #f59e0b; background-color: rgba(245, 158, 11, 0.08); padding: 12px 14px; border-radius: 8px;">
                <p class="meta-text" style="color: #fbbf24; font-size: 13px; line-height: 1.5; margin: 0;">
                  📬 <strong>Delivery Tip:</strong> If this code appeared in your Spam or Junk folder, please mark it as <em>"Not Spam"</em> so your order confirmations and account alerts always reach your Primary inbox.
                </p>
              </div>

              <p class="warning">
                Never share this verification code with anyone. Al Mukammal staff will never ask for your code.
                If you did not initiate this request, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td class="footer">
              <p class="footer-text">
                © ${new Date().getFullYear()} ALMUKAMMAL COMPUTERS & REQUISITES TRADING L.L.C.<br>
                Deira, Dubai, United Arab Emirates • info@almukammal.ae
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Send an email using SMTP or simulated dev delivery
 */
export async function sendMail({ to, subject, html, text }) {
  const { from } = getCleanAuth();
  const transporter = getTransporter();

  if (!transporter) {
    console.error('[SMTP_DENIED] Cannot send verification email: SMTP credentials not set in environment (SMTP_HOST, SMTP_USER, SMTP_PASSWORD required).');
    return {
      success: false,
      error: 'Email delivery failed: SMTP email server is not configured. Please set SMTP credentials in your .env file to deliver verification codes.',
    };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(`[SMTP_SUCCESS] Verification email successfully delivered to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[SMTP_DELIVERY_FAILURE] Failed to deliver email to ${to}:`, error.message);
    return {
      success: false,
      error: `Email delivery failed: ${error.message || 'SMTP server connection error'}. Please check your email or SMTP configuration.`,
    };
  }
}

/**
 * Send Registration Verification OTP
 */
export async function sendRegistrationOtpEmail({ to, otp, expiryMinutes = 5 }) {
  const subject = `ALMUKAMMAL COMPUTERS — Your Verification Code: ${otp}`;
  const preheader = `Your 6-digit verification code is ${otp}. Valid for ${expiryMinutes} minutes.`;
  const headline = 'Verify Your Email Address';
  const bodyContent = 'Thank you for registering with ALMUKAMMAL COMPUTERS & REQUISITES TRADING L.L.C. Please use the verification code below to activate your account and verify your email address.';

  const html = generateEmailHtml({
    title: 'ALMUKAMMAL COMPUTERS — Verify Your Email',
    preheader,
    headline,
    bodyContent,
    otp,
    expiryMinutes,
  });

  const text = `ALMUKAMMAL COMPUTERS & REQUISITES TRADING L.L.C\n\nYour verification code is: ${otp}\n\nThis code will expire in ${expiryMinutes} minutes.\nNever share this code with anyone. If you did not request this, please ignore this email.`;

  return sendMail({ to, subject, html, text });
}

/**
 * Send Password Reset OTP
 */
export async function sendPasswordResetOtpEmail({ to, otp, expiryMinutes = 5 }) {
  const subject = `ALMUKAMMAL COMPUTERS — Password Reset Code: ${otp}`;
  const preheader = `Use verification code ${otp} to reset your Al Mukammal account password.`;
  const headline = 'Reset Your Password';
  const bodyContent = 'We received a request to reset your password for your account on ALMUKAMMAL COMPUTERS & REQUISITES TRADING L.L.C. Enter the verification code below to proceed with setting a new password.';

  const html = generateEmailHtml({
    title: 'ALMUKAMMAL COMPUTERS — Password Reset',
    preheader,
    headline,
    bodyContent,
    otp,
    expiryMinutes,
  });

  const text = `ALMUKAMMAL COMPUTERS & REQUISITES TRADING L.L.C\n\nYour password reset code is: ${otp}\n\nThis code will expire in ${expiryMinutes} minutes.\nNever share this code with anyone. If you did not request a password reset, please ignore this email.`;

  return sendMail({ to, subject, html, text });
}

/**
 * Send Email Change OTP
 */
export async function sendEmailChangeOtpEmail({ to, otp, expiryMinutes = 5 }) {
  const subject = `ALMUKAMMAL COMPUTERS — Email Verification Code: ${otp}`;
  const preheader = `Use code ${otp} to verify this new email address for your Al Mukammal account.`;
  const headline = 'Confirm New Email Address';
  const bodyContent = 'You have requested to update your email address on ALMUKAMMAL COMPUTERS & REQUISITES TRADING L.L.C. Please enter the verification code below to confirm this new address.';

  const html = generateEmailHtml({
    title: 'ALMUKAMMAL COMPUTERS — Verify New Email',
    preheader,
    headline,
    bodyContent,
    otp,
    expiryMinutes,
  });

  const text = `ALMUKAMMAL COMPUTERS & REQUISITES TRADING L.L.C\n\nYour email update verification code is: ${otp}\n\nThis code will expire in ${expiryMinutes} minutes.\nNever share this code with anyone.`;

  return sendMail({ to, subject, html, text });
}
