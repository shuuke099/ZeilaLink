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
  const escapedCode = escapeHtml(requireOneTimeCode(code));
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
          Hello ${escapedName},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Thank you for registering! Please use the verification code below to verify your email address:
        </p>
        <div style="background-color: #f0f9f7; border: 2px solid #1f7e7a; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <p style="font-size: 32px; font-weight: bold; color: #1f7e7a; letter-spacing: 8px; margin: 0;">
            ${escapedCode}
          </p>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          This code will expire in 10 minutes. If you didn&apos;t request this code, please ignore this email.
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Best regards,<br>
          <strong>ZeilaLink Team</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail(
    email,
    `Your ZeilaLink verification code: ${escapedCode}`,
    html,
  );
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
