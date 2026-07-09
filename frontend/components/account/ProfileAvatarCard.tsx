'use client';

import React from 'react';
import { Upload, Loader2, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type ProfileAvatarCardProps = {
  title?: string;
  description?: string;
  className?: string;
};

const DEFAULT_TITLE = 'Profile photo';
const DEFAULT_DESCRIPTION = 'Upload a clear, professional image to represent your account across the platform.';

async function uploadToStorage(file: File) {
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
    const payload = await uploadResponse.json();
    return payload.publicUrl as string;
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
}

export default function ProfileAvatarCard({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  className,
}: ProfileAvatarCardProps) {
  const { user, updateUser } = useAuth();
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(user?.avatarUrl ?? null);
  const [status, setStatus] = React.useState<'idle' | 'uploading' | 'removing'>('idle');
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    setPreviewUrl(user?.avatarUrl ?? null);
  }, [user?.avatarUrl]);

  const showFeedback = React.useCallback((type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    try {
      setStatus('uploading');
      const publicUrl = await uploadToStorage(file);
      const response = await api.put(`/auth/users/${user.id}`, {
        avatarUrl: publicUrl,
      });
      if (response?.data) {
        updateUser(response.data);
      }
      setPreviewUrl(publicUrl);
      showFeedback('success', 'Profile photo updated.');
    } catch (error) {
      console.error('Failed to upload avatar', error);
      showFeedback('error', 'Unable to upload photo. Please try again.');
    } finally {
      setStatus('idle');
    }
  };

  const handleRemove = async () => {
    if (!user || !previewUrl) return;
    try {
      setStatus('removing');
      const response = await api.put(`/auth/users/${user.id}`, {
        avatarUrl: null,
      });
      if (response?.data) {
        updateUser(response.data);
      }
      setPreviewUrl(null);
      showFeedback('success', 'Profile photo removed.');
    } catch (error) {
      console.error('Failed to remove avatar', error);
      showFeedback('error', 'Unable to remove photo right now.');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <section className={`rounded-2xl border border-primary/10 bg-white p-6 shadow-lg ${className ?? ''}`}>
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-primary-darker">{title}</h2>
        <p className="text-sm text-primary-darker/60">{description}</p>
      </header>

      {feedback && (
        <div
          className={`mt-4 rounded-xl border p-3 text-sm ${
            feedback.type === 'success'
              ? 'border-primary/30 bg-primary/5 text-primary'
              : 'border-red-500/40 bg-red-50 text-red-600'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="relative h-32 w-32 overflow-hidden rounded-full border border-primary/20 bg-primary/10 shadow-lg ring-4 ring-primary/10">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Profile preview"
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-primary">
              No photo yet
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <label className={`btn-secondary flex items-center gap-2 ${status !== 'idle' ? 'pointer-events-none opacity-70' : ''}`}>
            <Upload size={16} />
            <span>{status === 'uploading' ? 'Uploading…' : 'Upload photo'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={status !== 'idle'}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleAvatarUpload(file);
                  event.target.value = '';
                }
              }}
            />
          </label>
          {previewUrl && (
            <button
              type="button"
              className="btn-ghost flex items-center gap-2 text-primary-darker/80"
              onClick={() => void handleRemove()}
              disabled={status !== 'idle'}
            >
              {status === 'removing' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              <span>{status === 'removing' ? 'Removing…' : 'Remove'}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

