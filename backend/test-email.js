// Quick email test script
// Run with: node test-email.js

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER?.trim();
const emailPass = process.env.EMAIL_PASS?.trim();

console.log('========================================');
console.log('Email Configuration Test');
console.log('========================================');
console.log('EMAIL_USER:', emailUser || 'NOT SET');
console.log('EMAIL_PASS:', emailPass ? `SET (length: ${emailPass.length})` : 'NOT SET');
console.log('========================================\n');

if (!emailUser || !emailPass) {
  console.error('❌ ERROR: EMAIL_USER or EMAIL_PASS not set in .env file');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

async function testEmail() {
  try {
    console.log('Testing Gmail SMTP connection...\n');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified successfully!\n');
    
    // Try sending test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"ZeilaLink" <${emailUser}>`,
      to: emailUser,
      subject: 'Test Email - ZeilaLink',
      html: '<h2>Test Email</h2><p>If you receive this, email configuration is working!</p>',
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\nCheck your inbox:', emailUser);
    
  } catch (error) {
    console.error('\n❌ Email test FAILED!\n');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Response Code:', error.responseCode);
    console.error('Response:', error.response);
    
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error('\n🔐 AUTHENTICATION ERROR');
      console.error('This means your Gmail App Password is wrong or not set up correctly.');
      console.error('\nTo fix:');
      console.error('1. Go to: https://myaccount.google.com/apppasswords');
      console.error('2. Generate App Password for "Mail"');
      console.error('3. Copy the 16-character password (NO SPACES)');
      console.error('4. Update EMAIL_PASS in .env file');
      console.error('5. Run this test again');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n🌐 CONNECTION ERROR');
      console.error('Cannot connect to Gmail SMTP server.');
      console.error('Check your internet connection.');
    }
    
    process.exit(1);
  }
}

testEmail();

