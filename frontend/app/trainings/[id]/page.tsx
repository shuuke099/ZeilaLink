'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { GraduationCap, Clock, DollarSign, Building2, Star, Award, MapPin, Calendar, Users, Mail, Phone, CheckCircle2, Monitor, User as UserIcon, BookOpen, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { getSafeMailtoUrl, getSafeStoredUrl, getSafeTelUrl } from '@/lib/safeUrl';

interface Training {
  id: string;
  name: string;
  description: string;
  duration: string;
  cost: number;
  provider: {
    id: string;
    name: string;
    logoUrl?: string | null;
    description?: string | null;
    rating?: number | null;
    verified?: boolean | null;
    user?: {
      email?: string;
      phone?: string;
    };
  };
  imageUrl?: string | null;
  providesCertificate?: boolean;
  certificateUrl?: string | null;
  isEnrolled?: boolean;
  skill?: {
    name: string;
  };
  // Additional fields that might be in description or metadata
  location?: string;
  schedule?: string;
  startDate?: string;
  availableSeats?: number;
  learningOutcomes?: string[];
  requirements?: string[];
  format?: 'Online' | 'In-Person' | 'Hybrid';
}

export default function TrainingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState('');
  const getT = (key: string) => t(key, language);

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/trainings/${params?.id}`);
        const payload = res.data?.training ?? res.data;
        setTraining(payload || null);
        setEnrolled(Boolean(payload?.isEnrolled));
      } catch (e) {
        console.error('Failed to load training', e);
      } finally {
        setLoading(false);
      }
    };
    if (params?.id) fetchTraining();
  }, [params?.id]);

  const enroll = async () => {
    try {
      setError('');
      const response = await api.post(`/trainings/${params?.id}/enroll`);
      setEnrolled(true);

      // Show success message
      if (response.data) {
        console.log('Successfully enrolled in training:', response.data);
      }
    } catch (e: any) {
      const message = e?.response?.data?.error || e?.response?.data?.message || 'Failed to enroll';
      if (message?.toLowerCase().includes('already enrolled')) {
        setEnrolled(true);
        setError(language === 'en'
          ? 'You are already enrolled in this training.'
          : 'Horey aad isqortay tababarkan.');
      } else {
        setError(message);
      }
    }
  };

  const handleEnrollClick = () => {
    const trainingId = params?.id;
    if (!trainingId || typeof trainingId !== 'string') return;

    if (!user) {
      router.push(`/login?redirect=/trainings/${trainingId}`);
      return;
    }

    enroll();
  };

  // Parse learning outcomes from description if not provided
  const parseLearningOutcomes = (desc: string): string[] => {
    const outcomes: string[] = [];
    const lines = desc.split('\n');
    let inLearningSection = false;
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('what you will learn') || lowerLine.includes('learning outcomes') || lowerLine.includes('you will learn')) {
        inLearningSection = true;
        continue;
      }
      if (inLearningSection && (line.trim().match(/^[-•*]\s+/) || line.trim().match(/^\d+\.\s+/) || line.trim().startsWith('•'))) {
        outcomes.push(line.trim().replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '').replace(/^•\s+/, ''));
      }
      if (inLearningSection && line.trim() === '') {
        inLearningSection = false;
      }
    }
    // Fallback: if no section found, look for any bullet points
    if (outcomes.length === 0) {
      for (const line of lines) {
        if (line.trim().match(/^[-•*]\s+/) || line.trim().match(/^\d+\.\s+/) || line.trim().startsWith('•')) {
          outcomes.push(line.trim().replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '').replace(/^•\s+/, ''));
        }
      }
    }
    return outcomes;
  };

  // Parse requirements from description
  const parseRequirements = (desc: string): string[] => {
    const requirements: string[] = [];
    const lines = desc.split('\n');
    let inRequirementsSection = false;
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('requirements') || lowerLine.includes('prerequisites') || lowerLine.includes('what you need')) {
        inRequirementsSection = true;
        continue;
      }
      if (inRequirementsSection && (line.trim().match(/^[-•*]\s+/) || line.trim().match(/^\d+\.\s+/) || line.trim().startsWith('•'))) {
        requirements.push(line.trim().replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '').replace(/^•\s+/, ''));
      }
      if (inRequirementsSection && line.trim() === '' && requirements.length > 0) {
        break;
      }
    }
    return requirements;
  };

  // Determine training format from location
  const getTrainingFormat = (): 'Online' | 'In-Person' | 'Hybrid' => {
    if (training?.format) return training.format;
    const location = training?.location?.toLowerCase() || '';
    if (location.includes('online') || location === '' || location.includes('virtual')) {
      return 'Online';
    }
    if (location.includes('hybrid') || location.includes('both')) {
      return 'Hybrid';
    }
    return 'In-Person';
  };

  const learningOutcomes = training?.learningOutcomes || (training?.description ? parseLearningOutcomes(training.description) : []);
  const requirements = training?.requirements || (training?.description ? parseRequirements(training.description) : []);
  const trainingFormat = getTrainingFormat();
  const providerEmail = training?.provider?.user?.email;
  const providerPhone = training?.provider?.user?.phone;
  const providerEmailUrl = getSafeMailtoUrl(providerEmail);
  const providerPhoneUrl = getSafeTelUrl(providerPhone);
  const safeCertificateUrl = getSafeStoredUrl(training?.certificateUrl);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-primary-darker/70">{getT('loading')}</p>
          </div>
        ) : !training ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-primary-darker/70">
              {language === 'en' ? 'Training not found.' : 'Tababar lama helin.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header section full width */}
            <section className="rounded-3xl bg-white p-8 shadow-lg shadow-primary/5">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-4 items-start">
                  {training.provider?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={training.provider.logoUrl}
                      alt={training.provider.name}
                      className="h-16 w-16 rounded-full object-cover shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'h-16 w-16 rounded-full bg-primary-light text-primary flex items-center justify-center text-2xl font-bold shrink-0';
                          fallback.textContent = training.provider?.name?.charAt(0)?.toUpperCase() ?? '?';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary-light text-primary flex items-center justify-center text-2xl font-bold shrink-0">
                      {training.provider?.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-primary-darker">{training.name}</h1>
                    <p className="mt-1 text-primary-darker/70 flex items-center gap-1 flex-wrap">
                      {training.provider?.name}{' '}
                      <span className="mx-2 text-primary/60">•</span>
                      {training.provider?.rating && training.provider.rating > 0 ? (
                        <>
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span>{training.provider.rating.toFixed(1)}</span>
                        </>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">New</span>
                      )}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        <Clock className="mr-1 h-4 w-4" />
                        {training.duration}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-primary-darker/5 px-3 py-1 text-xs font-medium text-primary-darker/80">
                        <DollarSign className="mr-1 h-4 w-4" />
                        {training.cost === 0
                          ? (language === 'en' ? 'Free' : 'Bilaash')
                          : `$${training.cost}`}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-primary-darker/5 px-3 py-1 text-xs font-medium text-primary-darker/80">
                        {trainingFormat === 'Online' ? (
                          <Monitor className="mr-1 h-4 w-4" />
                        ) : trainingFormat === 'Hybrid' ? (
                          <GraduationCap className="mr-1 h-4 w-4" />
                        ) : (
                          <UserIcon className="mr-1 h-4 w-4" />
                        )}
                        {trainingFormat === 'Online'
                          ? (language === 'en' ? 'Online' : 'Internetka')
                          : trainingFormat === 'Hybrid'
                            ? (language === 'en' ? 'Hybrid' : 'Isdhexgalka')
                            : (language === 'en' ? 'In-Person' : 'Goobta')}
                      </span>
                      {training.skill && (
                        <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                          {training.skill.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-stretch gap-2 md:w-48 shrink-0">
                  <button
                    onClick={handleEnrollClick}
                    className="btn-primary w-full justify-center text-base"
                    disabled={enrolled}
                  >
                    {enrolled
                      ? (language === 'en' ? '✓ Enrolled' : '✓ Waa la Qortay')
                      : (language === 'en' ? 'Enroll Now' : 'Isqori Hadda')}
                  </button>
                  {!enrolled && (
                    <p className="text-center text-xs text-primary-darker/60">
                      {language === 'en'
                        ? 'Click to enroll in this training program'
                        : 'Guji si aad isku qorto barnaamijkan'}
                    </p>
                  )}
                  {error && (
                    <div className="mt-1 text-red-600 text-xs text-center">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Main Layout Grid */}
            <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
              <div className="space-y-8">
                {training.imageUrl && (
                  <div className="rounded-3xl overflow-hidden shadow-soft h-56 sm:h-72 lg:h-80 relative bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={training.imageUrl}
                      alt={training.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* About Section */}
                <section className="rounded-3xl bg-white p-8 shadow-lg shadow-primary/5">
                  <h2 className="text-xl font-semibold text-primary-darker">
                    {language === 'en' ? 'About This Program' : 'Ku Saabsan Barnaamijkan'}
                  </h2>
                  <div className="mt-4 space-y-4 text-primary-darker/80 leading-relaxed whitespace-pre-line">
                    {training.description}
                  </div>
                </section>

                {/* What You Will Learn Section */}
                {learningOutcomes.length > 0 && (
                  <section className="rounded-3xl bg-white p-8 shadow-lg shadow-primary/5">
                    <h2 className="text-xl font-semibold text-primary-darker mb-4">
                      {language === 'en' ? 'What You Will Learn' : 'Waxaad Baran Doontaa'}
                    </h2>
                    <ul className="space-y-3 text-primary-darker/80">
                      {learningOutcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                          <span className="leading-relaxed">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Requirements Section */}
                {requirements.length > 0 && (
                  <section className="rounded-3xl bg-white p-8 shadow-lg shadow-primary/5">
                    <h2 className="text-xl font-semibold text-primary-darker mb-4">
                      {language === 'en' ? 'Requirements' : 'Shuruudaha'}
                    </h2>
                    <ul className="space-y-3 text-primary-darker/80">
                      {requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="mt-1.5 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary" />
                          <span className="leading-relaxed">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Instructor/Provider Information Card */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-soft sticky top-24">
                  <h2 className="text-xl font-bold text-primary-darker mb-4 flex items-center gap-2">
                    <UserIcon size={20} className="text-primary" />
                    {language === 'en' ? 'Instructor Information' : 'Macluumaadka Macallinka'}
                  </h2>
                  <div className="flex flex-col items-center text-center mb-4 pb-4 border-b border-border">
                    {training.provider?.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={training.provider.logoUrl}
                        alt={`${training.provider.name} profile`}
                        className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 mb-3 shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mb-3 shadow-lg border-4 border-primary/20">
                        {training.provider?.name?.charAt(0)}
                      </div>
                    )}
                    <div className="w-full">
                      <p className="font-bold text-lg text-primary-darker mb-1">{training.provider?.name}</p>
                      {training.provider?.rating && training.provider.rating > 0 && (
                        <div className="flex items-center justify-center gap-1 text-sm text-yellow-500 mb-2">
                          <Star className="w-4 h-4" fill="currentColor" />
                          <span className="font-semibold">{training.provider.rating.toFixed(1)}</span>
                          <span className="text-primary-darker/60">({language === 'en' ? 'Rating' : 'Qiimeyn'})</span>
                        </div>
                      )}
                      {training.provider?.verified && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">
                          <CheckCircle2 size={12} />
                          {language === 'en' ? 'Verified Provider' : 'Bixiyaha La Xaqiijiyay'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-primary-darker/80 whitespace-pre-line mb-4 leading-relaxed">
                    {training.provider?.description ||
                      (language === 'en'
                        ? 'This instructor has not added a description yet.'
                        : 'Macallinku wali ma darsin sharaxaad.')}
                  </div>

                  {/* Contact Provider Section */}
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-primary-darker mb-3">
                      {language === 'en' ? 'Contact Provider' : 'La Xidhiidh Bixiyaha'}
                    </h3>
                    <div className="space-y-2">
                      {providerEmailUrl && providerEmail && (
                        <a
                          href={providerEmailUrl}
                          className="flex items-center gap-2 text-sm text-primary hover:text-primary-darker transition-colors"
                        >
                          <Mail size={16} />
                          <span className="truncate">{providerEmail}</span>
                        </a>
                      )}
                      {providerPhoneUrl && providerPhone && (
                        <a
                          href={providerPhoneUrl}
                          className="flex items-center gap-2 text-sm text-primary hover:text-primary-darker transition-colors"
                        >
                          <Phone size={16} />
                          <span>{providerPhone}</span>
                        </a>
                      )}
                      {!providerEmailUrl && !providerPhoneUrl && (
                        <p className="text-xs text-primary-darker/60">
                          {language === 'en'
                            ? 'Contact information not available'
                            : 'Macluumaadka xidhiidhka lama hayo'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Certificate Info */}
                {safeCertificateUrl && (
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-soft">
                    <h3 className="text-lg font-semibold text-primary-darker mb-3 flex items-center gap-2">
                      <Award size={20} />
                      {language === 'en' ? 'Certificate' : 'Shahaado'}
                    </h3>
                    <a
                      href={safeCertificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-darker underline text-sm"
                    >
                      {language === 'en' ? 'View Certificate Sample' : 'Eeg Tusaale Shahaado'}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


