'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, ExternalLink, ShieldCheck, X } from 'lucide-react';
import {
  ApprovableAdminUser,
  approveOrganization,
  canApproveOrganization,
} from '@/lib/adminApprovals';

type OrganizationApprovalModalProps = {
  user: ApprovableAdminUser;
  onClose: () => void;
  onApproved: (userId: string) => void;
};

const fieldLabels: Record<string, string> = {
  name: 'Organization name',
  website: 'Website',
  address: 'Address',
  description: 'Description',
  logoUrl: 'Logo URL',
  bannerUrl: 'Banner URL',
};

export default function OrganizationApprovalModal({
  user,
  onClose,
  onApproved,
}: OrganizationApprovalModalProps) {
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState('');
  const organization = user.organization;
  const identityFields = useMemo(
    () =>
      Object.entries(organization?.identity || {}).filter(
        ([key]) => key !== 'name',
      ),
    [organization],
  );

  const approve = async () => {
    if (!canApproveOrganization(user)) return;

    try {
      setApproving(true);
      setError('');
      await approveOrganization(user.organization);
      onApproved(user.id);
      onClose();
    } catch (approvalError: any) {
      setError(
        approvalError?.response?.data?.error ||
          `Failed to approve ${organization?.type || 'organization'}`,
      );
    } finally {
      setApproving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-4"
      onClick={() => !approving && onClose()}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Building2 size={21} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                Review before approval
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-900">
                {organization?.name || user.name}
              </h2>
              <p className="text-sm text-slate-500">
                {user.name} · {user.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close approval review"
            disabled={approving}
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700">
            {organization?.type || user.role}
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Email verified
          </span>
        </div>

        <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {identityFields.map(([key, value]) => (
            <div key={key}>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                {fieldLabels[key] || key}
              </p>
              <p className="mt-0.5 break-words text-sm text-slate-700">
                {value || 'Not provided'}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800">
          Approval lets this organization use restricted employer or provider features.
          Confirm that the profile information above is legitimate.
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href={`/admin/users/${user.id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            <ExternalLink size={16} />
            Full profile
          </Link>
          <button
            type="button"
            disabled={approving || !canApproveOrganization(user)}
            onClick={() => void approve()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldCheck size={17} />
            {approving ? 'Approving...' : 'Approve organization'}
          </button>
        </div>
      </div>
    </div>
  );
}
