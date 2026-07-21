// Sends one controlled message through the same SMTP configuration as the app.
// Run from backend with: npm run email:test

const path = require('path');
const nodemailer = require('nodemailer');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const emailUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
const emailPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').replace(
  /\s+/g,
  '',
);
const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === 'true';
const configuredFrom = (
  process.env.SMTP_FROM ||
  process.env.EMAIL_FROM ||
  emailUser
).trim();
const fromAddress = configuredFrom.match(/<([^<>]+)>\s*$/)?.[1] || configuredFrom;
const fromName = configuredFrom.match(/^\s*([^<]+?)\s*</)?.[1]?.trim() || 'ZeilaLink';
const recipient = (process.argv[2] || emailUser).trim().toLowerCase();

const validEmail = (value) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);

if (
  !emailUser ||
  !emailPass ||
  !validEmail(fromAddress) ||
  !validEmail(recipient) ||
  !Number.isInteger(smtpPort) ||
  smtpPort < 1 ||
  smtpPort > 65535
) {
  console.error('[Email test] SMTP configuration or recipient is invalid');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  requireTLS: !smtpSecure,
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
  socketTimeout: 30_000,
  tls: { minVersion: 'TLSv1.2' },
  auth: { user: emailUser, pass: emailPass },
});

async function testEmail() {
  console.log('[Email test] Verifying SMTP authentication and TLS...');
  await transporter.verify();

  const info = await transporter.sendMail({
    from: { name: fromName, address: fromAddress },
    to: recipient,
    subject: `ZeilaLink SMTP delivery test ${new Date().toISOString()}`,
    text: 'ZeilaLink SMTP is configured correctly. This is a delivery test, not an OTP.',
    html: '<p><strong>ZeilaLink SMTP is configured correctly.</strong></p><p>This is a delivery test, not an OTP.</p>',
  });

  const accepted = Array.isArray(info.accepted)
    ? info.accepted.map((address) => String(address).trim().toLowerCase())
    : [];
  if (!accepted.includes(recipient)) {
    throw new Error('SMTP did not accept the test recipient');
  }

  console.log('[Email test] Gmail accepted the message', {
    acceptedRecipients: accepted.length,
    messageId: info.messageId,
  });
}

testEmail()
  .catch((error) => {
    console.error('[Email test] Failed', {
      code: error?.code,
      command: error?.command,
      responseCode: error?.responseCode,
    });
    process.exitCode = 1;
  })
  .finally(() => transporter.close());
