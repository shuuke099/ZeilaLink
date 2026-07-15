'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { t } from '@/lib/translations';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { updateUser } = useAuth();
  const getT = (key: string) => t(key, language);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get('email') || '');
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(
      () => setResendCooldown((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setStatus('error');
      setMessage(language === 'en' ? 'Enter your email address first' : 'Marka hore geli email-kaaga');
      return;
    }

    try {
      setResending(true);
      setResendMessage('');
      await api.post('/auth/resend-verification', { email: normalizedEmail });
      setResendCooldown(60);
      setResendMessage(
        language === 'en'
          ? 'A new verification code was sent to your email.'
          : 'Lambar xaqiijin cusub ayaa laguugu soo diray email-kaaga.',
      );
    } catch (error: any) {
      setResendMessage(
        error.response?.data?.error ||
          (language === 'en'
            ? 'Could not resend the code. Please try again.'
            : 'Lambarka dib looma diri karin. Fadlan isku day mar kale.'),
      );
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !code) {
      setStatus('error');
      setMessage(language === 'en' ? 'Please enter both email and verification code' : 'Fadlan geli email iyo lambarka xaqiijinta');
      return;
    }

    if (code.length !== 6) {
      setStatus('error');
      setMessage(language === 'en' ? 'Verification code must be 6 digits' : 'Lambarka xaqiijinta waa inuu yahay 6 lambar');
      return;
    }

    try {
      setStatus('verifying');
      const response = await api.post('/auth/verify-email', { email, code });
      setStatus('success');
      setMessage(language === 'en' ? 'Email verified successfully! Redirecting to your dashboard...' : 'Email-ka si guul ah ayaa loo xaqiijiyay! Waa la wareegayaa dashboard-kaga...');
      
      // Store token and user if provided
      if (response.data.token && response.data.user) {
        updateUser(response.data.user, response.data.token);
        
        // Redirect to appropriate dashboard based on user role
        const userRole = response.data.user.role;
        let dashboardPath = '/';
        
        switch (userRole) {
          case 'admin':
            dashboardPath = '/admin';
            break;
          case 'employer':
            dashboardPath = '/employer';
            break;
          case 'provider':
            dashboardPath = '/provider';
            break;
          case 'worker':
            dashboardPath = '/worker';
            break;
          default:
            dashboardPath = '/';
        }
        
        setTimeout(() => router.push(dashboardPath), 2000);
      } else {
        setTimeout(() => router.push('/'), 2000);
      }
    } catch (e: any) {
      setStatus('error');
      setMessage(e.response?.data?.error || (language === 'en' ? 'Verification failed' : 'Xaqiijintu way fashilantay'));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center py-20 px-4">
        <div className="card max-w-md w-full">
          <h1 className="text-2xl font-bold text-primary-darker mb-6 text-center">
            {language === 'en' ? 'Verify Your Email' : 'Xaqiiji Email-kaga'}
          </h1>
          
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary-darker mb-2">
                {language === 'en' ? 'Email Address' : 'Cinwaanka Email-ka'}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={language === 'en' ? 'Enter your email' : 'Geli email-kaga'}
                required
                disabled={status === 'verifying' || status === 'success'}
              />
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-primary-darker mb-2">
                {language === 'en' ? 'Verification Code' : 'Lambarka Xaqiijinta'}
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
                maxLength={6}
                required
                disabled={status === 'verifying' || status === 'success'}
              />
              <p className="text-xs text-gray-500 mt-1">
                {language === 'en' ? 'Enter the 6-digit code sent to your email' : 'Geli lambarka 6-lambar ah ee loo diray email-kaga'}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-muted">
                  {language === 'en' ? "Didn't receive the code?" : 'Lambarka ma helin?'}
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0 || status === 'success'}
                  className="text-sm font-semibold text-primary transition-colors hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resending
                    ? language === 'en' ? 'Sending...' : 'Waa la dirayaa...'
                    : resendCooldown > 0
                      ? `${language === 'en' ? 'Resend in' : 'Dib u dir'} ${resendCooldown}s`
                      : language === 'en' ? 'Resend Code' : 'Dib u Dir Lambarka'}
                </button>
              </div>
              {resendMessage && (
                <p className="mt-2 text-xs font-medium text-primary-dark" role="status">
                  {resendMessage}
                </p>
              )}
            </div>

            {status === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'verifying' || status === 'success'}
              className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-darker disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'verifying' 
                ? (language === 'en' ? 'Verifying...' : 'Waa la xaqiijinayaa...')
                : (language === 'en' ? 'Verify Email' : 'Xaqiiji Email-ka')
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


