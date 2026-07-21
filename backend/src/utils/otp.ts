import { createHmac, randomInt, timingSafeEqual } from "crypto";

const getOtpSecret = (): string => {
  const isProduction = process.env.NODE_ENV === "production";
  const configuredOtpSecret = process.env.OTP_SECRET?.trim();
  const jwtSecret = process.env.JWT_SECRET?.trim();
  const secret = isProduction
    ? configuredOtpSecret
    : configuredOtpSecret || jwtSecret;
  const minimumBytes = isProduction ? 32 : 16;
  if (!secret || Buffer.byteLength(secret, "utf8") < minimumBytes) {
    throw new Error(
      `OTP_SECRET must contain at least ${minimumBytes} bytes`,
    );
  }
  if (isProduction && secret === jwtSecret) {
    throw new Error("OTP_SECRET must be different from JWT_SECRET in production");
  }
  if (["secret", "changeme", "development"].includes(secret.toLowerCase())) {
    throw new Error("OTP_SECRET uses a known insecure value");
  }
  return secret;
};

export const assertOtpConfiguration = (): void => {
  void getOtpSecret();
};

export const generateOtp = (): string =>
  randomInt(100000, 1000000).toString();

export const hashOtp = (
  purpose: "email-verification" | "password-reset",
  email: string,
  code: string,
): string => {
  const digest = createHmac("sha256", getOtpSecret())
    .update(`${purpose}:${email.trim().toLowerCase()}:${code}`)
    .digest("hex");
  return `hmac-sha256:${digest}`;
};

const safeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
};

export const verifyOtp = (
  storedValue: string | null | undefined,
  purpose: "email-verification" | "password-reset",
  email: string,
  suppliedCode: string,
): boolean => {
  if (!storedValue || !/^\d{6}$/.test(suppliedCode)) return false;

  if (storedValue.startsWith("hmac-sha256:")) {
    return safeEqual(storedValue, hashOtp(purpose, email, suppliedCode));
  }
  return false;
};
