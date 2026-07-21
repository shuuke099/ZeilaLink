import { NextFunction, Request, Response, Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate, optionalAuthenticate, requireSelfOrAdmin } from '../middleware/auth';
import rateLimit from 'express-rate-limit';
import { publicImageUpload } from '../config/aws';
import { createHash } from 'crypto';

const router = Router();

const emailRateLimitKey = (req: Request) =>
  createHash('sha256')
    .update(String(req.body?.email || 'missing').trim().toLowerCase())
    .digest('hex');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts. Please try again later.' },
});

const loginAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: emailRateLimitKey,
  message: { error: 'Too many login attempts. Please try again later.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again later.' },
});

const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification requests. Please try again later.' },
});

const resendVerificationAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailRateLimitKey,
  message: { error: 'Too many verification requests. Please try again later.' },
});

const otpVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many code attempts. Please try again later.' },
});

const otpAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: emailRateLimitKey,
  message: { error: 'Too many code attempts. Please try again later.' },
});

const passwordResetRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Please try again later.' },
});

const passwordResetRequestAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailRateLimitKey,
  message: { error: 'Too many password reset requests. Please try again later.' },
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many password reset attempts. Please try again later.' },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many upload attempts. Please try again later.' },
});

const uploadAvatar = (req: Request, res: Response, next: NextFunction) => {
  publicImageUpload.single('avatar')(req, res, (error: any) => {
    if (!error) return next();
    const status = error.status || 400;
    return res.status(status).json({
      error:
        status === 413
          ? 'Upload storage quota exceeded. Delete unused files before uploading again.'
          : status >= 500
            ? 'Avatar upload failed'
            : 'Only valid image files are allowed',
    });
  });
};

router.post('/login', loginLimiter, loginAccountLimiter, authController.login);
router.post('/register', registerLimiter, authController.register);
router.post('/verify-email', otpVerificationLimiter, otpAccountLimiter, authController.verifyEmail);
router.post(
  '/resend-verification',
  resendVerificationLimiter,
  resendVerificationAccountLimiter,
  authController.resendVerification,
);
router.get('/session', optionalAuthenticate, authController.getSession);
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/logout', authController.logout);
router.get('/users/:id/profile', authenticate, requireSelfOrAdmin('id'), authController.getProfile);
router.put('/users/:id', authenticate, requireSelfOrAdmin('id'), authController.updateProfile);
router.post(
  '/forgot-password',
  passwordResetRequestLimiter,
  passwordResetRequestAccountLimiter,
  authController.forgotPassword,
);
router.post('/verify-reset-otp', otpVerificationLimiter, otpAccountLimiter, authController.verifyResetOtp);
router.post('/reset-password', passwordResetLimiter, otpAccountLimiter, authController.resetPassword);

// New routes for profile management
router.put('/profile', authenticate, authController.updateUserProfile);
router.put('/change-password', authenticate, authController.changePassword);
router.post('/upload-avatar', authenticate, uploadLimiter, uploadAvatar, authController.uploadAvatar);

export default router;
