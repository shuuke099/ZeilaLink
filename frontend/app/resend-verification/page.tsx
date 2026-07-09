'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';

export default function ResendVerificationPage() {
  const { language } = useLanguage();
  const getT = (key: string) => t(key, language);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      setLoading(true);
      await api.post('/auth/resend-verification', { email });
      setMessage(language === 'en' ? 'Verification email sent if the account exists.' : 'Haddii akoonku jiro, email xaqiijin ayaa la diray.');
    } catch (e: any) {
      setError(e.response?.data?.error || (language === 'en' ? 'Failed to send verification email' : 'Dirista email-ka xaqiijinta way fashilantay'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-md w-full"
        >
          <h1 className="text-2xl font-bold text-primary-darker mb-6">
            {language === 'en' ? 'Resend Verification' : 'Dib u Dir Xaqiijin'}
          </h1>
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-darker mb-2">
                {language === 'en' ? 'Email Address' : 'Cinwaanka Email'}
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
              {loading ? getT('loading') : (language === 'en' ? 'Send' : 'Dir')}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}


