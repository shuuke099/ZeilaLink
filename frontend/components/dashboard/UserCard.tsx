'use client';

import React from 'react';
import { User as UserIcon } from 'lucide-react';

type UserCardProps = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  extra?: React.ReactNode;
  avatarUrl?: string | null;
};

const roleLabels: Record<string, string> = {
  worker: 'Worker',
  employer: 'Employer',
  admin: 'Administrator',
  provider: 'Training Provider',
};

const getInitials = (value?: string | null) => {
  if (!value) return '?';
  const parts = value.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return '?';
  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

export default function UserCard({ name, email, role, extra, avatarUrl }: UserCardProps) {
  const [imageError, setImageError] = React.useState(false);

  // Reset error state when avatarUrl changes
  React.useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  return (
    <div className="rounded-[32px] border border-white/15 bg-white/10 p-5 text-white shadow-[0_24px_50px_rgba(13,35,27,0.25)] backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white/20 bg-white/10 shadow-lg">
          {avatarUrl && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name ? `${name}'s avatar` : 'User avatar'}
              className="h-full w-full object-cover object-center"
              onError={() => setImageError(true)}
            />
          ) : name ? (
            <span className="text-lg font-semibold uppercase tracking-wide text-white">
              {getInitials(name)}
            </span>
          ) : (
            <UserIcon className="h-7 w-7 text-white" />
          )}
        </div>
        <div className="space-y-1">
          <div className="text-lg font-semibold leading-tight">
            {name ?? 'Guest User'}
          </div>
          {email && <p className="text-xs text-white/70">{email}</p>}
          {role && (
            <div className="mt-1 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/80">
              {roleLabels[role] ?? role}
            </div>
          )}
        </div>
      </div>
      {extra && (
        <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/90">
          {extra}
        </div>
      )}
    </div>
  );
}

