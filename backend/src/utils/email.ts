import nodemailer from 'nodemailer';

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporterPromise) {
    return transporterPromise;
  }

  const emailUser = (process.env.SMTP_USER || process.env.EMAIL_USER)?.trim();
  const emailPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS)?.replace(/\s+/g, '');
  const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = process.env.SMTP_SECURE === 'true';

  console.log('[Email] ========================================');
  console.log('[Email] Checking email configuration...');
  console.log('[Email] EMAIL_USER:', emailUser ? `${emailUser.substring(0, 3)}***` : 'NOT SET');
  console.log('[Email] EMAIL_PASS:', emailPass ? `***SET*** (length: ${emailPass.length})` : 'NOT SET');
  console.log('[Email] Full EMAIL_USER:', emailUser || 'NOT SET');
  console.log('[Email] ========================================');

  const hasSmtpCreds = !!(emailUser && emailPass);
  
  if (!hasSmtpCreds) {
    throw new Error('Email credentials not configured. EMAIL_USER and EMAIL_PASS must be set in .env file');
  }

  if (hasSmtpCreds) {
    console.log('[Email] Using Gmail SMTP configuration');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      debug: process.env.SMTP_DEBUG === 'true',
      logger: process.env.SMTP_DEBUG === 'true',
    });
    
    transporterPromise = Promise.resolve(transporter);
    
    // Verify connection synchronously to catch errors early
    try {
      await transporter.verify();
      console.log('[Email] ✅ Gmail SMTP connection verified successfully');
      console.log('[Email] Ready to send emails from:', emailUser);
    } catch (error: any) {
      console.error('[Email] ❌ Gmail SMTP verification failed!');
      console.error('[Email] Error:', error.message || error);
      console.error('[Email] Error code:', error.code);
      console.error('[Email] Response:', error.response);
      console.error('[Email] ⚠️  CRITICAL: Email sending will fail!');
      console.error('[Email] Please check:');
      console.error('[Email]   1. Gmail account has 2FA enabled');
      console.error('[Email]   2. App password is generated at: https://myaccount.google.com/apppasswords');
      console.error('[Email]   3. App password is correct (16 characters, no spaces)');
      console.error('[Email]   4. Copy the app password EXACTLY (no spaces)');
      console.error('[Email]   5. Restart backend server after updating .env');
      // Still create transporter, but it will fail when trying to send
    }
  }

  if (!transporterPromise) {
    throw new Error('Failed to initialize email transporter');
  }

  return transporterPromise;
}

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    console.log(`[Email] 📧 Attempting to send email to: ${to}`);
    console.log(`[Email] Subject: ${subject}`);
    
    const transporter = await getTransporter();
    
    // Priority: EMAIL_USER > EMAIL_FROM (extract email) > fallback
    let fromEmailAddress = (process.env.SMTP_USER || process.env.EMAIL_USER)?.trim();
    
    if (!fromEmailAddress) {
      // Try to extract from EMAIL_FROM if it exists
      const emailFrom = process.env.EMAIL_FROM?.trim() || '';
      // Remove quotes if present
      const cleanedFrom = emailFrom.replace(/^["']|["']$/g, '');
      // Extract email from format "Name <email>" or just use the value
      const fromEmailMatch = cleanedFrom.match(/<(.+)>/);
      fromEmailAddress = fromEmailMatch ? fromEmailMatch[1] : cleanedFrom;
    }
    
    // Fallback if still no email found
    if (!fromEmailAddress || fromEmailAddress === 'noreply@zeilalink.com') {
      fromEmailAddress = 'thaprinmohamett1333@gmail.com';
      console.warn('[Email] ⚠️  Using fallback email address. EMAIL_USER should be set in .env');
    }
    
    console.log(`[Email] Sending from: ${fromEmailAddress}`);
    
    const fromName = process.env.SMTP_FROM?.trim() || 'ZeilaLink';
    const mailOptions = {
      from: `"${fromName}" <${fromEmailAddress}>`,
      to,
      subject,
      html,
    };
    
    console.log('[Email] Mail options:', { ...mailOptions, html: '[HTML content]' });
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[Email] ✅ Email sent successfully! Message ID: ${info.messageId}`);
    
    // Log preview URL for ethereal usage
    const preview = (nodemailer as any).getTestMessageUrl?.(info);
    if (preview) {
      console.log('[Email] 📬 Preview URL (Ethereal):', preview);
      console.log('[Email] ⚠️  Note: This is a test email. Check the preview URL above.');
    }
    
    return info;
  } catch (error: any) {
    console.error('[Email] ❌ Email sending failed!');
    console.error('[Email] Error message:', error.message);
    console.error('[Email] Error code:', error.code);
    console.error('[Email] Error command:', error.command);
    console.error('[Email] Error response:', error.response);
    console.error('[Email] Error responseCode:', error.responseCode);
    
    // Common Gmail errors
    if (error.code === 'EAUTH') {
      console.error('[Email] 🔐 Authentication failed!');
      console.error('[Email] Possible causes:');
      console.error('[Email]   - Wrong email or password');
      console.error('[Email]   - Not using an App Password (if 2FA is enabled)');
      console.error('[Email]   - App Password not generated correctly');
      console.error('[Email]   - Account security settings blocking access');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('[Email] 🌐 Connection failed!');
      console.error('[Email] Check your internet connection and Gmail SMTP settings');
    } else if (error.responseCode === 535) {
      console.error('[Email] 🔐 Authentication failed (535)!');
      console.error('[Email] This usually means:');
      console.error('[Email]   - Wrong App Password');
      console.error('[Email]   - Need to enable "Less secure app access" (if not using App Password)');
    } else if (error.responseCode === 550) {
      console.error('[Email] 📬 Mailbox not found or access denied (550)');
    }
    
    throw error;
  }
};

export const sendVerificationEmail = async (email: string, code: string, userName: string) => {
  console.log(`[Email] ========================================`);
  console.log(`[Email] 📧 Sending verification email`);
  console.log(`[Email] To: ${email}`);
  console.log(`[Email] User: ${userName}`);
  console.log(`[Email] ========================================`);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f7e7a; margin-top: 0;">Welcome to ZeilaLink!</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Hello ${userName},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Thank you for registering! Please use the verification code below to verify your email address:
        </p>
        <div style="background-color: #f0f9f7; border: 2px solid #1f7e7a; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <p style="font-size: 32px; font-weight: bold; color: #1f7e7a; letter-spacing: 8px; margin: 0;">
            ${code}
          </p>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Best regards,<br>
          <strong>ZeilaLink Team</strong>
        </p>
      </div>
    </body>
    </html>
  `;
  
  try {
    await sendEmail(email, 'Verify your email - ZeilaLink', html);
    console.log(`[Email] ✅ Verification email sent successfully to ${email}`);
  } catch (error: any) {
    console.error(`[Email] ❌ FAILED to send verification email to ${email}`);
    console.error(`[Email] Error details:`, {
      message: error.message,
      code: error.code,
      responseCode: error.responseCode,
      response: error.response,
    });
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const html = `
    <h2>Reset Your Password</h2>
    <p>Please click the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>This link will expire in 1 hour.</p>
  `;
  await sendEmail(email, 'Reset Your Password - ZeilaLink', html);
};

export const sendPasswordResetOtpEmail = async (email: string, code: string, userName: string) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset OTP</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f7e7a; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Hello ${userName},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Use the OTP below to reset your password:
        </p>
        <div style="background-color: #f0f9f7; border: 2px solid #1f7e7a; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <p style="font-size: 32px; font-weight: bold; color: #1f7e7a; letter-spacing: 8px; margin: 0;">
            ${code}
          </p>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          This OTP expires in 10 minutes. If you didn't request a password reset, please ignore this email.
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Best regards,<br>
          <strong>ZeilaLink Team</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, 'Password Reset OTP - ZeilaLink', html);
};
