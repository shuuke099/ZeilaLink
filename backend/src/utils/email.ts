import nodemailer from 'nodemailer';

const DEFAULT_FROM_ADDRESS = 'noreply@zeilalink.com';
const DEFAULT_CONTACT_ADDRESS = 'contact@zeilalink.com';
const MAX_EMAIL_HTML_LENGTH = 1_000_000;

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const isValidEmailAddress = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const normalized = value.trim();
  return (
    normalized.length > 3 &&
    normalized.length <= 254 &&
    !/[\u0000-\u001f\u007f]/.test(normalized) &&
    /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(normalized)
  );
};

const requireEmailAddress = (value: unknown, label: string): string => {
  if (!isValidEmailAddress(value)) {
    throw new Error(`Invalid ${label} email address`);
  }
  return value.trim().toLowerCase();
};

const requireHeaderValue = (
  value: unknown,
  label: string,
  maxLength: number,
): string => {
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${label}`);
  }

  const normalized = value.trim();
  if (
    !normalized ||
    normalized.length > maxLength ||
    /[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    throw new Error(`Invalid ${label}`);
  }

  return normalized;
};

const safeErrorMetadata = (error: unknown) => {
  const candidate = error as {
    code?: unknown;
    command?: unknown;
    responseCode?: unknown;
  };

  return {
    code:
      typeof candidate?.code === 'string'
        ? candidate.code.slice(0, 40)
        : undefined,
    command:
      typeof candidate?.command === 'string'
        ? candidate.command.slice(0, 40)
        : undefined,
    responseCode:
      typeof candidate?.responseCode === 'number'
        ? candidate.responseCode
        : undefined,
  };
};

const emailServiceUnavailable = () =>
  new Error('Email service is currently unavailable');

const resolveFromAddress = (): string => {
  const configuredFrom = (
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER
  )?.trim();
  if (configuredFrom) {
    if (/[\u0000-\u001f\u007f]/.test(configuredFrom)) {
      throw new Error('Invalid EMAIL_FROM configuration');
    }

    const bracketedAddress = configuredFrom.match(/<([^<>]+)>\s*$/)?.[1];
    return requireEmailAddress(
      bracketedAddress || configuredFrom.replace(/^['"]|['"]$/g, ''),
      'sender',
    );
  }

  return DEFAULT_FROM_ADDRESS;
};

const resolveFrontendOrigin = (): string => {
  const configured = process.env.FRONTEND_URL?.trim();
  const fallback =
    process.env.NODE_ENV === 'production'
      ? 'https://zeilalink.com'
      : 'http://localhost:3000';

  let parsed: URL;
  try {
    parsed = new URL(configured || fallback);
  } catch {
    throw new Error('Invalid FRONTEND_URL configuration');
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('Invalid FRONTEND_URL configuration');
  }

  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
    throw new Error('FRONTEND_URL must use HTTPS in production');
  }

  return parsed.origin;
};

const requireOneTimeCode = (code: unknown): string => {
  const normalized = typeof code === 'string' ? code.trim() : '';
  if (!/^\d{6}$/.test(normalized)) {
    throw new Error('Invalid one-time code');
  }
  return normalized;
};

const safeDisplayName = (userName: unknown): string => {
  const normalized = typeof userName === 'string' ? userName.trim() : '';
  const withoutControlCharacters = normalized
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return escapeHtml((withoutControlCharacters || 'there').slice(0, 200));
};

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporterPromise) {
    return transporterPromise;
  }

  const emailUser = (process.env.SMTP_USER || process.env.EMAIL_USER)?.trim();
  const emailPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS)?.replace(
    /\s+/g,
    '',
  );

  if (!emailUser || !emailPass) {
    throw emailServiceUnavailable();
  }

  const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = process.env.SMTP_SECURE === 'true';

  if (
    !smtpHost ||
    /[\s\r\n]/.test(smtpHost) ||
    !Number.isInteger(smtpPort) ||
    smtpPort < 1 ||
    smtpPort > 65535
  ) {
    throw emailServiceUnavailable();
  }

  const pendingTransporter = (async () => {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      requireTLS: !smtpSecure,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
      tls: { minVersion: 'TLSv1.2' },
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    try {
      await transporter.verify();
      console.info('[Email] SMTP transport is ready');
      return transporter;
    } catch (error: unknown) {
      console.error(
        '[Email] SMTP transport verification failed',
        safeErrorMetadata(error),
      );
      throw emailServiceUnavailable();
    }
  })();

  transporterPromise = pendingTransporter;
  void pendingTransporter.catch(() => {
    // A transient verification failure must not poison every later send until
    // the process is restarted. The next request gets a fresh SMTP connection.
    if (transporterPromise === pendingTransporter) {
      transporterPromise = null;
    }
  });

  return transporterPromise;
}

const acceptedRecipientAddresses = (info: unknown): string[] => {
  const accepted = (info as { accepted?: unknown })?.accepted;
  if (!Array.isArray(accepted)) return [];

  return accepted
    .map((entry) => {
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object' && 'address' in entry) {
        const address = (entry as { address?: unknown }).address;
        return typeof address === 'string' ? address : '';
      }
      return '';
    })
    .filter(Boolean)
    .map((address) => address.trim().toLowerCase());
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  const recipient = requireEmailAddress(to, 'recipient');
  const safeSubject = requireHeaderValue(subject, 'email subject', 200);

  if (typeof html !== 'string' || !html || html.length > MAX_EMAIL_HTML_LENGTH) {
    throw new Error('Invalid email content');
  }

  try {
    const transporter = await getTransporter();
    const fromAddress = resolveFromAddress();
    const configuredFromName = process.env.SMTP_FROM?.match(/^\s*([^<]+?)\s*</)?.[1];
    const fromName = requireHeaderValue(
      configuredFromName?.trim() || 'ZeilaLink',
      'sender name',
      100,
    );

    const info = await transporter.sendMail({
      from: { name: fromName, address: fromAddress },
      to: recipient,
      subject: safeSubject,
      text: html
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim(),
      html,
    });

    const acceptedRecipients = acceptedRecipientAddresses(info);
    if (!acceptedRecipients.includes(recipient)) {
      throw new Error('SMTP did not accept the intended recipient');
    }

    console.info('[Email] Message accepted by SMTP', {
      acceptedRecipients: acceptedRecipients.length,
      messageId:
        typeof info?.messageId === 'string'
          ? info.messageId.slice(0, 200)
          : undefined,
    });
    return info;
  } catch (error: unknown) {
    // Recreate the transport after any failure. This covers dropped or stale
    // Gmail connections without retaining a bad transporter in memory.
    transporterPromise = null;
    console.error('[Email] Delivery failed', safeErrorMetadata(error));
    throw emailServiceUnavailable();
  }
};

export const sendVerificationEmail = async (
  email: string,
  code: string,
  userName: string,
) => {
  const escapedName = safeDisplayName(userName);
  const otp = requireOneTimeCode(code);
  const escapedCode = escapeHtml(otp);

  let origin = 'https://zeilalink.com';
  try {
    origin = resolveFrontendOrigin();
  } catch {
    // Keep the canonical production origin for footer links if config is invalid.
  }

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Verify your email</title>
  <style>
    @media only screen and (max-width:600px){
      .container{width:100% !important;}
      .px{padding-left:22px !important;padding-right:22px !important;}
      .h1{font-size:22px !important;line-height:30px !important;}
      .code{font-size:30px !important;letter-spacing:8px !important;}
      .stack{padding:22px !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef0f8;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#eef0f8;">
    Your ZeilaLink verification code is ${escapedCode}. It expires in 10 minutes.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef0f8;">
    <tr>
      <td align="center" style="padding:28px 14px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(11,18,53,0.08);">

          <!-- Brand header -->
          <tr>
            <td align="center" bgcolor="#5b21d1" style="background:linear-gradient(135deg,#5b21d1 0%,#4c1d95 100%);background-color:#5b21d1;padding:30px 24px 34px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <img src="${origin}/logo-white.png" alt="ZeilaLink" width="180" height="40" style="display:block;width:180px;height:40px;max-width:180px;outline:none;text-decoration:none;border:0;" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.4px;color:#ddd6fe;">Jobs &middot; Services &middot; Training &middot; Business</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="stack px" style="padding:36px 40px 8px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 14px;font-size:11px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:#7c5cd6;">Email verification</p>
              <h1 class="h1" style="margin:0 0 14px;font-size:26px;line-height:34px;font-weight:bold;color:#0b1235;">Welcome, ${escapedName}!</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#475569;">
                Thanks for signing up for ZeilaLink. Enter the 6-digit code below to verify your email address and activate your account.
              </p>

              <!-- Code box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
                <tr>
                  <td align="center" style="background-color:#f5f2ff;border:1px solid #ddd3fb;border-radius:14px;padding:26px 16px;">
                    <p class="code" style="margin:0;font-family:'Courier New',Courier,monospace;font-size:38px;line-height:40px;font-weight:bold;letter-spacing:12px;color:#4c1d95;">${escapedCode}</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 26px;">
                <tr>
                  <td align="center" style="background-color:#ede9fe;border-radius:999px;padding:7px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;color:#5b21d1;">&#9201;&nbsp; This code expires in 10 minutes</td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-size:13px;line-height:20px;color:#64748b;">
                Didn&apos;t create a ZeilaLink account? You can safely ignore this email &mdash; your address will remain unverified.
              </p>
              <p style="margin:0 0 4px;font-size:13px;line-height:20px;color:#64748b;">
                For your security, never share this code with anyone. ZeilaLink staff will never ask you for it.
              </p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td class="px" style="padding:18px 40px 30px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0;font-size:14px;line-height:22px;color:#475569;">
                Best regards,<br>
                <strong style="color:#0b1235;">The ZeilaLink Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#0b1235" style="background-color:#0b1235;padding:24px 40px;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${origin}" style="font-size:13px;font-weight:bold;color:#c4b5fd;text-decoration:none;">zeilalink.com</a>
                    <span style="color:#475569;padding:0 8px;">&bull;</span>
                    <a href="${origin}/contact" style="font-size:13px;color:#c4b5fd;text-decoration:none;">Help Center</a>
                    <span style="color:#475569;padding:0 8px;">&bull;</span>
                    <a href="mailto:contact@zeilalink.com" style="font-size:13px;color:#c4b5fd;text-decoration:none;">Contact us</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:11px;line-height:18px;color:#94a3b8;">
                    You received this email because an account was registered with this address.<br>
                    &copy; ${new Date().getFullYear()} ZeilaLink. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail(
    email,
    `Your ZeilaLink verification code: ${otp}`,
    html,
  );
};

export const sendWelcomeEmail = async (email: string, userName: string) => {
  const escapedName = safeDisplayName(userName);

  let origin = 'https://zeilalink.com';
  try {
    origin = resolveFrontendOrigin();
  } catch {
    // Keep the canonical production origin for links if config is invalid.
  }

  const featureRow = (
    icon: string,
    tint: string,
    title: string,
    body: string,
    href: string,
  ) => `
                <tr>
                  <td style="padding:10px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="46" valign="top" style="width:46px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr><td align="center" width="42" height="42" style="width:42px;height:42px;background-color:${tint};border-radius:11px;font-size:20px;line-height:42px;">${icon}</td></tr>
                          </table>
                        </td>
                        <td valign="top" style="padding-left:14px;font-family:Arial,Helvetica,sans-serif;">
                          <a href="${href}" style="font-size:15px;font-weight:bold;color:#0b1235;text-decoration:none;">${title}</a>
                          <p style="margin:4px 0 0;font-size:13px;line-height:20px;color:#64748b;">${body}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`;

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Welcome to ZeilaLink</title>
  <style>
    @media only screen and (max-width:600px){
      .container{width:100% !important;}
      .px{padding-left:22px !important;padding-right:22px !important;}
      .h1{font-size:22px !important;line-height:30px !important;}
      .stack{padding:26px 22px 8px !important;}
      .cta{display:block !important;width:100% !important;box-sizing:border-box !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef0f8;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#eef0f8;">
    Your email is verified. Welcome to ZeilaLink &mdash; explore jobs, services, training and the business directory.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef0f8;">
    <tr>
      <td align="center" style="padding:28px 14px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(11,18,53,0.08);">

          <!-- Brand header -->
          <tr>
            <td align="center" bgcolor="#5b21d1" style="background:linear-gradient(135deg,#5b21d1 0%,#4c1d95 100%);background-color:#5b21d1;padding:30px 24px 34px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <img src="${origin}/logo-white.png" alt="ZeilaLink" width="180" height="40" style="display:block;width:180px;height:40px;max-width:180px;outline:none;text-decoration:none;border:0;" />
                  </td>
                </tr>
                <tr><td align="center" style="padding-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.4px;color:#ddd6fe;">Jobs &middot; Services &middot; Training &middot; Business</td></tr>
              </table>
            </td>
          </tr>

          <!-- Verified banner -->
          <tr>
            <td align="center" bgcolor="#ecfdf5" style="background-color:#ecfdf5;padding:12px 24px;font-family:Arial,Helvetica,sans-serif;">
              <span style="font-size:13px;font-weight:bold;color:#047857;">&#10003;&nbsp; Your email address is now verified</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="stack px" style="padding:32px 40px 8px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 14px;font-size:11px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:#7c5cd6;">Welcome aboard</p>
              <h1 class="h1" style="margin:0 0 14px;font-size:26px;line-height:34px;font-weight:bold;color:#0b1235;">Welcome to ZeilaLink, ${escapedName}!</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#475569;">
                Your account is fully active. ZeilaLink connects Somali communities with opportunities &mdash; here&apos;s everything you can do right now.
              </p>

              <!-- Feature list -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
                ${featureRow('&#128188;', '#ede9fe', 'Find Jobs &amp; Careers', 'Browse and apply to verified job listings from employers across the region.', `${origin}/jobs`)}
                ${featureRow('&#128736;&#65039;', '#e0f2fe', 'Book Professional Services', 'Hire trusted local professionals for home, tech, beauty and business needs.', `${origin}/services`)}
                ${featureRow('&#127891;', '#fef3c7', 'Take Courses &amp; Training', 'Build practical skills with certified providers and earn certificates.', `${origin}/training`)}
                ${featureRow('&#127970;', '#dcfce7', 'Explore the Business Directory', 'Discover, call and get directions to verified local businesses near you.', `${origin}/businesses`)}
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 26px;">
                <tr>
                  <td align="center">
                    <a class="cta" href="${origin}" style="display:inline-block;background-color:#5b21d1;border-radius:12px;padding:14px 34px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Explore ZeilaLink</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-size:13px;line-height:20px;color:#64748b;">
                Need a hand getting started? Visit the <a href="${origin}/contact" style="color:#5b21d1;text-decoration:underline;">Help Center</a> or reply to <a href="mailto:contact@zeilalink.com" style="color:#5b21d1;text-decoration:underline;">contact@zeilalink.com</a>.
              </p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td class="px" style="padding:18px 40px 30px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0;font-size:14px;line-height:22px;color:#475569;">
                We&apos;re glad you&apos;re here,<br>
                <strong style="color:#0b1235;">The ZeilaLink Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#0b1235" style="background-color:#0b1235;padding:24px 40px;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${origin}" style="font-size:13px;font-weight:bold;color:#c4b5fd;text-decoration:none;">zeilalink.com</a>
                    <span style="color:#475569;padding:0 8px;">&bull;</span>
                    <a href="${origin}/contact" style="font-size:13px;color:#c4b5fd;text-decoration:none;">Help Center</a>
                    <span style="color:#475569;padding:0 8px;">&bull;</span>
                    <a href="mailto:contact@zeilalink.com" style="font-size:13px;color:#c4b5fd;text-decoration:none;">Contact us</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:11px;line-height:18px;color:#94a3b8;">
                    You received this email because you verified a ZeilaLink account.<br>
                    &copy; ${new Date().getFullYear()} ZeilaLink. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail(email, `Welcome to ZeilaLink, ${escapedName}!`, html);
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const normalizedToken = typeof token === 'string' ? token.trim() : '';
  if (
    !normalizedToken ||
    normalizedToken.length > 4096 ||
    /[\u0000-\u0020\u007f]/.test(normalizedToken)
  ) {
    throw new Error('Invalid password reset token');
  }

  const resetUrl = new URL('/reset-password', resolveFrontendOrigin());
  resetUrl.searchParams.set('token', normalizedToken);
  const escapedResetUrl = escapeHtml(resetUrl.toString());
  const html = `
    <h2>Reset Your Password</h2>
    <p>Please click the link below to reset your password:</p>
    <a href="${escapedResetUrl}">${escapedResetUrl}</a>
    <p>This link will expire in 1 hour.</p>
  `;
  await sendEmail(email, 'Reset Your Password - ZeilaLink', html);
};

export const sendPasswordResetOtpEmail = async (
  email: string,
  code: string,
  userName: string,
) => {
  const escapedName = safeDisplayName(userName);
  const escapedCode = escapeHtml(requireOneTimeCode(code));
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
          Hello ${escapedName},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Use the OTP below to reset your password:
        </p>
        <div style="background-color: #f0f9f7; border: 2px solid #1f7e7a; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <p style="font-size: 32px; font-weight: bold; color: #1f7e7a; letter-spacing: 8px; margin: 0;">
            ${escapedCode}
          </p>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          This OTP expires in 10 minutes. If you didn&apos;t request a password reset, please ignore this email.
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Best regards,<br>
          <strong>ZeilaLink Team</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(
    email,
    `Your ZeilaLink password reset code: ${escapedCode}`,
    html,
  );
};

export { DEFAULT_CONTACT_ADDRESS };
