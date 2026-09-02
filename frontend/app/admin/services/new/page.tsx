'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Plus, X } from 'lucide-react';
import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import api from '@/lib/api';
import { serviceCategories } from '@/app/services/data/services';

type AdvancedConfig = {
  propertyType?: 'residential' | 'commercial' | 'industrial';
  suppliesProvider?: 'provider' | 'client';
  squareFootage?: number;
  roomCount?: number;
  diagnostics?: string[];
  modelBrandYear?: string;
  repairMode?: 'shop' | 'onsite';
  revisionLimit?: number;
  techStack?: string[];
  portfolioLink?: string;
  includes?: string[];
  highlights?: string[];
  packageName?: string;
  packageDescription?: string;
  revisions?: string;
  deliveryTime?: string;
  support?: string;
  expertName?: string;
  expertRole?: string;
  expertImage?: string;
};

type ServiceMode = 'draft' | 'publish';

type ServiceForm = {
  title: string;
  titleSo: string;
  category: string;
  subcategory: string;
  provider: string;
  businessId: string;
  priceLabel: string;
  priceFrom: string;
  priceType: string;
  image: string;
  description: string;
  descriptionSo: string;
  availabilityMode: 'instant_booking' | 'request_quote';
  slaResponse: string;
  gallery: string[];
  attachments: string[];
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
  serviceArea: string;
  remoteAvailable: boolean;
  verified: boolean;
  featured: boolean;
  active: boolean;
  advancedConfig: AdvancedConfig;
};

type BusinessOption = { id: string; name: string };

const initialForm: ServiceForm = {
  title: '',
  titleSo: '',
  category: '',
  subcategory: '',
  provider: '',
  businessId: '',
  priceLabel: '',
  priceFrom: '',
  priceType: 'fixed',
  image: '',
  description: '',
  descriptionSo: '',
  availabilityMode: 'instant_booking',
  slaResponse: 'Responds within 24 hours',
  gallery: [],
  attachments: [],
  phone: '',
  email: '',
  website: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Somalia',
  latitude: '',
  longitude: '',
  serviceArea: '',
  remoteAvailable: false,
  verified: false,
  featured: false,
  active: true,
  advancedConfig: { includes: [], highlights: [] },
};

const baseCategoryOptions = [
  ...serviceCategories
    .filter((category) => category !== 'All Services')
    .map((category) => ({ value: category, label: category })),
];

const diagnosticOptions = ['Screen', 'Battery', 'Engine Noise', 'Software', 'Hardware', 'Network'];

export default function AdminServiceNewPage() {
  const router = useRouter();
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<ServiceForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [techStackInput, setTechStackInput] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [attachmentsUploading, setAttachmentsUploading] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);

  const currentCategory = form.category;
  const categoryOptions = useMemo(
    () => [
      ...baseCategoryOptions,
      ...customCategories.map((category) => ({ value: category, label: category })),
    ],
    [customCategories],
  );

  useEffect(() => {
    api.get('/admin/businesses')
      .then((response) => setBusinesses(response.data?.businesses || []))
      .catch(() => setBusinesses([]));
  }, []);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data?.url as string;
  };

  const onHeroFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setHeroUploading(true);
      const url = await uploadFile(file);
      setForm((prev) => ({ ...prev, image: url }));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to upload hero image');
    } finally {
      setHeroUploading(false);
      event.target.value = '';
    }
  };

  const onGalleryFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    try {
      setGalleryUploading(true);
      const remaining = Math.max(0, 5 - form.gallery.length);
      const uploaded = await Promise.all(files.slice(0, remaining).map((file) => uploadFile(file)));
      setForm((prev) => ({ ...prev, gallery: [...prev.gallery, ...uploaded] }));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to upload gallery images');
    } finally {
      setGalleryUploading(false);
      event.target.value = '';
    }
  };

  const onAttachmentFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    try {
      setAttachmentsUploading(true);
      const uploaded = await Promise.all(files.map((file) => uploadFile(file)));
      setForm((prev) => ({ ...prev, attachments: [...prev.attachments, ...uploaded] }));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to upload attachments');
    } finally {
      setAttachmentsUploading(false);
      event.target.value = '';
    }
  };

  const updateAdvanced = (patch: Partial<AdvancedConfig>) => {
    setForm((prev) => ({ ...prev, advancedConfig: { ...prev.advancedConfig, ...patch } }));
  };

  const submitService = async (mode: ServiceMode) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/admin/services', {
        ...form,
        priceFrom: form.priceFrom === '' ? null : Number(form.priceFrom),
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        serviceArea: form.serviceArea.split(',').map((item) => item.trim()).filter(Boolean),
        badge: form.category,
        mode,
        published: mode === 'publish',
        gallery: form.gallery.length ? form.gallery : form.image ? [form.image] : [],
      });
      router.push('/admin/services');
      router.refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async (event: FormEvent, mode: ServiceMode) => {
    event.preventDefault();
    await submitService(mode);
  };

  const hasUnsavedChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form]);

  const handleDiscard = () => {
    if (hasUnsavedChanges && !confirm('Are you sure? You will lose unsaved changes.')) return;
    router.push('/admin/services');
  };

  const addCustomCategory = () => {
    const nextCategory = customCategoryInput.trim();
    if (!nextCategory) return;

    const exists = categoryOptions.some((option) => option.value.toLowerCase() === nextCategory.toLowerCase());
    if (!exists) {
      setCustomCategories((prev) => [...prev, nextCategory]);
    }
    setForm((prev) => ({ ...prev, category: nextCategory }));
    setCustomCategoryInput('');
    setShowCustomCategory(false);
  };

  const fieldLabel = 'text-sm font-medium text-slate-700 dark:text-slate-200';
  const requiredLabel = 'text-sm font-medium text-red-500';

  return (
    <AdminDashboardPage title="" description="">
      <div className="h-[calc(100vh-145px)] overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <form className="flex h-full min-h-0 flex-col" onSubmit={(event) => handleCreate(event, 'publish')}>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <h1 className="text-4xl font-black text-slate-900">New Service</h1>
            <button
              type="button"
              onClick={handleDiscard}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6 dark:bg-slate-950">
            <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-6">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="grid grid-cols-[170px_1fr] items-center gap-4">
                    <p className={fieldLabel}>Type</p>
                    <div className="flex gap-5">
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="serviceType"
                          checked={form.availabilityMode === 'instant_booking'}
                          onChange={() => setForm((prev) => ({ ...prev, availabilityMode: 'instant_booking' }))}
                        />
                        Instant Booking
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="serviceType"
                          checked={form.availabilityMode === 'request_quote'}
                          onChange={() => setForm((prev) => ({ ...prev, availabilityMode: 'request_quote' }))}
                        />
                        Service
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-[170px_1fr] items-center gap-4">
                    <label className={requiredLabel}>Name*</label>
                    <input
                      className="input-field"
                      placeholder="Service name"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-[170px_1fr] items-center gap-4">
                    <label className={fieldLabel}>Provider</label>
                    <input
                      className="input-field"
                      placeholder="Provider name"
                      value={form.provider}
                      onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-[170px_1fr] items-center gap-4">
                    <label className={fieldLabel}>Category</label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <select
                          className="input-field"
                          value={form.category}
                          onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                          required
                        >
                          <option value="">Select service category</option>
                          {categoryOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowCustomCategory((prev) => !prev)}
                          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Plus size={16} />
                          Add new
                        </button>
                      </div>

                      {showCustomCategory && (
                        <div className="flex gap-2">
                          <input
                            className="input-field"
                            placeholder="New category name"
                            value={customCategoryInput}
                            onChange={(e) => setCustomCategoryInput(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={addCustomCategory}
                            className="h-12 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={onHeroFileSelected} />
                  <ImagePlus className="mx-auto h-12 w-12 text-slate-400" />
                  <p className="mt-4 text-base text-slate-500">Drag image(s) here or</p>
                  <button
                    type="button"
                    onClick={() => heroInputRef.current?.click()}
                    className="text-xl font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Browse images
                  </button>
                  <p className="mt-3 text-xs text-slate-500">
                    {heroUploading ? 'Uploading hero image...' : form.image ? 'Hero image uploaded' : 'No file selected'}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <input className="input-field" placeholder="Title (Somali)" value={form.titleSo} onChange={(e) => setForm((prev) => ({ ...prev, titleSo: e.target.value }))} />
                  <textarea className="input-field min-h-[90px]" placeholder="Description (English)" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} required />
                  <input className="input-field" placeholder="Price label (e.g. $120)" value={form.priceLabel} onChange={(e) => setForm((prev) => ({ ...prev, priceLabel: e.target.value }))} required />
                  <select className="input-field" value={form.slaResponse} onChange={(e) => setForm((prev) => ({ ...prev, slaResponse: e.target.value }))}>
                    <option>Responds within 1 hour</option>
                    <option>Responds within 24 hours</option>
                    <option>Responds within 48 hours</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <textarea className="input-field min-h-[90px]" placeholder="Description (Somali)" value={form.descriptionSo} onChange={(e) => setForm((prev) => ({ ...prev, descriptionSo: e.target.value }))} />
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-1 text-2xl font-black text-slate-900 dark:text-white">Public service details</h2>
              <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">These values appear on the service detail page.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <label className={fieldLabel}>Related business
                  <select className="input-field mt-2" value={form.businessId} onChange={(e) => setForm((prev) => ({ ...prev, businessId: e.target.value }))}>
                    <option value="">No linked business</option>
                    {businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
                  </select>
                </label>
                <label className={fieldLabel}>Subcategory<input className="input-field mt-2" value={form.subcategory} onChange={(e) => setForm((prev) => ({ ...prev, subcategory: e.target.value }))} placeholder="e.g. Oil change" /></label>
                <label className={fieldLabel}>Starting price<input type="number" min="0" step="0.01" className="input-field mt-2" value={form.priceFrom} onChange={(e) => setForm((prev) => ({ ...prev, priceFrom: e.target.value }))} placeholder="39.99" /></label>
                <label className={fieldLabel}>Price type<select className="input-field mt-2" value={form.priceType} onChange={(e) => setForm((prev) => ({ ...prev, priceType: e.target.value }))}><option value="fixed">Fixed price</option><option value="hourly">Hourly</option><option value="starting_at">Starting at</option><option value="quote">Request quote</option></select></label>
                <label className={fieldLabel}>Delivery / duration<input className="input-field mt-2" value={form.advancedConfig.deliveryTime || ''} onChange={(e) => updateAdvanced({ deliveryTime: e.target.value })} placeholder="e.g. 45 minutes" /></label>
                <label className={fieldLabel}>Package name<input className="input-field mt-2" value={form.advancedConfig.packageName || ''} onChange={(e) => updateAdvanced({ packageName: e.target.value })} placeholder="e.g. Standard" /></label>
                <label className={`${fieldLabel} md:col-span-2`}>Package description<textarea className="input-field mt-2 min-h-[80px]" value={form.advancedConfig.packageDescription || ''} onChange={(e) => updateAdvanced({ packageDescription: e.target.value })} /></label>
                <label className={fieldLabel}>Support / warranty<input className="input-field mt-2" value={form.advancedConfig.support || ''} onChange={(e) => updateAdvanced({ support: e.target.value })} placeholder="e.g. 30-day warranty" /></label>
                <label className={fieldLabel}>Revisions / follow-ups<input className="input-field mt-2" value={form.advancedConfig.revisions || ''} onChange={(e) => updateAdvanced({ revisions: e.target.value })} placeholder="e.g. One follow-up included" /></label>
                <label className={fieldLabel}>What is included<textarea className="input-field mt-2 min-h-[120px]" value={(form.advancedConfig.includes || []).join('\n')} onChange={(e) => updateAdvanced({ includes: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })} placeholder="One item per line" /></label>
                <label className={fieldLabel}>Highlights<textarea className="input-field mt-2 min-h-[120px]" value={(form.advancedConfig.highlights || []).join('\n')} onChange={(e) => updateAdvanced({ highlights: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })} placeholder="One highlight per line" /></label>
                <label className={fieldLabel}>Expert name<input className="input-field mt-2" value={form.advancedConfig.expertName || ''} onChange={(e) => updateAdvanced({ expertName: e.target.value })} /></label>
                <label className={fieldLabel}>Expert role<input className="input-field mt-2" value={form.advancedConfig.expertRole || ''} onChange={(e) => updateAdvanced({ expertRole: e.target.value })} /></label>
                <label className={`${fieldLabel} md:col-span-2`}>Expert image path or URL<input className="input-field mt-2" value={form.advancedConfig.expertImage || ''} onChange={(e) => updateAdvanced({ expertImage: e.target.value })} placeholder="/uploads/expert.jpg or https://..." /></label>
              </div>
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-5 text-2xl font-black text-slate-900 dark:text-white">Contact and service area</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="input-field" placeholder="Phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
                <input type="email" className="input-field" placeholder="Public email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
                <input type="url" className="input-field" placeholder="Website" value={form.website} onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))} />
                <input className="input-field" placeholder="Country" value={form.country} onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))} />
                <input className="input-field md:col-span-2" placeholder="Street address" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
                <input className="input-field" placeholder="City" value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
                <input className="input-field" placeholder="State / region" value={form.state} onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))} />
                <input className="input-field" placeholder="Postal code" value={form.postalCode} onChange={(e) => setForm((prev) => ({ ...prev, postalCode: e.target.value }))} />
                <input className="input-field" placeholder="Service areas, comma separated" value={form.serviceArea} onChange={(e) => setForm((prev) => ({ ...prev, serviceArea: e.target.value }))} />
                <input type="number" step="any" min="-90" max="90" className="input-field" placeholder="Latitude" value={form.latitude} onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))} />
                <input type="number" step="any" min="-180" max="180" className="input-field" placeholder="Longitude" value={form.longitude} onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))} />
              </div>
              <div className="mt-5 flex flex-wrap gap-6 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.remoteAvailable} onChange={(e) => setForm((prev) => ({ ...prev, remoteAvailable: e.target.checked }))} />Remote available</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.verified} onChange={(e) => setForm((prev) => ({ ...prev, verified: e.target.checked }))} />Verified</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))} />Featured</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />Active</label>
              </div>
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-5 text-2xl font-black text-slate-900 dark:text-white">Gallery and attachments</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-5 text-center text-sm font-semibold dark:border-slate-700">{galleryUploading ? 'Uploading gallery…' : `Upload gallery images (${form.gallery.length}/5)`}<input type="file" multiple accept="image/*" className="sr-only" onChange={onGalleryFilesSelected} disabled={galleryUploading || form.gallery.length >= 5} /></label>
                <label className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-5 text-center text-sm font-semibold dark:border-slate-700">{attachmentsUploading ? 'Uploading attachments…' : `Upload attachments (${form.attachments.length})`}<input type="file" multiple className="sr-only" onChange={onAttachmentFilesSelected} disabled={attachmentsUploading} /></label>
              </div>
              {form.gallery.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">{form.gallery.map((image, index) => <div key={`${image}-${index}`} className="relative h-24 overflow-hidden rounded-lg"><img src={image} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => setForm((prev) => ({ ...prev, gallery: prev.gallery.filter((_, itemIndex) => itemIndex !== index) }))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-950/70 text-white" aria-label={`Remove gallery image ${index + 1}`}><X size={13} /></button></div>)}</div>}
            </section>

            {(currentCategory === 'Cleaning & Maintenance' || currentCategory === 'Electronic & Mechanical Repair' || currentCategory === 'Design & Coding') && (
              <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-4 text-2xl font-black text-slate-900">Advanced Inputs</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {currentCategory === 'Cleaning & Maintenance' && (
                    <>
                      <div className="rounded-lg border border-slate-200 p-3 md:col-span-2">
                        <p className="mb-2 text-xs font-semibold text-slate-600">Property Type</p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          {['residential', 'commercial', 'industrial'].map((type) => (
                            <label key={type} className="inline-flex items-center gap-2">
                              <input type="radio" checked={form.advancedConfig.propertyType === type} onChange={() => updateAdvanced({ propertyType: type as AdvancedConfig['propertyType'] })} />
                              <span className="capitalize">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <select className="input-field" value={form.advancedConfig.suppliesProvider || ''} onChange={(e) => updateAdvanced({ suppliesProvider: e.target.value as AdvancedConfig['suppliesProvider'] })}>
                        <option value="">Supplies Provider</option>
                        <option value="provider">Provider brings supplies</option>
                        <option value="client">Client provides supplies</option>
                      </select>
                      <input className="input-field" type="number" min={0} placeholder="Square footage" value={form.advancedConfig.squareFootage || ''} onChange={(e) => updateAdvanced({ squareFootage: Number(e.target.value) || undefined })} />
                      <input className="input-field" type="number" min={0} placeholder="Room count" value={form.advancedConfig.roomCount || ''} onChange={(e) => updateAdvanced({ roomCount: Number(e.target.value) || undefined })} />
                    </>
                  )}

                  {currentCategory === 'Electronic & Mechanical Repair' && (
                    <>
                      <div className="rounded-lg border border-slate-200 p-3 md:col-span-2">
                        <p className="mb-2 text-xs font-semibold text-slate-600">Device Diagnostics</p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          {diagnosticOptions.map((item) => {
                            const selected = form.advancedConfig.diagnostics || [];
                            const checked = selected.includes(item);
                            return (
                              <label key={item} className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const next = checked ? selected.filter((entry) => entry !== item) : [...selected, item];
                                    updateAdvanced({ diagnostics: next });
                                  }}
                                />
                                {item}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <input className="input-field" placeholder="Model / Brand / Year" value={form.advancedConfig.modelBrandYear || ''} onChange={(e) => updateAdvanced({ modelBrandYear: e.target.value })} />
                      <select className="input-field" value={form.advancedConfig.repairMode || ''} onChange={(e) => updateAdvanced({ repairMode: e.target.value as AdvancedConfig['repairMode'] })}>
                        <option value="">On-site vs Shop</option>
                        <option value="shop">I will go to the shop</option>
                        <option value="onsite">Provider comes to me</option>
                      </select>
                    </>
                  )}

                  {currentCategory === 'Design & Coding' && (
                    <>
                      <input className="input-field" type="number" min={0} placeholder="Revision limit" value={form.advancedConfig.revisionLimit || ''} onChange={(e) => updateAdvanced({ revisionLimit: Number(e.target.value) || undefined })} />
                      <input className="input-field" placeholder="Portfolio link" value={form.advancedConfig.portfolioLink || ''} onChange={(e) => updateAdvanced({ portfolioLink: e.target.value })} />
                      <div className="rounded-lg border border-slate-200 p-3 md:col-span-2">
                        <label className="text-xs font-semibold text-slate-600">Tech Stack / Tools (comma separated)</label>
                        <input
                          className="input-field mt-2"
                          placeholder="React, Figma, Photoshop"
                          value={techStackInput}
                          onChange={(e) => setTechStackInput(e.target.value)}
                          onBlur={() => updateAdvanced({ techStack: techStackInput.split(',').map((item) => item.trim()).filter(Boolean) })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}
          </div>

          <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <button type="button" disabled={submitting} onClick={() => void submitService('draft')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              Save as Draft
            </button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              Publish
            </button>
            <button type="button" onClick={handleDiscard} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              Cancel / Discard
            </button>
          </div>

          {error && <p className="px-6 py-3 text-sm font-semibold text-red-600">{error}</p>}
        </form>
      </div>
    </AdminDashboardPage>
  );
}
