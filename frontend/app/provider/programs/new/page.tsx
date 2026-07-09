'use client';

import React from 'react';
import ProviderDashboardPage from '@/components/provider/ProviderDashboardPage';
import api from '@/lib/api';
import { Upload, MapPin, Calendar, Users, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type ProgramFormState = {
  name: string;
  category: string;
  duration: string;
  description: string;
  cost: string;
  providesCertificate: boolean;
  imageUrl?: string;
  location?: string;
  schedule?: string;
  startDate?: string;
  availableSeats?: string;
  learningOutcomes?: string;
  providerName?: string;
  providerEmail?: string;
  providerWebsite?: string;
  providerRating?: number | null;
};

export default function ProviderNewProgramPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [formState, setFormState] = React.useState<ProgramFormState>({
    name: '',
    category: '',
    duration: '',
    description: '',
    cost: '',
    providesCertificate: true,
    location: '',
    schedule: '',
    startDate: '',
    availableSeats: '',
    learningOutcomes: '',
    providerName: '',
    providerEmail: '',
    providerWebsite: '',
    providerRating: null,
  });
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = React.useState(true);
  const [providerError, setProviderError] = React.useState<string | null>(null);

  const resetCourseFields = React.useCallback(() => {
    setFormState((prev) => ({
      name: '',
      category: '',
      duration: '',
      description: '',
      cost: '',
      providesCertificate: true,
      location: '',
      schedule: '',
      startDate: '',
      availableSeats: '',
      learningOutcomes: '',
      imageUrl: undefined,
      providerName: prev.providerName,
      providerEmail: prev.providerEmail,
      providerWebsite: prev.providerWebsite,
      providerRating: prev.providerRating,
    }));
  }, []);

  React.useEffect(() => {
    if (!user) {
      setLoadingProvider(false);
      return;
    }

    const loadProvider = async () => {
      try {
        setLoadingProvider(true);
        setProviderError(null);
        const response = await api.get('/providers/me/profile');
        const provider = response.data;
        setFormState((prev) => ({
          ...prev,
          providerName: provider?.name ?? prev.providerName ?? user.name ?? '',
          providerEmail: provider?.user?.email ?? prev.providerEmail ?? user.email ?? '',
          providerWebsite: provider?.website ?? prev.providerWebsite ?? '',
          providerRating: provider?.rating ?? prev.providerRating ?? null,
        }));
      } catch (error: any) {
        console.error('Failed to load provider profile', error);
        if (error?.response?.status === 404) {
          setProviderError(
            'No provider profile found. Please complete your provider profile before publishing courses.',
          );
        } else {
          setProviderError('Unable to load provider information. Please try again later.');
        }
      } finally {
        setLoadingProvider(false);
      }
    };

    loadProvider();
  }, [user]);

  const uploadImage = async (file: File) => {
    try {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setFeedback(language === 'en' 
          ? 'File size too large. Maximum size is 10MB.' 
          : 'Cabbirka faylka aad u weyn yahay. Cabbirka ugu badan waa 10MB.');
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];
      if (!validTypes.includes(file.type)) {
        setFeedback(language === 'en' 
          ? 'Invalid file type. Please upload an image (JPG, PNG, GIF, WEBP, SVG, or BMP).' 
          : 'Nooca faylka ma sax ahayn. Fadlan soo geli sawir (JPG, PNG, GIF, WEBP, SVG, ama BMP).');
        return;
      }

      setFeedback(language === 'en' ? 'Uploading image...' : 'Waa la soo gelinayaa sawirka...');
      
      const data = new FormData();
      data.append('file', file);
      
      const response = await api.post('/uploads', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout for large files
      });
      
      const uploadedUrl = response.data.url ?? response.data.publicUrl;
      if (!uploadedUrl) {
        throw new Error('Upload response missing URL');
      }
      
      setFormState((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      setFeedback(language === 'en' ? 'Image uploaded successfully.' : 'Sawirka si guul leh ayaa la soo geliyay.');
    } catch (error: any) {
      console.error('Image upload failed', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      setFeedback(
        language === 'en' 
          ? `Unable to upload image: ${errorMessage}` 
          : `Waxaa jira qalad marka la soo gelinayo sawirka: ${errorMessage}`
      );
    }
  };

  const handleSubmit = async (publish: boolean) => {
    try {
      setSaving(true);
      setFeedback(null);
      
      // Combine learning outcomes and additional info into description if needed
      let finalDescription = formState.description;
      if (formState.learningOutcomes) {
        const outcomes = formState.learningOutcomes.split('\n').filter(line => line.trim());
        if (outcomes.length > 0) {
          finalDescription += '\n\nWhat You Will Learn:\n' + outcomes.map(o => `- ${o.trim()}`).join('\n');
        }
      }
      if (formState.location) {
        finalDescription += `\n\nLocation: ${formState.location}`;
      }
      if (formState.schedule) {
        finalDescription += `\n\nSchedule: ${formState.schedule}`;
      }
      if (formState.startDate) {
        finalDescription += `\n\nStart Date: ${formState.startDate}`;
      }
      if (formState.availableSeats) {
        finalDescription += `\n\nAvailable Seats: ${formState.availableSeats}`;
      }

      await api.post('/trainings', {
        name: formState.name,
        category: formState.category,
        duration: formState.duration,
        description: finalDescription,
        cost: Number(formState.cost) || 0,
        providesCertificate: formState.providesCertificate,
        imageUrl: formState.imageUrl,
        published: publish,
      });
      setFeedback(
        publish
          ? (language === 'en' ? 'Program published successfully.' : 'Barnaamijka si guul leh ayaa la daabacay.')
          : (language === 'en' ? 'Program saved as draft. You can publish it later.' : 'Barnaamijka waa la keydiyay qoraalka. Waxaad hore u daabici kartaa.'),
      );
      resetCourseFields();
    } catch (error) {
      console.error('Failed to create program', error);
      setFeedback(language === 'en' 
        ? 'Unable to create program. Please check the form and try again.' 
        : 'Waxaa jira qalad. Fadlan hubi foomka oo mar kale isku day.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProviderDashboardPage
      title={language === 'en' ? 'Create New Training Program' : 'Abuur Barnaamij Tababar Cusub'}
      description={language === 'en' 
        ? 'Fill in the details below to add a new course to the platform.' 
        : 'Buuxi faahfaahinta hoose si aad ugu darto koors cusub platform-ka.'}
      headerActions={
        <button className="btn-secondary" onClick={resetCourseFields} disabled={saving}>
          {language === 'en' ? 'Reset Form' : 'Nadiifi Foomka'}
        </button>
      }
    >
      {feedback && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
          {feedback}
        </div>
      )}

      <section className="space-y-6">
        <div className="rounded-2xl sm:rounded-3xl border border-primary/10 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-bold text-primary-darker mb-2">
            {language === 'en' ? 'Course Details' : 'Faahfaahinta Koorsada'}
          </h2>
          <p className="text-sm text-primary-darker/60 mb-6">
            {language === 'en' 
              ? 'Fill in the course name, category, duration, and description.' 
              : 'Buuxi magaca koorsada, qaybta, waqtiga, iyo sharaxaada.'}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-primary-darker mb-2 block">
                {language === 'en' ? 'Training Title' : 'Cinwaanka Tababarka'} <span className="text-red-500">*</span>
              </label>
              <input
                className="input-field rounded-xl"
                placeholder={language === 'en' ? 'e.g., Advanced React Development' : 'tusaale, Horumarka React-ka'}
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-primary-darker mb-2 block">
                {language === 'en' ? 'Category' : 'Qaybta'} <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field rounded-xl"
                value={formState.category}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, category: event.target.value }))
                }
                required
              >
                <option value="">{language === 'en' ? 'Select category' : 'Dooro qaybta'}</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Trades">Trades</option>
                <option value="Business">Business</option>
                <option value="Education">Education</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-primary-darker mb-2 block">
                {language === 'en' ? 'Duration' : 'Waqtiga'} <span className="text-red-500">*</span>
              </label>
              <input
                className="input-field rounded-xl"
                placeholder={language === 'en' ? 'e.g., 4 weeks or 30 hours' : 'tusaale, 4 toddobaad ama 30 saacadood'}
                value={formState.duration}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, duration: event.target.value }))
                }
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-primary-darker mb-2 block">
                {language === 'en' ? 'Description' : 'Sharaxaada'} <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input-field rounded-xl h-32"
                placeholder={language === 'en' 
                  ? 'Provide a detailed description of the course content, learning objectives, and target audiences.' 
                  : 'Bixi sharaxaad dheeraad ah oo ku saabsan nuxurka koorsada, ujeeddooyinka barashada, iyo dadka loo tala galay.'}
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-primary-darker mb-2 block">
                {language === 'en' ? 'Cost (USD)' : 'Qiimaha (USD)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className="input-field rounded-xl"
                placeholder={language === 'en' ? '0 for free' : '0 bilaash ah'}
                value={formState.cost}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, cost: event.target.value }))
                }
                required
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-primary-darker mb-2 block flex items-center gap-2">
                <MapPin size={16} />
                {language === 'en' ? 'Location' : 'Goobta'} (Optional)
              </label>
              <input
                className="input-field rounded-xl"
                placeholder={language === 'en' ? 'e.g., Online, Mogadishu, Hargeisa' : 'tusaale, Internetka, Muqdisho, Hargeysa'}
                value={formState.location}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, location: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-primary-darker mb-2 block flex items-center gap-2">
                <Calendar size={16} />
                {language === 'en' ? 'Schedule' : 'Jadwalka'} (Optional)
              </label>
              <input
                className="input-field rounded-xl"
                placeholder={language === 'en' ? 'e.g., Mon-Wed-Fri, 6-8 PM' : 'tusaale, Isniin-Axad-Jimco, 6-8 PM'}
                value={formState.schedule}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, schedule: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-primary-darker mb-2 block flex items-center gap-2">
                <Calendar size={16} />
                {language === 'en' ? 'Start Date' : 'Taariikhda Bilowga'} (Optional)
              </label>
              <input
                type="date"
                className="input-field rounded-xl"
                value={formState.startDate}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, startDate: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-primary-darker mb-2 block flex items-center gap-2">
                <Users size={16} />
                {language === 'en' ? 'Available Seats' : 'Kursiyada La Heli Karo'} (Optional)
              </label>
              <input
                type="number"
                className="input-field rounded-xl"
                placeholder={language === 'en' ? 'e.g., 50' : 'tusaale, 50'}
                value={formState.availableSeats}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, availableSeats: event.target.value }))
                }
                min="1"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-primary-darker mb-2 block flex items-center gap-2">
                <BookOpen size={16} />
                {language === 'en' ? 'What You Will Learn' : 'Waxaad Baran Doontaa'} (Optional)
              </label>
              <textarea
                className="input-field rounded-xl h-32"
                placeholder={language === 'en' 
                  ? 'Enter one learning outcome per line, e.g.:\n- Master React hooks\n- Build real-world applications\n- Deploy to production' 
                  : 'Gali natiijada barashada hal keliya, tusaale:\n- Wax ka baro React hooks\n- Abuur codsiyada dhabta ah\n- Deploy u samee production'}
                value={formState.learningOutcomes}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, learningOutcomes: event.target.value }))
                }
              />
              <p className="text-xs text-primary-darker/60 mt-1">
                {language === 'en' 
                  ? 'One learning outcome per line. These will be displayed as bullet points.' 
                  : 'Hal natiijada barashada hal keliya. Waxay muujin doonaan sida bullet points.'}
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4 md:col-span-2">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={formState.providesCertificate}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    providesCertificate: event.target.checked,
                  }))
                }
              />
              <div>
                <div className="font-semibold text-primary-darker">
                  {language === 'en' ? 'Provides Certificate' : 'Wuxuu Bixiyaa Shahaado'}
                </div>
                <p className="text-sm text-primary-darker/60">
                  {language === 'en' 
                    ? 'Indicate if learners receive a certificate upon completion.' 
                    : 'Tilmaam haddii ardaydu ay helaan shahaado marka ay dhameeyaan.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-primary/10 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-bold text-primary-darker mb-2">
            {language === 'en' ? 'Course Image/Banner' : 'Sawirka/Banner-ka Koorsada'}
          </h2>
          <p className="text-sm text-primary-darker/60 mb-6">
            {language === 'en' 
              ? 'Recommended size: 800×450px. Max file size: 2MB.' 
              : 'Cabbirka la soo jeediyay: 800×450px. Cabbirka ugu badan: 2MB.'}
          </p>
          <div className="mt-4 space-y-3">
            {formState.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={formState.imageUrl}
                alt="Program artwork"
                className="h-48 w-full rounded-lg object-cover shadow-md"
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-primary/30 text-sm text-primary">
                Click to upload or drag and drop
              </div>
            )}
            <label className="btn-secondary cursor-pointer inline-flex items-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadImage(file);
                }}
              />
              <Upload className="mr-2 h-4 w-4" />
              Upload image
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-primary-darker">Provider Information</h2>
          {loadingProvider ? (
            <p className="mt-3 text-sm text-primary-darker/70">Loading provider profile…</p>
          ) : providerError ? (
            <p className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
              {providerError}
            </p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-primary-darker">Provider Name</label>
                <input
                  className="input-field mt-2"
                  placeholder="e.g., Oasiscore"
                  value={formState.providerName}
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-medium text-primary-darker">Provider Contact Email</label>
                <input
                  type="email"
                  className="input-field mt-2"
                  placeholder="e.g., contact@oasiscore.org"
                  value={formState.providerEmail}
                  readOnly
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-primary-darker">
                  Provider Website (Optional)
                </label>
                <input
                  className="input-field mt-2"
                  placeholder="https://www.oasiscore.org"
                  value={formState.providerWebsite}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, providerWebsite: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-primary-darker">Marketplace rating</label>
                <input
                  className="input-field mt-2"
                  value={
                    formState.providerRating && formState.providerRating > 0
                      ? formState.providerRating.toFixed(1)
                      : 'Not rated yet'
                  }
                  readOnly
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            className="btn-secondary rounded-xl px-6 py-3"
            onClick={() => handleSubmit(false)}
            disabled={saving || loadingProvider || !!providerError}
          >
            {language === 'en' ? 'Save as Draft' : 'Keydso Qoraalka'}
          </button>
          <button
            className="btn-primary rounded-xl px-6 py-3 text-lg"
            onClick={() => handleSubmit(true)}
            disabled={saving || loadingProvider || !!providerError}
          >
            {saving 
              ? (language === 'en' ? 'Publishing...' : 'Waa la daabacayaa...') 
              : (language === 'en' ? 'Publish Course' : 'Daabac Koorsada')}
          </button>
        </div>
      </section>
    </ProviderDashboardPage>
  );
}

