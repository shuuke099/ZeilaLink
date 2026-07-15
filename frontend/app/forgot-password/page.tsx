'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from 'react-toastify';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';

function ForgotPasswordContent() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<'send' | 'otp' | 'password'>('send');
  const [loading, setLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [searchParams]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error(isEn ? 'Email is required' : 'Email waa qasab');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setStep('otp');
      toast.success(isEn ? 'OTP sent to your email' : 'OTP ayaa email-kaaga loo diray');
    } catch (err: any) {
      toast.error(extractErrorMessage(err, isEn ? 'Failed to send OTP' : 'Waa lagu fashilmay dirista OTP'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.trim().length !== 6) {
      toast.error(isEn ? 'Please enter a valid 6-digit OTP' : 'Fadlan geli OTP 6-lambar sax ah');
      return;
    }

    setVerifyingOtp(true);
    try {
      await api.post('/auth/verify-reset-otp', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });
      setStep('password');
      toast.success(isEn ? 'OTP verified. Set your new password.' : 'OTP waa la xaqiijiyay. Deji furahaaga cusub.');
    } catch (err: any) {
      toast.error(extractErrorMessage(err, isEn ? 'Invalid OTP' : 'OTP ma saxna'));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error(isEn ? 'Password must be at least 6 characters' : 'Furaha waa inuu ahaadaa ugu yaraan 6 xaraf');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(isEn ? 'Passwords do not match' : 'Furayaasha isma laha');
      return;
    }

    setResetting(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password: newPassword,
      });
      toast.success(isEn ? 'Password reset successful. Please login.' : 'Furaha si guul ah ayaa loo beddelay. Fadlan gal.');
      router.push('/login');
    } catch (err: any) {
      toast.error(extractErrorMessage(err, isEn ? 'Failed to reset password' : 'Waa lagu fashilmay beddelka furaha'));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex items-center justify-center py-20 px-4">
        <div className="card max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="text-white" size={30} />
            </div>
            <h1 className="text-3xl font-bold text-primary-darker">
              {isEn ? 'Forgot Password' : 'Furaha La Illaaway'}
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {isEn ? 'Reset with email OTP' : 'Ku beddel OTP email-ka'}
            </p>
          </div>

          {step === 'send' ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary-darker mb-2">
                  {isEn ? 'Email' : 'Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (isEn ? 'Sending...' : 'Waa la dirayaa...') : isEn ? 'Send OTP' : 'Dir OTP'}
              </button>
            </form>
          ) : step === 'otp' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                {isEn ? 'OTP sent to:' : 'OTP waxaa loo diray:'} <strong>{email}</strong>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-darker mb-2">
                  {isEn ? 'Enter OTP' : 'Geli OTP'}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field text-center tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              <button type="submit" disabled={verifyingOtp} className="btn-primary w-full">
                {verifyingOtp ? (isEn ? 'Verifying...' : 'Waa la xaqiijinayaa...') : isEn ? 'Verify OTP' : 'Xaqiiji OTP'}
              </button>

              <button
                type="button"
                onClick={() => void api.post('/auth/forgot-password', { email: email.trim().toLowerCase() })
                  .then(() => toast.success(isEn ? 'OTP resent' : 'OTP dib ayaa loo diray'))
                  .catch((err: any) => toast.error(extractErrorMessage(err, isEn ? 'Failed to resend OTP' : 'Waa lagu fashilmay dib u dirista OTP')))}
                disabled={loading}
                className="w-full text-sm text-primary hover:underline"
              >
                {isEn ? 'Resend OTP' : 'Dib u dir OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                {isEn ? 'OTP verified for:' : 'OTP waa la xaqiijiyay:'} <strong>{email}</strong>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-darker mb-2">
                  {isEn ? 'New Password' : 'Fure Cusub'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field pr-12"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-4 text-slate-500 hover:text-primary transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-darker mb-2">
                  {isEn ? 'Confirm New Password' : 'Xaqiiji Fure Cusub'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pr-12"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-4 text-slate-500 hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={resetting} className="btn-primary w-full">
                {resetting ? (isEn ? 'Resetting...' : 'Waa la beddelayaa...') : isEn ? 'Reset Password' : 'Beddel Furaha'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-primary-darker/70 mt-6">
            <Link href="/login" className="text-primary font-semibold hover:underline">
              {isEn ? 'Back to Login' : 'Ku laabo Galitaanka'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
