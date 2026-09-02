'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, X } from 'lucide-react';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import api from '@/lib/api';

type ProviderOption = { id: string; name: string; verified?: boolean };

type TrainingForm = {
  providerId: string; name: string; nameSo: string; description: string;
  descriptionSo: string; category: string; level: string; duration: string;
  durationSo: string; deliveryMode: string; address: string; city: string;
  state: string; postalCode: string; country: string; timezone: string;
  onlineUrl: string; startDate: string; endDate: string;
  registrationDeadline: string; schedule: string; scheduleSo: string;
  cost: string; currency: string; enrollmentUrl: string; enrollmentOpen: boolean;
  imageUrl: string; gallery: string[]; providesCertificate: boolean;
  certificateUrl: string; learningOutcomes: string; requirements: string;
  featured: boolean; published: boolean;
};

const initial: TrainingForm = {
  providerId: '', name: '', nameSo: '', description: '', descriptionSo: '',
  category: '', level: '', duration: '', durationSo: '', deliveryMode: 'in_person',
  address: '', city: '', state: '', postalCode: '', country: 'Somalia',
  timezone: 'Africa/Mogadishu', onlineUrl: '', startDate: '', endDate: '',
  registrationDeadline: '', schedule: '', scheduleSo: '', cost: '0', currency: 'USD',
  enrollmentUrl: '', enrollmentOpen: true, imageUrl: '', gallery: [],
  providesCertificate: false, certificateUrl: '', learningOutcomes: '',
  requirements: '', featured: false, published: true,
};

const panel = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900';
const input = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const label = 'text-sm font-bold text-slate-700 dark:text-slate-200';

export default function AdminNewTrainingPage() {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof TrainingForm>(key: K, value: TrainingForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    api.get('/providers')
      .then((response) => setProviders(Array.isArray(response.data) ? response.data : []))
      .catch((err) => setError(err?.response?.data?.error || 'Failed to load training providers'));
  }, []);

  const uploadFile = async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    const response = await api.post('/uploads', data);
    return (response.data?.url || response.data?.publicUrl) as string;
  };

  const uploadHero = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      set('imageUrl', await uploadFile(file));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Image upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const uploadGallery = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, Math.max(0, 6 - form.gallery.length));
    if (!files.length) return;
    try {
      setUploading(true);
      const urls = await Promise.all(files.map(uploadFile));
      set('gallery', [...form.gallery, ...urls]);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Gallery upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/courses', {
        ...form,
        cost: Number(form.cost) || 0,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        registrationDeadline: form.registrationDeadline || null,
        onlineUrl: form.onlineUrl || null,
        enrollmentUrl: form.enrollmentUrl || null,
        certificateUrl: form.certificateUrl || null,
        imageUrl: form.imageUrl || null,
        learningOutcomes: form.learningOutcomes.split('\n').map((item) => item.trim()).filter(Boolean),
        requirements: form.requirements.split('\n').map((item) => item.trim()).filter(Boolean),
      });
      router.push('/admin/providers');
      router.refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create training program');
      setSaving(false);
    }
  };

  return (
    <AdminDashboardPage title="New training" description="Create the complete training profile shown on the public detail page.">
      <form onSubmit={submit} className="mx-auto max-w-6xl space-y-6 pb-8">
        {error && <div className="rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">{error}</div>}

        <section className={panel}>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Program and provider</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Training provider *"><select required className={input} value={form.providerId} onChange={(e) => set('providerId', e.target.value)}><option value="">Select provider</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}{provider.verified ? ' — verified' : ''}</option>)}</select></Field>
            <Field label="Category"><input className={input} value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Technology, Business, Health…" /></Field>
            <Field label="Training title (English) *"><input required className={input} value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Training title (Somali)"><input lang="so" className={input} value={form.nameSo} onChange={(e) => set('nameSo', e.target.value)} /></Field>
            <Field label="Description (English) *" wide><textarea required rows={5} className={input} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
            <Field label="Description (Somali)" wide><textarea lang="so" rows={5} className={input} value={form.descriptionSo} onChange={(e) => set('descriptionSo', e.target.value)} /></Field>
          </div>
        </section>

        <section className={panel}>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Format, schedule and price</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Level"><select className={input} value={form.level} onChange={(e) => set('level', e.target.value)}><option value="">All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></Field>
            <Field label="Delivery format"><select className={input} value={form.deliveryMode} onChange={(e) => set('deliveryMode', e.target.value)}><option value="in_person">In person</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></Field>
            <Field label="Duration (English) *"><input required className={input} value={form.duration} onChange={(e) => set('duration', e.target.value)} placeholder="12 weeks" /></Field>
            <Field label="Duration (Somali)"><input lang="so" className={input} value={form.durationSo} onChange={(e) => set('durationSo', e.target.value)} /></Field>
            <Field label="Schedule (English)"><input className={input} value={form.schedule} onChange={(e) => set('schedule', e.target.value)} placeholder="Mon & Wed, 6–8 PM" /></Field>
            <Field label="Schedule (Somali)"><input lang="so" className={input} value={form.scheduleSo} onChange={(e) => set('scheduleSo', e.target.value)} /></Field>
            <Field label="Start date"><input type="date" className={input} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} /></Field>
            <Field label="End date"><input type="date" className={input} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} /></Field>
            <Field label="Registration deadline"><input type="date" className={input} value={form.registrationDeadline} onChange={(e) => set('registrationDeadline', e.target.value)} /></Field>
            <Field label="Cost"><input required type="number" min="0" step="0.01" className={input} value={form.cost} onChange={(e) => set('cost', e.target.value)} /></Field>
            <Field label="Currency"><select className={input} value={form.currency} onChange={(e) => set('currency', e.target.value)}><option>USD</option><option>SOS</option><option>EUR</option><option>GBP</option></select></Field>
            <Field label="Timezone"><input className={input} value={form.timezone} onChange={(e) => set('timezone', e.target.value)} placeholder="Africa/Mogadishu" /></Field>
          </div>
        </section>

        <section className={panel}>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Location and registration</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Street address" wide><input className={input} value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
            <Field label="City"><input className={input} value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
            <Field label="State / region"><input className={input} value={form.state} onChange={(e) => set('state', e.target.value)} /></Field>
            <Field label="Postal code"><input className={input} value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} /></Field>
            <Field label="Country"><input className={input} value={form.country} onChange={(e) => set('country', e.target.value)} /></Field>
            <Field label="Online classroom URL"><input className={input} value={form.onlineUrl} onChange={(e) => set('onlineUrl', e.target.value)} placeholder="https://..." /></Field>
            <Field label="Registration URL"><input className={input} value={form.enrollmentUrl} onChange={(e) => set('enrollmentUrl', e.target.value)} placeholder="https://..." /></Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-6"><Check label="Enrollment open" checked={form.enrollmentOpen} onChange={(value) => set('enrollmentOpen', value)} /><Check label="Featured" checked={form.featured} onChange={(value) => set('featured', value)} /><Check label="Publish immediately" checked={form.published} onChange={(value) => set('published', value)} /></div>
        </section>

        <section className={panel}>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Learning content</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="What learners will learn"><textarea rows={7} className={input} value={form.learningOutcomes} onChange={(e) => set('learningOutcomes', e.target.value)} placeholder="One outcome per line" /></Field>
            <Field label="Eligibility and requirements"><textarea rows={7} className={input} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} placeholder="One requirement per line" /></Field>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2"><Check label="Provides certificate" checked={form.providesCertificate} onChange={(value) => set('providesCertificate', value)} /><Field label="Certificate URL"><input className={input} value={form.certificateUrl} onChange={(e) => set('certificateUrl', e.target.value)} placeholder="https://..." /></Field></div>
        </section>

        <section className={panel}>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Images</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-6 text-center font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"><ImagePlus className="mx-auto mb-2 text-violet-500" />{uploading ? 'Uploading…' : form.imageUrl ? 'Replace cover image' : 'Upload cover image'}<input type="file" accept="image/*" className="sr-only" onChange={uploadHero} disabled={uploading} /></label>
            <label className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-6 text-center font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"><ImagePlus className="mx-auto mb-2 text-violet-500" />{uploading ? 'Uploading…' : `Upload gallery (${form.gallery.length}/6)`}<input type="file" multiple accept="image/*" className="sr-only" onChange={uploadGallery} disabled={uploading || form.gallery.length >= 6} /></label>
          </div>
          {form.gallery.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{form.gallery.map((image, index) => <div key={`${image}-${index}`} className="relative h-24 overflow-hidden rounded-xl"><img src={image} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => set('gallery', form.gallery.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-950/75 text-white" aria-label={`Remove gallery image ${index + 1}`}><X size={13} /></button></div>)}</div>}
        </section>

        <div className="flex justify-end gap-3"><button type="button" onClick={() => router.back()} className="rounded-xl border border-slate-300 px-6 py-3 font-black text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button><button disabled={saving || uploading} className="rounded-xl bg-violet-600 px-7 py-3 font-black text-white hover:bg-violet-700 disabled:opacity-50">{saving ? 'Creating…' : 'Create training'}</button></div>
      </form>
    </AdminDashboardPage>
  );
}

function Field({ label: text, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`${label} ${wide ? 'md:col-span-2' : ''}`}>{text}{children}</label>;
}

function Check({ label: text, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className={`${label} flex items-center gap-2`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{text}</label>;
}
