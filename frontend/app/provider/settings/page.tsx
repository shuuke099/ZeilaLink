'use client';

import React, { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import ProviderDashboardPage from '@/components/provider/ProviderDashboardPage';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ProfileAvatarCard from '@/components/account/ProfileAvatarCard';

type ProviderSettingsState = {
  contactEmail: string;
  supportWhatsapp: string;
  notifyNewEnrollments: boolean;
  notifyAssignments: boolean;
};

type ProviderProfileForm = {
  name: string;
  description: string;
  logoUrl: string;
  rating?: number | null;
  verified?: boolean | null;
};

type Feedback = { type: 'success' | 'error'; text: string } | null;

export default function ProviderSettingsPage() {
  const { user } = useAuth();

  const [settings, setSettings] = useState<ProviderSettingsState>({
    contactEmail: '',
    supportWhatsapp: '',
    notifyNewEnrollments: false,
    notifyAssignments: false,
  });
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState<ProviderProfileForm>({
    name: '',
    description: '',
    logoUrl: '',
  });
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      if (!user) return;
      try {
        if (!active) return;
        setSettings((current) => ({ ...current, contactEmail: user.email ?? '' }));
      } catch (error) {
        console.error('Failed to load provider settings', error);
      }
    };
    loadSettings();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user || user.role !== 'provider') {
        setProfileLoading(false);
        return;
      }
      try {
        setProfileLoading(true);
        const res = await api.get('/providers/me/profile');
        if (res.data) {
          setProfileForm({
            name: res.data.name || '',
            description: res.data.description || '',
            logoUrl: res.data.logoUrl || '',
            rating: res.data.rating ?? null,
            verified: res.data.verified ?? null,
          });
        }
      } catch (error) {
        console.error('Failed to load provider profile', error);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleSaveSettings = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSettingsFeedback('Notification preferences are not available yet.');
  };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setProfileSaving(true);
      await api.post('/providers', {
        name: profileForm.name,
        description: profileForm.description,
        logoUrl: profileForm.logoUrl,
      });
      setProfileFeedback({ type: 'success', text: 'Profile saved successfully.' });
    } catch (error: any) {
      console.error('Failed to save provider profile', error);
      const message = error?.response?.data?.error || 'Unable to save provider profile.';
      setProfileFeedback({ type: 'error', text: message });
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileFeedback(null), 4000);
    }
  };

  const uploadAsset = async (file: File) => {
    const presign = await api.post('/uploads/presign', {
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
    });
    const data = presign.data;

    if (data.directUpload) {
      const formData = new FormData();
      if (data.key) formData.append('key', data.key);
      formData.append('file', file);
      const uploadResponse = await fetch(data.uploadUrl, {
        method: 'POST',
        body: formData,
      });
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }
      const uploaded = await uploadResponse.json();
      return uploaded.publicUrl as string;
    }

    const uploadResponse = await fetch(data.url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    return data.publicUrl as string;
  };

  const onLogoSelected = async (file: File) => {
    try {
      setUploadingLogo(true);
      const publicUrl = await uploadAsset(file);
      setProfileForm((prev) => ({ ...prev, logoUrl: publicUrl }));
      setProfileFeedback({ type: 'success', text: 'Logo uploaded successfully.' });
    } catch (error: any) {
      console.error('Failed to upload logo', error);
      const message = error?.response?.data?.error || 'Failed to upload logo.';
      setProfileFeedback({ type: 'error', text: message });
    } finally {
      setUploadingLogo(false);
      setTimeout(() => setProfileFeedback(null), 4000);
    }
  };

  return (
    <ProviderDashboardPage
      title="Provider settings"
      description="Update contact channels, notification preferences, and your public provider profile."
    >
      <ProfileAvatarCard className="mb-8" />

      {settingsFeedback && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
          {settingsFeedback}
        </div>
      )}

      <section className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg">
        <header className="mb-6 space-y-1">
          <h2 className="text-lg font-semibold text-primary-darker">Contact & alerts</h2>
          <p className="text-sm text-primary-darker/60">
            Coming soon. These controls are disabled and are not saved yet.
          </p>
        </header>

        <form className="space-y-6" onSubmit={handleSaveSettings}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-primary-darker">Contact email</label>
              <input
                type="email"
                className="input-field mt-2"
                value={settings.contactEmail}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    contactEmail: event.target.value,
                  }))
                }
                required
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium text-primary-darker">Support WhatsApp</label>
              <input
                className="input-field mt-2"
                placeholder="+252"
                value={settings.supportWhatsapp}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    supportWhatsapp: event.target.value,
                  }))
                }
                disabled
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-primary/10 bg-primary/5 p-5">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={settings.notifyNewEnrollments}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifyNewEnrollments: event.target.checked,
                  }))
                }
                disabled
              />
              <span>
                <span className="font-semibold text-primary-darker">Notify me of new enrollments</span>
                <p className="text-sm text-primary-darker/60">
                  Receive an email each time a learner joins one of your courses.
                </p>
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={settings.notifyAssignments}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifyAssignments: event.target.checked,
                  }))
                }
                disabled
              />
              <span>
                <span className="font-semibold text-primary-darker">Assignment submissions</span>
                <p className="text-sm text-primary-darker/60">
                  Get notified when learners submit assignments or assessments.
                </p>
              </span>
            </label>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled>
              Save changes
            </button>
          </div>
        </form>
      </section>

      <section className="mt-8 rounded-2xl border border-primary/10 bg-white p-6 shadow-lg">
        <header className="mb-6 space-y-1">
          <h2 className="text-lg font-semibold text-primary-darker">Public provider profile</h2>
          <p className="text-sm text-primary-darker/60">
            This information appears on training program listings and helps learners trust your institution.
          </p>
        </header>

        {profileFeedback && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              profileFeedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {profileFeedback.text}
          </div>
        )}

        {profileLoading ? (
          <div className="py-10 text-center text-primary-darker/60">Loading profile…</div>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-6">
                <h3 className="text-lg font-semibold text-primary-darker">Branding</h3>
                <p className="mt-2 text-sm text-primary-darker/60">
                  Upload your organisation logo to appear on courses and certificates.
                </p>
                <div className="mt-4 flex flex-col items-center gap-4">
                  {profileForm.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profileForm.logoUrl}
                      alt="Logo preview"
                      className="h-24 w-24 rounded-full object-cover shadow-md"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-primary/40 text-xs text-primary">
                      No logo yet
                    </div>
                  )}
                  <label className="btn-secondary cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) onLogoSelected(file);
                      }}
                    />
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadingLogo ? 'Uploading…' : 'Upload logo'}
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-primary-darker">Institution name</label>
                  <input
                    className="input-field mt-2"
                    value={profileForm.name}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-primary-darker">Description</label>
                  <textarea
                    className="input-field mt-2 min-h-[140px]"
                    value={profileForm.description}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Share your mission, expertise areas, and learner outcomes."
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-primary-darker">Marketplace rating</label>
                    <input
                      className="input-field mt-2"
                      value={
                        profileForm.rating && profileForm.rating > 0 ? profileForm.rating.toFixed(1) : 'Not rated yet'
                      }
                      readOnly
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-primary-darker">Verified status</label>
                    <div className="mt-3 flex items-center gap-2 text-sm text-primary-darker/70">
                      <input type="checkbox" checked={!!profileForm.verified} readOnly />
                      <span>{profileForm.verified ? 'Verified provider' : 'Pending verification'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={profileSaving}>
                {profileSaving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        )}
      </section>
    </ProviderDashboardPage>
  );
}

