'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, X } from 'lucide-react';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import api from '@/lib/api';
import BusinessLocationFields from '../BusinessLocationFields';

const categories = [
  'Retail', 'Restaurant', 'Health', 'Education', 'Technology',
  'Construction', 'Professional Services', 'Transport', 'Hospitality', 'Other',
];

type BusinessForm = {
  name: string; nameSo: string; category: string; subcategory: string;
  description: string; descriptionSo: string; logoUrl: string; bannerUrl: string;
  gallery: string[]; website: string; phone: string; email: string;
  address: string; city: string; region: string; country: string; postalCode: string;
  latitude: string; longitude: string; timezone: string; weekdayHours: string;
  weekendHours: string; serviceArea: string; hasPhysicalLocation: boolean;
  remoteAvailable: boolean; verified: boolean; claimed: boolean; featured: boolean;
  published: boolean; active: boolean;
};

const initial: BusinessForm = {
  name: '', nameSo: '', category: '', subcategory: '', description: '',
  descriptionSo: '', logoUrl: '', bannerUrl: '', gallery: [], website: '',
  phone: '', email: '', address: '', city: '', region: '', country: 'Somalia',
  postalCode: '', latitude: '', longitude: '', timezone: 'Africa/Mogadishu',
  weekdayHours: '', weekendHours: '', serviceArea: '', hasPhysicalLocation: true,
  remoteAvailable: false, verified: false, claimed: false, featured: false,
  published: true, active: true,
};

const panelClass = 'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900';
const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const labelClass = 'font-bold text-slate-700 dark:text-slate-200';

export default function NewBusinessPage() {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof BusinessForm>(key: K, value: BusinessForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const uploadFile = async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    const response = await api.post('/uploads', data);
    return response.data.url as string;
  };

  const uploadSingle = async (event: ChangeEvent<HTMLInputElement>, key: 'logoUrl' | 'bannerUrl') => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      set(key, await uploadFile(file));
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

  const locate = () => navigator.geolocation?.getCurrentPosition(
    ({ coords }) => {
      set('latitude', coords.latitude.toFixed(6));
      set('longitude', coords.longitude.toFixed(6));
    },
    () => setError('Could not access this device location. You can enter coordinates manually.'),
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { serviceArea, weekdayHours, weekendHours, ...business } = form;
      await api.post('/admin/businesses', {
        ...business,
        serviceArea: serviceArea.split(',').map((item) => item.trim()).filter(Boolean),
        openingHours: { weekdays: weekdayHours, weekends: weekendHours },
      });
      router.push('/admin/businesses');
      router.refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create business');
      setSaving(false);
    }
  };

  return (
    <AdminDashboardPage title="Add business" description="Create a complete, location-aware public business listing.">
      <form onSubmit={submit} className="mx-auto max-w-6xl space-y-6 text-slate-900 dark:text-slate-100">
        {error && <div role="alert" className="rounded-xl bg-rose-50 p-4 font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">{error}</div>}

        <section className={panelClass}>
          <h2 className="text-xl font-black dark:text-white">Business information</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className={`${labelClass} md:col-span-2`}>Business name *<input required maxLength={160} value={form.name} onChange={(e) => set('name', e.target.value)} className={`${inputClass} mt-2`} /></label>
            <label className={labelClass}>Business name (Somali)<input lang="so" value={form.nameSo} onChange={(e) => set('nameSo', e.target.value)} className={`${inputClass} mt-2`} /></label>
            <label className={labelClass}>Website<input type="url" value={form.website} onChange={(e) => set('website', e.target.value)} className={`${inputClass} mt-2`} /></label>
            <label className={labelClass}>Category *<select required value={form.category} onChange={(e) => set('category', e.target.value)} className={`${inputClass} mt-2`}><option value="">Select category</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className={labelClass}>Subcategory<input value={form.subcategory} onChange={(e) => set('subcategory', e.target.value)} placeholder="e.g. Auto repair" className={`${inputClass} mt-2`} /></label>
            <label className={`${labelClass} md:col-span-2`}>Business description *<textarea required rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} className={`${inputClass} mt-2`} /></label>
            <label className={`${labelClass} md:col-span-2`}>Business description (Somali)<textarea lang="so" rows={5} value={form.descriptionSo} onChange={(e) => set('descriptionSo', e.target.value)} className={`${inputClass} mt-2`} /></label>
          </div>
        </section>

        <section className={panelClass}>
          <h2 className="text-xl font-black dark:text-white">Address and service area</h2>
          <BusinessLocationFields {...form} inputClass={inputClass} onChange={(field, value) => set(field, value)} onLocate={locate} />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className={labelClass}>Timezone<input value={form.timezone} onChange={(e) => set('timezone', e.target.value)} placeholder="Africa/Mogadishu" className={`${inputClass} mt-2`} /></label>
            <label className={labelClass}>Service areas<input value={form.serviceArea} onChange={(e) => set('serviceArea', e.target.value)} placeholder="Mogadishu, Hargeisa, Online" className={`${inputClass} mt-2`} /><span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">Separate areas with commas.</span></label>
          </div>
          <div className="mt-5 flex flex-wrap gap-6">
            <Check label="Has a physical location" checked={form.hasPhysicalLocation} onChange={(checked) => set('hasPhysicalLocation', checked)} />
            <Check label="Remote services available" checked={form.remoteAvailable} onChange={(checked) => set('remoteAvailable', checked)} />
          </div>
        </section>

        <section className={panelClass}>
          <h2 className="text-xl font-black dark:text-white">Contact, hours and media</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className={labelClass}>Phone<input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={`${inputClass} mt-2`} /></label>
            <label className={labelClass}>Public email<input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={`${inputClass} mt-2`} /></label>
            <label className={labelClass}>Weekday opening hours<input placeholder="e.g. 8:00 AM – 6:00 PM" value={form.weekdayHours} onChange={(e) => set('weekdayHours', e.target.value)} className={`${inputClass} mt-2`} /></label>
            <label className={labelClass}>Weekend opening hours<input placeholder="e.g. 9:00 AM – 2:00 PM or Closed" value={form.weekendHours} onChange={(e) => set('weekendHours', e.target.value)} className={`${inputClass} mt-2`} /></label>
            <UploadBox label="Upload logo" ready={Boolean(form.logoUrl)} disabled={uploading} onChange={(event) => uploadSingle(event, 'logoUrl')} />
            <UploadBox label="Upload cover image" ready={Boolean(form.bannerUrl)} disabled={uploading} onChange={(event) => uploadSingle(event, 'bannerUrl')} />
            <label className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 p-5 text-center font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200 md:col-span-2">
              <ImagePlus className="mx-auto mb-2 text-primary" />Upload gallery images (up to 6)
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={uploadGallery} className="sr-only" disabled={uploading || form.gallery.length >= 6} />
              <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">{uploading ? 'Uploading…' : `${form.gallery.length} image(s) ready`}</span>
            </label>
          </div>
          {form.gallery.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">{form.gallery.map((image, index) => <div key={`${image}-${index}`} className="relative h-24 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800"><img src={image} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => set('gallery', form.gallery.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-950/75 text-white" aria-label={`Remove gallery image ${index + 1}`}><X size={13} /></button></div>)}</div>}
          <div className="mt-5 flex flex-wrap gap-6">
            <Check label="Verified business" checked={form.verified} onChange={(checked) => set('verified', checked)} />
            <Check label="Claimed profile" checked={form.claimed} onChange={(checked) => set('claimed', checked)} />
            <Check label="Feature this business" checked={form.featured} onChange={(checked) => set('featured', checked)} />
            <Check label="Publish immediately" checked={form.published} onChange={(checked) => set('published', checked)} />
            <Check label="Active listing" checked={form.active} onChange={(checked) => set('active', checked)} />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-slate-300 px-6 py-3 font-black text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button>
          <button disabled={saving || uploading} className="rounded-xl bg-blue-600 px-7 py-3 font-black text-white disabled:opacity-60">{saving ? 'Saving...' : 'Create business'}</button>
        </div>
      </form>
    </AdminDashboardPage>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}

function UploadBox({ label, ready, disabled, onChange }: { label: string; ready: boolean; disabled: boolean; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <label className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 p-5 text-center font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"><ImagePlus className="mx-auto mb-2 text-primary" />{label}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={onChange} className="sr-only" disabled={disabled} />{ready && <span className="mt-2 block text-xs text-emerald-600 dark:text-emerald-400">Image ready</span>}</label>;
}
