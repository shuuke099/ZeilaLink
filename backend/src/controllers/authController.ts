import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail, sendPasswordResetOtpEmail } from '../utils/email';
import { AuthRequest } from '../middleware/auth';

const passwordResetOtpStore = new Map<string, { code: string; expiresAt: number }>();

export const register = async (req: Request, res: Response) => {
  try {
    const {
      name,
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      address,
      location,
      preferredLanguage,
      avatarUrl,
    } = req.body;

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

    // Validate required fields
    if (!normalizedName || !email || !password || !normalizedPhone || !normalizedAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          firstName: !normalizedFirstName ? 'First name is required' : undefined,
          lastName: !normalizedLastName ? 'Last name is required' : undefined,
          name: !normalizedName ? 'Name is required' : undefined,
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined,
          phone: !normalizedPhone ? 'Phone number is required' : undefined,
          address: !normalizedAddress ? 'Address is required' : undefined,
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Validate role if provided
    if (role && !['worker', 'employer', 'provider', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be one of: worker, employer, provider, admin' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await prisma.user.create({
      data: {
        name: normalizedName,
        email,
        passwordHash,
        role: role || 'worker',
        phone: normalizedPhone,
        location: normalizedAddress,
        preferredLanguage: preferredLanguage || 'en',
        avatarUrl,
        isVerified: false,
        verificationToken: verificationCode,
        verificationExpires: expires,
      },
    });

    // Send verification email with code - REQUIRED for registration
    try {
      await sendVerificationEmail(user.email, verificationCode, user.name);
    } catch (emailError: any) {
      console.error(`[Auth] ❌ Failed to send verification email to ${user.email}`);
      console.error(`[Auth] Error:`, emailError.message || emailError);
      console.error(`[Auth] Error code:`, emailError.code);
      console.error(`[Auth] Response code:`, emailError.responseCode);

      // Delete the user since email failed
      await prisma.user.delete({ where: { id: user.id } });
      
      // Return detailed error to help debug
      const errorMessage = emailError.responseCode === 535 
        ? 'Email authentication failed. Please check Gmail App Password configuration.'
        : emailError.responseCode === 550
        ? 'Email sending failed. Please check email configuration.'
        : emailError.message || 'Failed to send verification email';
      
      // Always return error details to help debug
      const errorDetails: any = {
        error: 'Registration failed: Could not send verification email',
        message: errorMessage,
      };
      
      // Add detailed error info for debugging
      if (emailError.code) errorDetails.code = emailError.code;
      if (emailError.responseCode) errorDetails.responseCode = emailError.responseCode;
      if (emailError.response) errorDetails.response = emailError.response;
      if (emailError.command) errorDetails.command = emailError.command;
      
      // Add helpful message based on error type
      if (emailError.code === 'EAUTH' || emailError.responseCode === 535) {
        errorDetails.help = 'Gmail authentication failed. Please check your App Password in .env file. Make sure you are using a Gmail App Password (not your regular password). Generate one at: https://myaccount.google.com/apppasswords';
      } else if (emailError.code === 'ECONNECTION' || emailError.code === 'ETIMEDOUT') {
        errorDetails.help = 'Cannot connect to Gmail SMTP server. Check your internet connection.';
      } else {
        errorDetails.help = 'Check backend console logs for detailed error information.';
      }
      
      console.error('[Auth] Full email error object:', JSON.stringify(errorDetails, null, 2));
      
      return res.status(503).json(errorDetails);
    }

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification code.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Registration error:', error);
    console.error('[Auth] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    
    // Handle Prisma validation errors
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Handle Prisma constraint errors
    if (error.code && error.code.startsWith('P')) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.meta || error.message 
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Registration failed',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Email not verified. Please verify to continue.' });
    }

    // Generate token once verified
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        avatarUrl: (user as any).avatarUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { code, email } = req.body;

    if (!code || !email) {
      return res.status(400).json({ error: 'Verification code and email are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    if (user.verificationToken !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (user.verificationExpires && user.verificationExpires < new Date()) {
      return res.status(400).json({ error: 'Verification code expired' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null, verificationExpires: null },
    });

    const token = generateToken(user.id);

    res.json({ 
      message: 'Email verified successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Verification failed' });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ message: 'If email exists, verification sent' });
    if (user.isVerified) return res.json({ message: 'Already verified' });

    // Generate new 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: verificationCode, verificationExpires: expires },
    });

    try {
      await sendVerificationEmail(user.email, verificationCode, user.name);
      res.json({ message: 'Verification email sent' });
    } catch (emailError: any) {
      console.error(`[Auth] Failed to resend verification email to ${user.email}:`, emailError);
      res.status(500).json({ 
        error: 'Failed to send verification email. Please check email configuration.',
        details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }
  } catch (error: any) {
    console.error('[Auth] Resend verification error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id || req.user?.id;
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
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id || req.user?.id;
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

    const normalizeText = (value: unknown) =>
      typeof value === 'string' ? value.trim() : '';
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
              applicationId: normalizeText(entry?.applicationId) || null,
            };
          })
          .filter(Boolean)
      : [];

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
              isVerified: Boolean(entry?.isVerified),
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
          ...(avatarUrl !== undefined && { avatarUrl: normalizeText(avatarUrl) || null }),
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

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If email exists, reset code sent' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    passwordResetOtpStore.set(email, { code: resetCode, expiresAt });

    try {
      await sendPasswordResetOtpEmail(email, resetCode, user.name);
    } catch (emailError: any) {
      console.error('[Auth] Forgot password email error:', emailError);
      return res.status(500).json({ error: 'Failed to send reset code email' });
    }

    res.json({
      message: 'If email exists, reset code sent',
      ...(process.env.NODE_ENV !== 'production' && {
        devResetCode: resetCode,
      }),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password, email, otp } = req.body;

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Preferred flow: email + otp + password
    if (email && otp) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const normalizedOtp = String(otp).trim();
      const otpData = passwordResetOtpStore.get(normalizedEmail);

      if (!otpData) {
        return res.status(400).json({ error: 'Invalid or expired reset code' });
      }

      if (Date.now() > otpData.expiresAt) {
        passwordResetOtpStore.delete(normalizedEmail);
        return res.status(400).json({ error: 'Reset code expired' });
      }

      if (otpData.code !== normalizedOtp) {
        return res.status(400).json({ error: 'Invalid reset code' });
      }

      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      passwordResetOtpStore.delete(normalizedEmail);
      return res.json({ message: 'Password reset successful' });
    }

    // Backward-compatible flow: token + password
    if (!token) {
      return res.status(400).json({ error: 'Reset token or OTP details are required' });
    }
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { passwordHash },
    });

    res.json({ message: 'Password reset successful' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyResetOtp = async (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const otpData = passwordResetOtpStore.get(email);
    if (!otpData) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    if (Date.now() > otpData.expiresAt) {
      passwordResetOtpStore.delete(email);
      return res.status(400).json({ error: 'Reset code expired' });
    }

    if (otpData.code !== otp) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    return res.json({ message: 'OTP verified' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to verify OTP' });
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
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
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

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: error.message || 'Failed to change password' });
  }
};

// Upload avatar
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the file path - use public folder
    const filename = req.file.filename;
    const avatarUrl = `/uploads/public/${filename}`;

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

    res.json({ 
      message: 'Avatar uploaded successfully',
      user,
      avatarUrl 
    });
  } catch (error: any) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload avatar' });
  }
};
