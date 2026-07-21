import { Request, Response } from 'express';
import prisma from '../config/database';
import { clearAuthCookie, generateToken, setAuthCookie } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetOtpEmail } from '../utils/email';
import { AuthRequest } from '../middleware/auth';
import { generateOtp, hashOtp, verifyOtp } from '../utils/otp';
import {
  hashPassword,
  passwordHashNeedsUpgrade,
  validatePassword,
  verifyPassword,
} from '../utils/password';
import {
  getUploadKey,
  ownedPublicUploadKeyFromUrl,
  publicUrlForKey,
  removeStoredUpload,
  validateStoredFile,
} from '../config/aws';
import {
  identifierFingerprint,
  recordAuditEvent,
  requestAuditMeta,
} from '../utils/audit';

const MAXIMUM_OTP_ATTEMPTS = 5;
const DUMMY_PASSWORD_HASH =
  '$2a$12$x1eDZ8jc/ae4vJkAZhUF9Oo4cN3hnnprme8jUbrxnQ8uXPy6yZHgy';
const PUBLIC_REGISTRATION_ROLES = new Set(['worker', 'employer', 'provider']);
const CURRENT_TERMS_VERSION = '2026-07-20';
const CURRENT_PRIVACY_VERSION = '2026-07-20';
const COMPROMISED_LEGACY_PASSWORDS = new Set([
  'admin123',
  'worker123',
  'employee123',
  'employer123',
  'provider123',
]);

const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const passwordResetToken = (email: string, code: string, attempts = 0): string =>
  `${attempts}.${hashOtp('password-reset', email, code)}`;

const emailVerificationToken = (email: string, code: string, attempts = 0): string =>
  `${attempts}.${hashOtp('email-verification', email, code)}`;

const parsePasswordResetToken = (
  token: string | null,
): { attempts: number; codeHash: string } | null => {
  if (!token) return null;
  const match = token.match(/^(\d+)\.(hmac-sha256:[a-f0-9]{64})$/);
  if (!match) return null;
  const attempts = Number(match[1]);
  return Number.isSafeInteger(attempts) && attempts >= 0
    ? { attempts, codeHash: match[2] }
    : null;
};

const parseEmailVerificationToken = (
  token: string | null,
): { attempts: number; codeHash: string } | null => {
  if (!token) return null;
  const statefulMatch = token.match(/^(\d+)\.(hmac-sha256:[a-f0-9]{64})$/);
  if (statefulMatch) {
    const attempts = Number(statefulMatch[1]);
    return Number.isSafeInteger(attempts) && attempts >= 0
      ? { attempts, codeHash: statefulMatch[2] }
      : null;
  }
  return /^hmac-sha256:[a-f0-9]{64}$/.test(token)
    ? { attempts: 0, codeHash: token }
    : null;
};

const registerFailedOtpAttempt = async (
  userId: string,
  currentToken: string,
  attempts: number,
  codeHash: string,
): Promise<void> => {
  const nextAttempts = attempts + 1;
  await prisma.user.updateMany({
    where: { id: userId, verificationToken: currentToken },
    data:
      nextAttempts >= MAXIMUM_OTP_ATTEMPTS
        ? { verificationToken: null, verificationExpires: null }
        : { verificationToken: `${nextAttempts}.${codeHash}` },
  });
};

const isSafeProfileUrl = (value: string): boolean => {
  if (!value) return true;
  if (value.startsWith('/')) {
    return !value.startsWith('//') && !value.includes('\\');
  }
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const {
      name,
      firstName,
      lastName,
      email,
      password,
      role,
      organizationName,
      phone,
      address,
      location,
      preferredLanguage,
      avatarUrl,
      acceptedTerms,
    } = req.body;

    if (acceptedTerms !== true) {
      return res.status(400).json({ error: 'Terms and Privacy Policy acceptance is required' });
    }

    const normalizedFirstName = typeof firstName === 'string' ? firstName.trim() : '';
    const normalizedLastName = typeof lastName === 'string' ? lastName.trim() : '';
    const normalizedName =
      typeof name === 'string' && name.trim().length > 0
        ? name.trim()
        : `${normalizedFirstName} ${normalizedLastName}`.trim();
    const normalizedAddress =
      typeof address === 'string' && address.trim().length > 0
        ? address.trim()
        : typeof location === 'string' && location.trim().length > 0
        ? location.trim()
        : undefined;
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
    const normalizedAvatarUrl = typeof avatarUrl === 'string' ? avatarUrl.trim() : '';
    const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : 'worker';
    const normalizedOrganizationName =
      typeof organizationName === 'string' ? organizationName.trim() : '';

    if (!PUBLIC_REGISTRATION_ROLES.has(normalizedRole)) {
      return res.status(400).json({ error: 'Invalid public registration role' });
    }

    const organizationNameRequired =
      normalizedRole === 'employer' || normalizedRole === 'provider';

    // Validate required fields
    if (
      !normalizedName ||
      !email ||
      !password ||
      !normalizedPhone ||
      (organizationNameRequired && !normalizedOrganizationName)
    ) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          firstName: !normalizedFirstName ? 'First name is required' : undefined,
          lastName: !normalizedLastName ? 'Last name is required' : undefined,
          name: !normalizedName ? 'Name is required' : undefined,
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined,
          phone: !normalizedPhone ? 'Phone number is required' : undefined,
          organizationName:
            organizationNameRequired && !normalizedOrganizationName
              ? normalizedRole === 'employer'
                ? 'Company name is required'
                : 'Training provider name is required'
              : undefined,
        }
      });
    }

    const normalizedEmail = normalizeEmail(email);

    if (
      normalizedName.length > 200 ||
      normalizedOrganizationName.length > 200 ||
      normalizedEmail.length > 254 ||
      normalizedPhone.length > 50 ||
      (normalizedAddress?.length || 0) > 500
    ) {
      return res.status(400).json({ error: 'One or more account fields are too long' });
    }
    if (preferredLanguage !== undefined && !['en', 'so'].includes(preferredLanguage)) {
      return res.status(400).json({ error: 'Invalid preferred language' });
    }
    if (normalizedAvatarUrl && !isSafeProfileUrl(normalizedAvatarUrl)) {
      return res.status(400).json({ error: 'Invalid avatar URL' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // Run the same expensive password hashing work for existing and new
    // addresses so registration cannot be used as a fast account oracle.
    const passwordHash = await hashPassword(password);

    // Existing accounts receive the same public response without another email.
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(202).json({
        message: 'If this address can be registered, a verification email will arrive shortly.',
      });
    }

    // Generate 6-digit verification code
    const verificationCode = generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          name: normalizedName,
          email: normalizedEmail,
          passwordHash,
          role: normalizedRole as 'worker' | 'employer' | 'provider',
          phone: normalizedPhone,
          location: normalizedAddress || null,
          preferredLanguage: preferredLanguage || 'en',
          avatarUrl: normalizedAvatarUrl || null,
          isVerified: false,
          verificationToken: emailVerificationToken(normalizedEmail, verificationCode),
          verificationExpires: expires,
        },
      });

      if (normalizedRole === 'employer') {
        await transaction.employer.create({
          data: {
            userId: createdUser.id,
            name: normalizedOrganizationName,
            address: normalizedAddress || null,
            verified: false,
          },
        });
      } else if (normalizedRole === 'provider') {
        await transaction.provider.create({
          data: {
            contactUserId: createdUser.id,
            name: normalizedOrganizationName,
            verified: false,
          },
        });
      }

      return createdUser;
    });

    let verificationDelivered = true;
    try {
      await sendVerificationEmail(user.email, verificationCode, user.name);
    } catch (_emailError: unknown) {
      console.error('[Auth] Registration verification delivery failed');
      // Keep the pending account so the user can retry from the verification
      // screen without losing the organization profile awaiting approval.
      verificationDelivered = false;
    }

    recordAuditEvent({
      userId: user.id,
      action: 'account_registered',
      resourceType: 'user',
      resourceId: user.id,
      meta: {
        role: user.role,
        result: 'success',
        verificationDelivery: verificationDelivered ? 'sent' : 'pending_retry',
        acceptedPolicies: {
          terms: CURRENT_TERMS_VERSION,
          privacy: CURRENT_PRIVACY_VERSION,
        },
        ...requestAuditMeta(req),
      },
    });

    if (!verificationDelivered) {
      return res.status(503).json({
        error:
          'Your account was created, but the verification email could not be sent. Please use Resend Code.',
        code: 'VERIFICATION_DELIVERY_FAILED',
      });
    }

    res.status(202).json({
      message: 'If this address can be registered, a verification email will arrive shortly.',
    });
  } catch (error: any) {
    const databaseCode = typeof error?.code === 'string' ? error.code : undefined;
    console.error('[Auth] Registration failed', databaseCode ? { databaseCode } : undefined);
    
    // Handle Prisma validation errors
    if (databaseCode === 'P2002') {
      return res.status(202).json({
        message: 'If this address can be registered, a verification email will arrive shortly.',
      });
    }
    
    // Handle Prisma constraint errors
    if (databaseCode?.startsWith('P')) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: 'The submitted account data is invalid'
      });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (email.length > 254 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        employer: { select: { verified: true } },
        provider: { select: { verified: true } },
      },
    });

    // Always run bcrypt so unknown accounts and incorrect passwords have
    // comparable response timing and return the same public error.
    const isValid = await verifyPassword(
      password,
      user?.passwordHash || DUMMY_PASSWORD_HASH,
    );
    if (!user || !isValid) {
      recordAuditEvent({
        action: 'login_failed',
        resourceType: 'session',
        meta: {
          identifier: identifierFingerprint(email),
          result: 'invalid_credentials',
          ...requestAuditMeta(req),
        },
      });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (COMPROMISED_LEGACY_PASSWORDS.has(password)) {
      recordAuditEvent({
        userId: user.id,
        action: 'login_blocked_compromised_password',
        resourceType: 'session',
        resourceId: user.id,
        meta: { result: 'password_reset_required', ...requestAuditMeta(req) },
      });
      return res.status(403).json({
        error: 'This password is no longer permitted. Reset your password to continue.',
        code: 'PASSWORD_RESET_REQUIRED',
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Email not verified. Please verify to continue.',
        code: 'EMAIL_VERIFICATION_REQUIRED',
      });
    }

    let activePasswordHash = user.passwordHash;
    if (passwordHashNeedsUpgrade(user.passwordHash)) {
      activePasswordHash = await hashPassword(password);
      const rehashResult = await prisma.user.updateMany({
        where: { id: user.id, passwordHash: user.passwordHash },
        data: { passwordHash: activePasswordHash },
      });
      if (rehashResult.count !== 1) {
        recordAuditEvent({
          userId: user.id,
          action: 'login_failed',
          resourceType: 'session',
          resourceId: user.id,
          meta: { result: 'credentials_changed_during_login', ...requestAuditMeta(req) },
        });
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    // Generate token once verified
    const token = generateToken(user.id, activePasswordHash);
    setAuthCookie(res, token);
    res.set('Cache-Control', 'no-store');

    const organizationApproved =
      user.role === 'employer'
        ? Boolean(user.employer?.verified)
        : user.role === 'provider'
          ? Boolean(user.provider?.verified)
          : true;

    recordAuditEvent({
      userId: user.id,
      action: 'login_succeeded',
      resourceType: 'session',
      resourceId: user.id,
      meta: { result: 'success', ...requestAuditMeta(req) },
    });
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        avatarUrl: (user as any).avatarUrl,
        organizationApproved,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Unable to sign in' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        preferredLanguage: true,
        avatarUrl: true,
        phone: true,
        employer: { select: { verified: true } },
        provider: { select: { verified: true } },
      },
    });

    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({ error: 'Invalid session' });
    }

    const organizationApproved =
      user.role === 'employer'
        ? Boolean(user.employer?.verified)
        : user.role === 'provider'
          ? Boolean(user.provider?.verified)
          : true;

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        organizationApproved,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to load session' });
  }
};

export const getSession = (req: AuthRequest, res: Response) => {
  res.set('Cache-Control', 'no-store');

  if (!req.user) {
    return res.json({ user: null });
  }

  return getCurrentUser(req, res);
};

export const logout = (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.set('Cache-Control', 'no-store');
  return res.json({ message: 'Logged out successfully' });
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';

    if (!code || !email) {
      return res.status(400).json({ error: 'Verification code and email are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    if (user.isVerified) {
      return res.json({ message: 'Email verification is complete' });
    }

    const verificationState = parseEmailVerificationToken(user.verificationToken);
    if (!user.verificationToken || !verificationState) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    if (user.verificationExpires && user.verificationExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    if (
      verificationState.attempts >= MAXIMUM_OTP_ATTEMPTS ||
      !verifyOtp(verificationState.codeHash, 'email-verification', email, code)
    ) {
      await registerFailedOtpAttempt(
        user.id,
        user.verificationToken,
        verificationState.attempts,
        verificationState.codeHash,
      );
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const verificationResult = await prisma.user.updateMany({
      where: {
        id: user.id,
        isVerified: false,
        verificationToken: user.verificationToken,
        verificationExpires: { gt: new Date() },
      },
      data: { isVerified: true, verificationToken: null, verificationExpires: null },
    });
    if (verificationResult.count !== 1) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const token = generateToken(user.id, user.passwordHash);
    setAuthCookie(res, token);
    res.set('Cache-Control', 'no-store');

    recordAuditEvent({
      userId: user.id,
      action: 'email_verified',
      resourceType: 'user',
      resourceId: user.id,
      meta: { result: 'success', ...requestAuditMeta(req) },
    });

    res.json({ 
      message: 'Email verified successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        organizationApproved:
          user.role === 'employer' || user.role === 'provider' ? false : true,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: 'Verification failed' });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ message: 'If email exists, verification sent' });
    if (user.isVerified) return res.json({ message: 'If verification is required, an email was sent' });

    // Generate new 6-digit verification code
    const verificationCode = generateOtp();
    const verificationToken = emailVerificationToken(email, verificationCode);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpires: expires,
      },
    });

    try {
      await sendVerificationEmail(user.email, verificationCode, user.name);
      recordAuditEvent({
        userId: user.id,
        action: 'verification_email_requested',
        resourceType: 'user',
        resourceId: user.id,
        meta: { result: 'smtp_accepted', ...requestAuditMeta(req) },
      });
      return res.json({
        message: 'If verification is required, a code will arrive shortly',
      });
    } catch (_emailError: unknown) {
      await prisma.user.updateMany({
        where: { id: user.id, verificationToken },
        data: { verificationToken: null, verificationExpires: null },
      });
      console.error('[Auth] Verification email delivery failed');
      recordAuditEvent({
        userId: user.id,
        action: 'verification_email_requested',
        resourceType: 'user',
        resourceId: user.id,
        meta: { result: 'delivery_failed', ...requestAuditMeta(req) },
      });
      return res.status(503).json({
        error: 'Verification email could not be sent. Please try again shortly.',
      });
    }
  } catch (_error: unknown) {
    console.error('[Auth] Resend verification request failed');
    res.status(500).json({ error: 'Unable to process verification request' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id || req.user?.id;
    if (!req.user || !userId || (userId !== req.user.id && req.user.role !== 'admin')) {
      return res.status(404).json({ error: 'User not found' });
    }
    const prismaAny = prisma as any;

    const user = await prismaAny.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        location: true,
        bio: true,
        avatarUrl: true,
        preferredLanguage: true,
        isVerified: true,
        createdAt: true,
        workerExperiences: {
          orderBy: { startDate: 'desc' },
        },
        workerEducations: {
          orderBy: { createdAt: 'desc' },
        },
        workerLanguages: {
          orderBy: { createdAt: 'asc' },
        },
        workerPreference: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id || req.user?.id;
    if (!req.user || !userId || (userId !== req.user.id && req.user.role !== 'admin')) {
      return res.status(404).json({ error: 'User not found' });
    }
    const {
      name,
      phone,
      location,
      bio,
      preferredLanguage,
      avatarUrl,
      experiences,
      educations,
      languages,
      preferences,
    } = req.body;

    if (
      (Array.isArray(experiences) && experiences.length > 50) ||
      (Array.isArray(educations) && educations.length > 50) ||
      (Array.isArray(languages) && languages.length > 25)
    ) {
      return res.status(400).json({ error: 'Profile contains too many entries' });
    }

    const normalizeText = (value: unknown) =>
      typeof value === 'string' ? value.trim() : '';
    const normalizedAvatarUrl =
      avatarUrl === undefined ? undefined : normalizeText(avatarUrl) || null;
    const asDate = (value: unknown): Date | null => {
      if (!value || typeof value !== 'string') return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const parsedExperiences = Array.isArray(experiences)
      ? experiences
          .map((entry: any) => {
            const jobTitle = normalizeText(entry?.jobTitle);
            const company = normalizeText(entry?.company);
            const startDate = asDate(entry?.startDate);
            const endDate = asDate(entry?.endDate);
            const isCurrent = Boolean(entry?.isCurrent);

            if (!jobTitle || !company || !startDate) return null;
            return {
              jobTitle,
              company,
              startDate,
              endDate: isCurrent ? null : endDate,
              isCurrent,
              achievements: normalizeText(entry?.achievements) || null,
              // Application relationships are server-owned and must never be
              // attached from a profile payload.
              applicationId: null,
            };
          })
          .filter(Boolean)
      : [];

    if (avatarUrl !== undefined && !isSafeProfileUrl(normalizeText(avatarUrl))) {
      return res.status(400).json({ error: 'Invalid avatar URL' });
    }

    const previousAvatar =
      avatarUrl !== undefined
        ? await prisma.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true },
          })
        : null;

    const unsafeCertificate = Array.isArray(educations)
      ? educations.some((entry: any) => {
          const value = normalizeText(entry?.certificateUrl);
          return value && !isSafeProfileUrl(value);
        })
      : false;
    if (unsafeCertificate) {
      return res.status(400).json({ error: 'Invalid certificate URL' });
    }

    const parsedEducations = Array.isArray(educations)
      ? educations
          .map((entry: any) => {
            const degreeLevel = normalizeText(entry?.degreeLevel);
            const institution = normalizeText(entry?.institution);
            if (!degreeLevel || !institution) return null;
            return {
              degreeLevel,
              institution,
              fieldOfStudy: normalizeText(entry?.fieldOfStudy) || null,
              certificationName: normalizeText(entry?.certificationName) || null,
              certificateUrl: normalizeText(entry?.certificateUrl) || null,
              startDate: asDate(entry?.startDate),
              endDate: asDate(entry?.endDate),
              // Only an administrative verification workflow may set this.
              isVerified: false,
            };
          })
          .filter(Boolean)
      : [];

    const parsedLanguages = Array.isArray(languages)
      ? languages
          .map((entry: any) => {
            const language = normalizeText(entry?.language);
            const level = normalizeText(entry?.level);
            if (!language || !level) return null;
            return { language, level };
          })
          .filter(Boolean)
      : [];

    const preferenceInput = preferences && typeof preferences === 'object' ? preferences : null;
    const salaryMinRaw = preferenceInput ? Number((preferenceInput as any).desiredSalaryMin) : NaN;
    const salaryMaxRaw = preferenceInput ? Number((preferenceInput as any).desiredSalaryMax) : NaN;
    const parsedPreferences = preferenceInput
      ? {
          employmentType: normalizeText((preferenceInput as any).employmentType) || null,
          shiftPreference: normalizeText((preferenceInput as any).shiftPreference) || null,
          desiredSalaryMin: Number.isFinite(salaryMinRaw) ? Math.round(salaryMinRaw) : null,
          desiredSalaryMax: Number.isFinite(salaryMaxRaw) ? Math.round(salaryMaxRaw) : null,
        }
      : null;

    const hasSomali = parsedLanguages.some((item: any) => {
      const lang = item.language.toLowerCase();
      const lvl = item.level.toLowerCase();
      return lang.includes('somali') && (lvl === 'fluent' || lvl === 'native');
    });
    const hasEnglish = parsedLanguages.some((item: any) => {
      const lang = item.language.toLowerCase();
      const lvl = item.level.toLowerCase();
      return lang.includes('english') && (lvl === 'fluent' || lvl === 'native');
    });
    const derivedPreferredLanguage =
      normalizeText(preferredLanguage) ||
      (hasSomali ? 'so' : hasEnglish ? 'en' : null);

    const prismaAny = prisma as any;
    const user = await prismaAny.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(name && { name: normalizeText(name) }),
          ...(phone !== undefined && { phone: normalizeText(phone) || null }),
          ...(location !== undefined && { location: normalizeText(location) || null }),
          ...(bio !== undefined && { bio }),
          ...(derivedPreferredLanguage && { preferredLanguage: derivedPreferredLanguage }),
          ...(avatarUrl !== undefined && { avatarUrl: normalizedAvatarUrl }),
        },
      });

      if (Array.isArray(experiences)) {
        await tx.workerExperience.deleteMany({ where: { userId } });
        if (parsedExperiences.length > 0) {
          await tx.workerExperience.createMany({
            data: parsedExperiences.map((entry: any) => ({ ...entry, userId })),
          });
        }
      }

      if (Array.isArray(educations)) {
        await tx.workerEducation.deleteMany({ where: { userId } });
        if (parsedEducations.length > 0) {
          await tx.workerEducation.createMany({
            data: parsedEducations.map((entry: any) => ({ ...entry, userId })),
          });
        }
      }

      if (Array.isArray(languages)) {
        await tx.workerLanguage.deleteMany({ where: { userId } });
        if (parsedLanguages.length > 0) {
          await tx.workerLanguage.createMany({
            data: parsedLanguages.map((entry: any) => ({ ...entry, userId })),
          });
        }
      }

      if (parsedPreferences) {
        await tx.workerPreference.upsert({
          where: { userId },
          update: parsedPreferences,
          create: {
            userId,
            ...parsedPreferences,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          location: true,
          bio: true,
          avatarUrl: true,
          preferredLanguage: true,
          workerExperiences: {
            orderBy: { startDate: 'desc' },
          },
          workerEducations: {
            orderBy: { createdAt: 'desc' },
          },
          workerLanguages: {
            orderBy: { createdAt: 'asc' },
          },
          workerPreference: true,
        },
      });
    });

    if (
      previousAvatar?.avatarUrl &&
      previousAvatar.avatarUrl !== normalizedAvatarUrl
    ) {
      const previousAvatarKey = ownedPublicUploadKeyFromUrl(
        previousAvatar.avatarUrl,
        userId,
      );
      const currentAvatarKey = ownedPublicUploadKeyFromUrl(
        normalizedAvatarUrl,
        userId,
      );
      if (previousAvatarKey && previousAvatarKey !== currentAvatarKey) {
        await removeStoredUpload(previousAvatarKey).catch(() => {
          console.error('Previous avatar cleanup failed');
        });
      }
    }

    res.json(user);
  } catch (_error: unknown) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.isVerified) {
      // Don't reveal if user exists
      return res.status(202).json({
        message: 'If a verified account exists, a reset code will arrive shortly',
      });
    }

    const resetCode = generateOtp();
    const resetToken = passwordResetToken(email, resetCode);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: resetToken,
        verificationExpires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    try {
      await sendPasswordResetOtpEmail(email, resetCode, user.name);
    } catch {
      await prisma.user.updateMany({
        where: { id: user.id, verificationToken: resetToken },
        data: { verificationToken: null, verificationExpires: null },
      });
      console.error('[Auth] Password reset email delivery failed');
      recordAuditEvent({
        userId: user.id,
        action: 'password_reset_requested',
        resourceType: 'user',
        resourceId: user.id,
        meta: { result: 'delivery_failed', ...requestAuditMeta(req) },
      });
      return res.status(503).json({
        error: 'Reset code could not be sent. Please try again shortly.',
      });
    }

    recordAuditEvent({
      userId: user.id,
      action: 'password_reset_requested',
      resourceType: 'user',
      resourceId: user.id,
      meta: { result: 'smtp_accepted', ...requestAuditMeta(req) },
    });
    return res.status(202).json({
      message: 'If a verified account exists, a reset code will arrive shortly',
    });
  } catch {
    res.status(500).json({ error: 'Unable to process password reset request' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { password, email, otp } = req.body;

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedOtp = typeof otp === 'string' ? otp.trim() : '';
    if (!normalizedEmail || !normalizedOtp) {
      return res.status(400).json({ error: 'Email, reset code, and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const resetToken = user?.verificationToken || null;
    const otpData = parsePasswordResetToken(resetToken);
    if (!user || !resetToken || !otpData) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    if (!user.verificationExpires || user.verificationExpires <= new Date()) {
      await prisma.user.updateMany({
        where: { id: user.id, verificationToken: resetToken },
        data: { verificationToken: null, verificationExpires: null },
      });
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    if (
      otpData.attempts >= MAXIMUM_OTP_ATTEMPTS ||
      !verifyOtp(otpData.codeHash, 'password-reset', normalizedEmail, normalizedOtp)
    ) {
      await registerFailedOtpAttempt(
        user.id,
        resetToken,
        otpData.attempts,
        otpData.codeHash,
      );
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    const passwordHash = await hashPassword(password);
    const updateResult = await prisma.user.updateMany({
      where: {
        id: user.id,
        verificationToken: resetToken,
        verificationExpires: { gt: new Date() },
      },
      data: {
        passwordHash,
        verificationToken: null,
        verificationExpires: null,
      },
    });
    if (updateResult.count !== 1) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    clearAuthCookie(res);
    recordAuditEvent({
      userId: user.id,
      action: 'password_reset_completed',
      resourceType: 'user',
      resourceId: user.id,
      meta: { result: 'success', ...requestAuditMeta(req) },
    });
    return res.json({ message: 'Password reset successful' });
  } catch {
    res.status(500).json({ error: 'Unable to reset password' });
  }
};

export const verifyResetOtp = async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const resetToken = user?.verificationToken || null;
    const otpData = parsePasswordResetToken(resetToken);
    if (!user || !resetToken || !otpData) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    if (!user.verificationExpires || user.verificationExpires <= new Date()) {
      await prisma.user.updateMany({
        where: { id: user.id, verificationToken: resetToken },
        data: { verificationToken: null, verificationExpires: null },
      });
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    if (
      otpData.attempts >= MAXIMUM_OTP_ATTEMPTS ||
      !verifyOtp(otpData.codeHash, 'password-reset', email, otp)
    ) {
      await registerFailedOtpAttempt(
        user.id,
        resetToken,
        otpData.attempts,
        otpData.codeHash,
      );
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    return res.json({ message: 'OTP verified' });
  } catch (_error: unknown) {
    return res.status(500).json({ error: 'Failed to verify reset code' });
  }
};

// Update user profile (name only)
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        location: true,
        bio: true,
        avatarUrl: true,
        preferredLanguage: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    console.error('[Auth] Profile update failed', {
      errorType: typeof error?.name === 'string' ? error.name : 'Error',
      code: typeof error?.code === 'string' ? error.code : undefined,
    });
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (Buffer.byteLength(String(currentPassword), 'utf8') > 72) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Compare-and-swap prevents an in-flight old-password request from
    // overwriting a concurrent password reset or administrative credential change.
    const updateResult = await prisma.user.updateMany({
      where: { id: req.user.id, passwordHash: user.passwordHash },
      data: { passwordHash },
    });
    if (updateResult.count !== 1) {
      clearAuthCookie(res);
      recordAuditEvent({
        userId: req.user.id,
        action: 'password_change_rejected',
        resourceType: 'user',
        resourceId: req.user.id,
        meta: { result: 'credentials_changed_concurrently', ...requestAuditMeta(req) },
      });
      return res.status(409).json({
        error: 'Your credentials changed during this request. Sign in again.',
      });
    }

    clearAuthCookie(res);

    recordAuditEvent({
      userId: req.user.id,
      action: 'password_changed',
      resourceType: 'user',
      resourceId: req.user.id,
      meta: { result: 'success', ...requestAuditMeta(req) },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('[Auth] Password change failed', {
      errorType: typeof error?.name === 'string' ? error.name : 'Error',
      code: typeof error?.code === 'string' ? error.code : undefined,
    });
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Upload avatar
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  let key: string | null = null;
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    key = getUploadKey(req, req.file);
    if (!(await validateStoredFile(req.file.path, 'public-image', req.file.mimetype))) {
      await removeStoredUpload(key);
      return res.status(400).json({ error: 'The image content is invalid' });
    }
    const avatarUrl = publicUrlForKey(key);
    const previousAvatar = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatarUrl: true },
    });
    if (!previousAvatar) {
      await removeStoredUpload(key);
      key = null;
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user's avatar URL
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        location: true,
        bio: true,
        avatarUrl: true,
        preferredLanguage: true,
      },
    });
    const uploadedKey = key;
    key = null;

    const previousAvatarKey = ownedPublicUploadKeyFromUrl(
      previousAvatar.avatarUrl,
      req.user.id,
    );
    if (previousAvatarKey && previousAvatarKey !== uploadedKey) {
      await removeStoredUpload(previousAvatarKey).catch(() => {
        console.error('Previous avatar cleanup failed');
      });
    }

    res.json({ 
      message: 'Avatar uploaded successfully',
      user,
      avatarUrl 
    });
  } catch (error: any) {
    if (key) await removeStoredUpload(key).catch(() => undefined);
    console.error('Upload avatar failed', {
      errorType: typeof error?.name === 'string' ? error.name : 'Error',
      status: error?.status === 413 ? 413 : 500,
    });
    const status = error?.status === 413 ? 413 : 500;
    res.status(status).json({
      error: status === 413 ? 'Upload storage quota exceeded' : 'Failed to upload avatar',
    });
  }
};
