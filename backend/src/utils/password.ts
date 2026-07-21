import bcrypt from "bcryptjs";

export const PASSWORD_HASH_ROUNDS = 12;
export const MINIMUM_PASSWORD_LENGTH = 12;
export const MAXIMUM_PASSWORD_BYTES = 72;

export const validatePassword = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return "Password is required";
  }

  if (value.length < MINIMUM_PASSWORD_LENGTH) {
    return `Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters`;
  }

  if (Buffer.byteLength(value, "utf8") > MAXIMUM_PASSWORD_BYTES) {
    return `Password must not exceed ${MAXIMUM_PASSWORD_BYTES} UTF-8 bytes`;
  }

  return null;
};

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

export const verifyPassword = (
  password: string,
  passwordHash: string,
): Promise<boolean> => bcrypt.compare(password, passwordHash);

export const passwordHashNeedsUpgrade = (passwordHash: string): boolean => {
  try {
    return bcrypt.getRounds(passwordHash) < PASSWORD_HASH_ROUNDS;
  } catch {
    return true;
  }
};
