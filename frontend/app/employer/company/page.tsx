'use client';

import React from 'react';
import Link from 'next/link';
import EmployerDashboardPage from '@/components/employer/EmployerDashboardPage';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Upload, Building2, Globe2, MapPin, UserRound } from 'lucide-react';

type CompanyFormState = {
  name: string;
  description: string;
  website: string;
  address: string;
  logoUrl?: string;
  bannerUrl?: string;
};

export default function EmployerCompanyPage() {
  const { user, updateUser } = useAuth();
  const [formState, setFormState] = React.useState<CompanyFormState>({
    name: '',
    description: '',
    website: '',
    address: '',
  });
  const [stats, setStats] = React.useState({ totalJobs: 0, applicants: 0 });
  const [feedback, setFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const loadCompany = async () => {
      if (!user) return;
      try {
        const [profileResponse, dashboardResponse] = await Promise.all([
          api
          .get('/employers/me/profile')
          .catch(() => ({
            data: {
              name: 'ZeilaLink Logistics Group',
              description:
                'We connect ports, warehouses, and retailers with reliable logistics services across the region.',
              website: 'https://somlogistics.com',
              address: 'KM4, Mogadishu',
              logoUrl: '',
              bannerUrl: '',
            },
          })),
          api.get('/employers/me/dashboard').catch(() => ({
            data: { activeJobs: 4, totalApplicants: 220 },
          })),
        ]);

        if (!active) return;

        const profileData = profileResponse.data;
        setFormState({
          name: profileData.name ?? '',
          description: profileData.description ?? '',
          website: profileData.website ?? '',
          address: profileData.address ?? '',
          logoUrl: profileData.logoUrl ?? '',
          bannerUrl: profileData.bannerUrl ?? '',
        });
        setStats({
          totalJobs: dashboardResponse.data.activeJobs ?? 0,
          applicants: dashboardResponse.data.totalApplicants ?? 0,
        });
        
        // Update user in AuthContext with company name and logo if available
        if (user && profileData.name) {
          updateUser({
            ...user,
            name: profileData.name,
            // Use employer logo as avatar if available and user doesn't have one
            avatarUrl: profileData.logoUrl || user.avatarUrl,
          });
        }
      } catch (error: any) {
        console.error('Failed to load company profile', error);
        if (active) {
          let errorMessage = 'Unable to load company profile.';
          
          // Check for connection errors more thoroughly
          const isConnectionError = 
            error?.isConnectionError ||
            error?.code === 'ERR_NETWORK' ||
            error?.code === 'ECONNREFUSED' ||
            error?.code === 'ERR_CONNECTION_REFUSED' ||
            error?.message?.includes('Network Error') ||
            error?.message?.includes('ERR_CONNECTION_REFUSED') ||
            error?.message?.includes('Failed to fetch') ||
            (!error?.response && error?.request);
          
          if (isConnectionError) {
            errorMessage = 'Network Error: Cannot connect to server. Please ensure the backend server is running on port 7000.';
          } else if (error?.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error?.message) {
            errorMessage = error.message;
          }
          
          setFeedback(errorMessage);
        }
      }
    };
    loadCompany();
    return () => {
      active = false;
    };
  }, [user]); // Removed updateUser from dependencies to prevent infinite loop

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    try {
      const response = await api.put('/employers/me/profile', formState);
      setFeedback('Company profile updated successfully.');
      
      // Update the user in AuthContext to reflect changes in the sidebar
      if (user && formState.name) {
        updateUser({
          ...user,
          name: formState.name,
          // Use employer logo as avatar if available
          avatarUrl: formState.logoUrl || user.avatarUrl,
        });
      }
    } catch (error: any) {
      console.error('Failed to update company profile', error);
      let errorMessage = 'Unable to update company profile. Please try again.';
      
      if (error?.isConnectionError || error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED') {
        errorMessage = 'Network Error: Cannot connect to server. Please ensure the backend server is running on port 7000.';
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setFeedback(errorMessage);
    }
  };

  const uploadAsset = async (file: File, key: 'logoUrl' | 'bannerUrl') => {
    try {
      const data = new FormData();
      data.append('file', file);
      const response = await api.post('/uploads', data);
      const uploadedUrl = response.data.url ?? response.data.publicUrl;
      if (!uploadedUrl) {
        throw new Error('Upload response missing URL');
      }
      setFormState((prev) => ({ ...prev, [key]: uploadedUrl }));
      setFeedback('Image uploaded successfully.');
      
      // If logo is uploaded, update the user avatar in AuthContext immediately
      if (key === 'logoUrl' && user) {
        updateUser({
          ...user,
          avatarUrl: uploadedUrl,
        });
      }
    } catch (error: any) {
      console.error('Image upload failed', error);
      let errorMessage = 'Unable to upload image. Please try a different file.';
      
      if (error?.isConnectionError || error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED') {
        errorMessage = 'Network Error: Cannot connect to server. Please ensure the backend server is running on port 7000.';
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setFeedback(errorMessage);
    }
  };

  return (
    <EmployerDashboardPage
      title="Company profile"
      description="Keep your organization details accurate to attract top talent."
      headerActions={
        <div className="flex gap-3">
          <div className="rounded-xl bg-primary/10 px-4 py-2 text-sm text-primary">
            Jobs posted: <span className="font-semibold">{stats.totalJobs}</span>
          </div>
          <div className="rounded-xl bg-primary/10 px-4 py-2 text-sm text-primary">
            Applicants: <span className="font-semibold">{stats.applicants}</span>
          </div>
        </div>
      }
    >
      {feedback && (
        <div className={`rounded-xl border p-4 text-sm font-medium ${
          feedback.includes('Network Error') || 
          feedback.includes('Cannot connect') ||
          feedback.includes('connection refused') ||
          feedback.includes('ERR_CONNECTION_REFUSED')
            ? 'border-red-400/50 bg-red-100/80 text-red-800 dark:border-red-500/50 dark:bg-red-900/30 dark:text-red-300'
            : 'border-primary/30 bg-primary/10 text-primary-dark'
        }`}>
          <div className="flex items-start gap-2">
            {(feedback.includes('Network Error') || feedback.includes('Cannot connect')) && (
              <span className="text-lg">⚠️</span>
            )}
            <span>{feedback}</span>
          </div>
        </div>
      )}

      <section className="card bg-surface border border-border p-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-heading">
                  Company name
                </label>
                <input
                  className="input-field mt-2"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-heading">
                  Website
                </label>
                <input
                  className="input-field mt-2"
                  placeholder="https://"
                  value={formState.website}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, website: event.target.value }))
                  }
                />
                <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <Globe2 className="h-3.5 w-3.5 text-primary" />
                  Share a destination where candidates can explore your organisation.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-heading">
                  Address
                </label>
                <input
                  className="input-field mt-2"
                  placeholder="City, country"
                  value={formState.address}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, address: event.target.value }))
                  }
                />
                <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Help talent understand where your team operates from.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-heading">
                  Description
                </label>
                <textarea
                  className="input-field mt-2 h-40"
                  placeholder="Share your mission, company culture, and the impact of your work."
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  required
                />
                <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <UserRound className="h-3.5 w-3.5 text-primary" />
                  Highlight your mission, culture, and the impact your team delivers.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-surface-muted p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-heading">
                  Logo
                </h3>
                <div className="mt-4 flex flex-col items-center gap-4">
                  {formState.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formState.logoUrl}
                      alt="Company logo"
                      className="h-24 w-24 rounded-full object-cover shadow-md"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-primary/40 text-xs text-primary">
                      Upload logo
                    </div>
                  )}
                  <label className="btn-secondary cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) uploadAsset(file, 'logoUrl');
                      }}
                    />
                    <Upload className="mr-2 h-4 w-4" />
                    Update logo
                  </label>
                  <p className="text-center text-xs text-muted">
                    Recommended: square PNG/SVG at least 240 × 240 px with a transparent background.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface-muted p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-heading">
                  Banner
                </h3>
                <div className="mt-4 space-y-3">
                  {formState.bannerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formState.bannerUrl}
                      alt="Company banner"
                      className="h-32 w-full rounded-lg object-cover shadow-md"
                    />
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-primary/40 text-xs text-primary">
                      Upload banner image
                    </div>
                  )}
                  <label className="btn-secondary cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) uploadAsset(file, 'bannerUrl');
                      }}
                    />
                    <Upload className="mr-2 h-4 w-4" />
                    Upload banner
                  </label>
                  <p className="text-xs text-muted">
                    Recommended size: 1200 × 400 px.
                  </p>
                </div>
              </div>
            </div>
          </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/employer/post-job"
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Preview job posts
          </Link>
          <button type="submit" className="btn-primary">
            Save changes
          </button>
        </div>
        </form>
      </section>
    </EmployerDashboardPage>
  );
}

