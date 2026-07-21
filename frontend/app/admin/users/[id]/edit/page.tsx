'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import api from '@/lib/api';
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';

type UserForm = {
  name: string;
  email: string;
  role: string;
  phone: string;
  location: string;
  bio: string;
  preferredLanguage: string;
  avatarUrl: string;
  isVerified: boolean;
};

export default function EditAdminUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<UserForm>({ name: '', email: '', role: 'worker', phone: '', location: '', bio: '', preferredLanguage: 'en', avatarUrl: '', isVerified: false });
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/admin/users/${params.id}`)
      .then(({ data }) => {
        setDetails(data.user);
        setForm({
          name: data.user.name || '', email: data.user.email || '', role: data.user.role || 'worker',
          phone: data.user.phone || '', location: data.user.location || '', bio: data.user.bio || '',
          preferredLanguage: data.user.preferredLanguage || 'en', avatarUrl: data.user.avatarUrl || '',
          isVerified: Boolean(data.user.isVerified),
        });
      })
      .catch((err) => setError(err?.response?.data?.error || 'Failed to load user'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      await api.put(`/admin/users/${params.id}`, form);
      router.push('/admin/users');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const approveOrganization = async () => {
    const organization = details?.employer || details?.provider;
    const kind = details?.employer ? 'employer' : details?.provider ? 'provider' : null;
    if (!organization?.id || !kind) return;

    try {
      setApproving(true);
      setError('');
      const identity = kind === 'employer'
        ? {
            name: organization.name,
            logoUrl: organization.logoUrl ?? null,
            bannerUrl: organization.bannerUrl ?? null,
            description: organization.description ?? null,
            website: organization.website ?? null,
            address: organization.address ?? null,
          }
        : {
            name: organization.name,
            logoUrl: organization.logoUrl ?? null,
            description: organization.description ?? null,
          };
      await api.post(`/admin/verify-${kind}/${organization.id}`, { identity });
      setDetails((current: any) => ({
        ...current,
        [kind]: { ...current[kind], verified: true },
      }));
    } catch (err: any) {
      setError(err?.response?.data?.error || `Failed to approve ${kind}`);
    } finally {
      setApproving(false);
    }
  };

  const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

  return <AdminDashboardPage title="Edit User" description="Update account details and access.">
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/users" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600"><ArrowLeft size={17} />Back to users</Link>
      <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {loading ? <p className="py-16 text-center text-slate-400">Loading user...</p> : <>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">Full name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></label>
            <label className="text-sm font-bold text-slate-700">Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></label>
            <label className="text-sm font-bold text-slate-700">Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass}><option value="worker">Worker</option><option value="employer">Employer</option><option value="provider">Provider</option><option value="admin">Admin</option></select></label>
            <label className="text-sm font-bold text-slate-700">Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></label>
            <label className="text-sm font-bold text-slate-700 sm:col-span-2">Location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} /></label>
            <label className="text-sm font-bold text-slate-700">Preferred language<select value={form.preferredLanguage} onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })} className={inputClass}><option value="en">English</option><option value="so">Somali</option></select></label>
            <label className="text-sm font-bold text-slate-700">Avatar URL<input value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} className={inputClass} /></label>
            <label className="text-sm font-bold text-slate-700 sm:col-span-2">Biography<textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={inputClass} /></label>
          </div>
          <label className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-700"><input type="checkbox" checked={form.isVerified} onChange={(e) => setForm({ ...form, isVerified: e.target.checked })} />Email verified</label>
          {details && <div className="mt-7 space-y-6 border-t border-slate-100 pt-7">
            <section><h3 className="mb-3 text-base font-black text-slate-900">Account activity</h3><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Applications', details._count?.applications], ['Bookings', details._count?.serviceBookings], ['Sent messages', details._count?.sentMessages], ['Received', details._count?.receivedMessages]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 text-xl font-black text-slate-900">{value ?? 0}</p></div>)}</div></section>
            {(details.employer || details.provider) && <section><h3 className="mb-3 text-base font-black text-slate-900">Role profile</h3><div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{details.employer ? <><p><b>Company:</b> {details.employer.name}</p><p><b>Website:</b> {details.employer.website || '-'}</p><p><b>Address:</b> {details.employer.address || '-'}</p><p><b>Approved:</b> {details.employer.verified ? 'Yes' : 'No'}</p></> : <><p><b>Provider:</b> {details.provider.name}</p><p><b>Rating:</b> {details.provider.rating}</p><p><b>Approved:</b> {details.provider.verified ? 'Yes' : 'No'}</p><p><b>Description:</b> {details.provider.description || '-'}</p></>}{!(details.employer?.verified || details.provider?.verified) && <button type="button" onClick={approveOrganization} disabled={approving || !details.isVerified} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><ShieldCheck size={17} />{approving ? 'Approving...' : 'Approve organization'}</button>}{!details.isVerified && !(details.employer?.verified || details.provider?.verified) && <p className="mt-2 text-xs font-semibold text-amber-700">Verify the account email before approval.</p>}</div></section>}
            <section><h3 className="mb-3 text-base font-black text-slate-900">Skills and languages</h3><div className="flex flex-wrap gap-2">{details.userSkills?.map((item: any) => <span key={item.id} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{item.skill.name} · {item.level}</span>)}{details.workerLanguages?.map((item: any) => <span key={item.id} className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">{item.language} · {item.level}</span>)}{!details.userSkills?.length && !details.workerLanguages?.length && <span className="text-sm text-slate-400">No skills or languages added.</span>}</div></section>
            <section><h3 className="mb-3 text-base font-black text-slate-900">Work experience</h3><div className="space-y-2">{details.workerExperiences?.map((item: any) => <div key={item.id} className="rounded-xl border border-slate-100 p-3 text-sm"><b>{item.jobTitle}</b> · {item.company}<p className="text-xs text-slate-400">{new Date(item.startDate).toLocaleDateString()} – {item.isCurrent ? 'Present' : item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}</p></div>)}{!details.workerExperiences?.length && <p className="text-sm text-slate-400">No work experience added.</p>}</div></section>
            <section><h3 className="mb-3 text-base font-black text-slate-900">Education, enrollments, and certifications</h3><div className="space-y-2">{details.workerEducations?.map((item: any) => <div key={item.id} className="rounded-xl border border-slate-100 p-3 text-sm"><b>{item.degreeLevel}</b> · {item.institution}<p className="text-xs text-slate-400">{item.fieldOfStudy || item.certificationName || '-'}</p></div>)}{details.userCertifications?.map((item: any) => <div key={item.id} className="rounded-xl border border-slate-100 p-3 text-sm"><b>{item.training.name}</b><p className="text-xs text-slate-400">{item.certificateIssued ? 'Certificate issued' : 'Enrolled'} · {new Date(item.enrolledAt).toLocaleDateString()}</p></div>)}{!details.workerEducations?.length && !details.userCertifications?.length && <p className="text-sm text-slate-400">No education, enrollments, or certifications added.</p>}</div></section>
            <section className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3"><p><b className="block text-slate-700">User ID</b>{details.id}</p><p><b className="block text-slate-700">Created</b>{new Date(details.createdAt).toLocaleString()}</p><p><b className="block text-slate-700">Last updated</b>{new Date(details.updatedAt).toLocaleString()}</p></section>
          </div>}
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
          <div className="mt-7 flex justify-end gap-3"><Link href="/admin/users" className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-600 hover:bg-slate-50">Cancel</Link><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"><Save size={18} />{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </>}
      </form>
    </div>
  </AdminDashboardPage>;
}
