import Twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM; // e.g., +15005550006 or whatsapp:+14155238886

let twilioClient: Twilio.Twilio | null = null;

function getClient() {
  if (!accountSid || !authToken) return null;
  if (!twilioClient) {
    twilioClient = Twilio(accountSid, authToken);
  }
  return twilioClient;
}

export async function sendSms(to: string, body: string): Promise<void> {
  const client = getClient();
  if (!client || !fromNumber) {
    // SMS not configured; no-op
    return;
  }
  await client.messages.create({ to, from: fromNumber, body });
}





