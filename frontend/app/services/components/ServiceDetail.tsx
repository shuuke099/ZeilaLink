'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Maximize2,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { getSafeStripeCheckoutUrl } from '@/lib/safeUrl';
import type { ServiceItem } from '../data/services';

type ServiceDetailProps = {
  service: ServiceItem;
  isEn: boolean;
};

type LocationMode = 'onsite' | 'remote';

type BookingFormState = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  responsibleFullName: string;
  serviceDateTime: string;
  locationMode: LocationMode;
  locationAddress: string;
  notes: string;
};

type PaidBookingSummary = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  responsibleFullName?: string | null;
  serviceDateTime?: string | null;
  isRemote?: boolean;
  locationAddress?: string | null;
  notes?: string | null;
  service?: {
    title?: string;
    provider?: string;
    category?: string;
    priceLabel?: string;
  };
};

const initialBookingState: BookingFormState = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  responsibleFullName: '',
  serviceDateTime: '',
  locationMode: 'onsite',
  locationAddress: '',
  notes: '',
};

export default function ServiceDetail({ service, isEn }: ServiceDetailProps) {
  const { user } = useAuth();
  const [isBooking, setIsBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [form, setForm] = useState<BookingFormState>(initialBookingState);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [paidBooking, setPaidBooking] = useState<PaidBookingSummary | null>(null);
  const [processedSessionId, setProcessedSessionId] = useState<string | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);

  const gallery = useMemo(() => {
    const serviceGallery = Array.isArray(service.gallery)
      ? service.gallery.filter(Boolean)
      : [];

    return serviceGallery.length > 0 ? serviceGallery : [service.image];
  }, [service.gallery, service.image]);

  const galleryFallback = Array.from(
    { length: 4 },
    (_, index) => gallery[index % gallery.length],
  );

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      customerName: user?.name || prev.customerName,
      customerEmail: user?.email || prev.customerEmail,
      customerPhone: user?.phone || prev.customerPhone,
    }));
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const bookingStatus = searchParams.get('booking');
    const sessionId = searchParams.get('session_id');
    if (bookingStatus === 'success') {
      if (sessionId && user && processedSessionId !== sessionId) {
        setProcessedSessionId(sessionId);
        api.post('/services/bookings/confirm-payment', { sessionId })
          .then((response) => {
            if (response?.data?.booking) {
              setPaidBooking(response.data.booking as PaidBookingSummary);
            }
            setBookingMessage(isEn ? 'Payment successful. Your booking is confirmed.' : 'Lacag bixintu way guulaysatay. Dalabkaaga waa la xaqiijiyay.');
          })
          .catch((error: any) => {
            setBookingMessage(
              error?.response?.data?.error ||
              (isEn ? 'Payment was completed, but confirmation failed. Please contact support.' : 'Lacag bixinta waa guulaysatay, laakiin xaqiijintu way fashilantay. Fadlan la xiriir taageerada.'),
            );
          });
      } else {
        setBookingMessage(isEn ? 'Payment successful. Your booking is confirmed.' : 'Lacag bixintu way guulaysatay. Dalabkaaga waa la xaqiijiyay.');
      }
    }
    if (bookingStatus === 'cancelled') {
      setBookingMessage(isEn ? 'Checkout cancelled. You can try again anytime.' : 'Lacag bixinta waa la joojiyay. Mar kasta waad isku dayi kartaa.');
    }
  }, [isEn, user, processedSessionId]);

  useEffect(() => {
    if (activeGalleryIndex === null) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveGalleryIndex(null);
      } else if (event.key === 'ArrowLeft') {
        setActiveGalleryIndex((current) =>
          current === null
            ? null
            : (current - 1 + gallery.length) % gallery.length,
        );
      } else if (event.key === 'ArrowRight') {
        setActiveGalleryIndex((current) =>
          current === null ? null : (current + 1) % gallery.length,
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [activeGalleryIndex, gallery.length]);

  useEffect(() => {
    setActiveGalleryIndex(null);
  }, [service.id]);

  const validationError = useMemo(() => {
    if (!form.customerName.trim() || !form.customerEmail.trim()) {
      return isEn ? 'You must be logged in to continue.' : 'Si aad u sii wadato waa inaad gashaa akoonkaaga.';
    }
    if (!form.customerPhone.trim()) {
      return isEn ? 'Phone number is required.' : 'Lambarka telefoonka waa qasab.';
    }
    if (!form.responsibleFullName.trim()) {
      return isEn ? 'Responsible full name is required.' : 'Magaca buuxa ee masuulka ah waa qasab.';
    }
    if (!form.serviceDateTime) {
      return isEn ? 'Service date and time is required.' : 'Taariikhda iyo waqtiga adeegga waa qasab.';
    }
    if (form.locationMode === 'onsite' && !form.locationAddress.trim()) {
      return isEn ? 'Address is required for on-site services.' : 'Cinwaanku waa qasab marka adeeggu goobta ka dhacayo.';
    }
    return null;
  }, [form, isEn]);

  const handleBookService = async () => {
    if (service.isDemo) {
      setBookingMessage(
        isEn
          ? 'Demo preview only. Booking is disabled for sample services.'
          : 'Kani waa tusaale keliya. Dalabka adeegyada tijaabada ah waa xiran yahay.',
      );
      return;
    }

    if (!user) {
      const nextPath = `/services/${service.id}`;
      window.location.href = `/login?redirect=${encodeURIComponent(nextPath)}`;
      return;
    }

    if (validationError) {
      setBookingMessage(validationError);
      return;
    }

    setIsBooking(true);
    setBookingMessage(null);

    try {
      const response = await api.post(`/services/${service.id}/book/checkout`, {
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        responsibleFullName: form.responsibleFullName,
        serviceDateTime: form.serviceDateTime,
        locationMode: form.locationMode,
        locationAddress: form.locationMode === 'onsite' ? form.locationAddress : '',
        notes: form.notes,
      });

      const checkoutUrl = getSafeStripeCheckoutUrl(response?.data?.checkoutUrl);
      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }

      setBookingMessage(isEn ? 'Unable to start Stripe checkout. Please try again.' : 'Bilaabista Stripe checkout waa fashilantay. Fadlan mar kale isku day.');
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        (isEn ? 'Failed to start booking checkout. Please try again.' : 'Bilaabista dalabka checkout waa fashilantay. Fadlan mar kale isku day.');
      setBookingMessage(message);
    } finally {
      setIsBooking(false);
    }
  };

  const highlights = service.highlights.length > 0 ? service.highlights : [isEn ? 'Trusted service' : 'Adeeg lagu kalsoon yahay'];
  const includes = service.includes.length > 0 ? service.includes : [isEn ? 'Consultation included' : 'La-talin ayaa ku jirta'];

  const showPreviousImage = () => {
    setActiveGalleryIndex((current) =>
      current === null
        ? null
        : (current - 1 + gallery.length) % gallery.length,
    );
  };

  const showNextImage = () => {
    setActiveGalleryIndex((current) =>
      current === null ? null : (current + 1) % gallery.length,
    );
  };

  const renderGalleryImage = (
    displayIndex: number,
    className: string,
    alt: string,
  ) => {
    const galleryIndex = displayIndex % gallery.length;

    return (
      <button
        type="button"
        onClick={() => setActiveGalleryIndex(galleryIndex)}
        className={`group relative block w-full cursor-zoom-in overflow-hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${className}`}
        aria-label={
          isEn
            ? `Preview image ${galleryIndex + 1}`
            : `Daawo sawirka ${galleryIndex + 1}`
        }
        aria-haspopup="dialog"
      >
        <img
          src={galleryFallback[displayIndex]}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/70 text-white shadow-lg backdrop-blur-sm transition-colors group-hover:bg-primary">
          <Maximize2 size={17} aria-hidden="true" />
        </span>
      </button>
    );
  };

  return (
    <>
    <section className="pt-6 pb-16 px-4 sm:px-6 lg:px-8 bg-background transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {service.category} | {service.provider}
        </div>

        {service.isDemo && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold leading-relaxed text-amber-950"
          >
            {isEn
              ? 'Demo preview — the provider, price, rating, reviews, and service details below are sample content. Booking is disabled.'
              : 'Tani waa tusaale — bixiyaha, qiimaha, qiimeynta, faallooyinka, iyo faahfaahinta adeeggu waa xog tijaabo ah. Dalabku waa xiran yahay.'}
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">{service.title}</h1>

        <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
          <span className="font-semibold text-slate-800">{service.rating.toFixed(1)}</span>
          <span>({service.reviews} {isEn ? 'reviews' : 'faallo'})</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {renderGalleryImage(
                0,
                'col-span-2 h-80 rounded-xl',
                service.title,
              )}
              <div className="grid gap-3">
                {renderGalleryImage(
                  1,
                  'h-[154px] rounded-xl',
                  `${service.title} gallery 2`,
                )}
                {renderGalleryImage(
                  2,
                  'h-[154px] rounded-xl',
                  `${service.title} gallery 3`,
                )}
              </div>
              {renderGalleryImage(
                3,
                'col-span-3 h-48 rounded-xl',
                `${service.title} gallery 4`,
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xl font-black text-slate-900 mb-3">{isEn ? 'About this service' : 'Ku saabsan adeeggan'}</h2>
              <p className="text-slate-600 leading-relaxed">{service.description}</p>

              <div className="grid sm:grid-cols-3 gap-3 mt-6">
                {highlights.map((item) => (
                  <div key={item} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-50">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-black text-slate-900 mb-4">{isEn ? "What's included" : 'Waxa ku jira'}</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {includes.map((item) => (
                  <div key={item} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="mt-1 w-2 h-2 rounded-full bg-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <img src={service.expertImage || service.image} alt={service.expertName || service.provider} className="w-16 h-16 rounded-lg object-cover" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isEn ? 'Meet your expert' : 'La kulan khabiirka'}</p>
                <h4 className="font-bold text-slate-900">{service.expertName || service.provider}</h4>
                <p className="text-sm text-slate-600">{service.expertRole || (isEn ? 'Service Consultant' : 'La-taliye adeeg')}</p>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-24">
              <div className="inline-flex bg-slate-100 rounded-full p-1 text-xs font-semibold mb-4">
                <span className="px-3 py-1 rounded-full bg-white text-primary shadow-sm">{service.packageName || (isEn ? 'Standard' : 'Heer caadi')}</span>
              </div>

              <p className="text-4xl font-black text-slate-900 mb-1">{service.priceLabel}</p>
              <p className="text-sm text-slate-600 mb-5">{service.packageDescription || (isEn ? 'Service package' : 'Xirmada adeegga')}</p>

              <div className="space-y-3 text-sm text-slate-700 mb-6">
                <div className="flex items-center gap-2"><Clock3 size={16} className="text-primary" /> {service.deliveryTime || (isEn ? 'Flexible delivery' : 'Waqti dabacsan')}</div>
                <div className="flex items-center gap-2"><RotateCcw size={16} className="text-primary" /> {service.revisions || (isEn ? 'Revisions available' : 'Dib u eegis waa la heli karaa')}</div>
                <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-primary" /> {service.support || (isEn ? 'Support included' : 'Taageero ayaa ku jirta')}</div>
              </div>

              {service.isDemo ? (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
                  {isEn
                    ? 'Demo preview only — booking is unavailable.'
                    : 'Kani waa tusaale keliya — dalab lama samayn karo.'}
                </div>
              ) : !showBookingForm ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingForm(true);
                    setBookingMessage(null);
                  }}
                  className="btn-primary w-full mb-3"
                >
                  {isEn ? 'Book This Service' : 'Dalbo Adeeggan'}
                </button>
              ) : (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{isEn ? 'Logged-in name' : 'Magaca akoonka'}</label>
                    <input
                      type="text"
                      value={form.customerName}
                      readOnly
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-slate-100 text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{isEn ? 'Phone number' : 'Lambarka telefoonka'}</label>
                    <input
                      type="tel"
                      value={form.customerPhone}
                      onChange={(event) => setForm((prev) => ({ ...prev, customerPhone: event.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder={isEn ? '+252...' : '+252...'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{isEn ? 'Full name responsible' : 'Magaca buuxa ee masuulka'}</label>
                    <input
                      type="text"
                      value={form.responsibleFullName}
                      onChange={(event) => setForm((prev) => ({ ...prev, responsibleFullName: event.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder={isEn ? 'Who is responsible for this booking?' : 'Yaa masuul ka ah dalabkan?'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{isEn ? 'Service date and time' : 'Taariikhda iyo waqtiga adeegga'}</label>
                    <input
                      type="datetime-local"
                      value={form.serviceDateTime}
                      onChange={(event) => setForm((prev) => ({ ...prev, serviceDateTime: event.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{isEn ? 'Service mode' : 'Nooca adeegga'}</label>
                    <select
                      value={form.locationMode}
                      onChange={(event) => setForm((prev) => ({ ...prev, locationMode: event.target.value as LocationMode }))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="onsite">{isEn ? 'On-site' : 'Goobta'}</option>
                      <option value="remote">{isEn ? 'Remote / Online' : 'Fog / Online'}</option>
                    </select>
                  </div>
                  {form.locationMode === 'onsite' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{isEn ? 'Location / Address' : 'Goobta / Cinwaanka'}</label>
                      <input
                        type="text"
                        value={form.locationAddress}
                        onChange={(event) => setForm((prev) => ({ ...prev, locationAddress: event.target.value }))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        placeholder={isEn ? 'Street address' : 'Cinwaanka waddada'}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{isEn ? 'Additional notes (optional)' : 'Fiiro gaar ah (ikhtiyaari)'}</label>
                    <textarea
                      value={form.notes}
                      onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[78px]"
                      placeholder={isEn ? 'Any special instructions?' : 'Tilmaamo gaar ah ma jiraan?'}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleBookService}
                    disabled={isBooking}
                    className="btn-primary w-full mb-3 disabled:opacity-60"
                  >
                    {isBooking
                      ? (isEn ? 'Redirecting to Stripe...' : 'Waxa loo gudbinayaa Stripe...')
                      : (isEn ? 'Continue to Stripe Checkout' : 'U gudub Stripe Checkout')}
                  </button>
                </div>
              )}
              <button type="button" className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                {isEn ? 'Contact Consultant' : 'La xiriir lataliye'}
              </button>

              {bookingMessage && (
                <div className="mt-3 text-xs font-semibold text-primary">
                  {bookingMessage}
                </div>
              )}

              <div className="mt-5 border-t border-slate-200 pt-4 text-xs text-slate-500 flex items-center gap-2">
                <MessageCircle size={14} className="text-primary" />
                {isEn ? 'Response time usually within 1 hour' : 'Jawaab celin inta badan 1 saac gudahood'}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>

    {activeGalleryIndex !== null && (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 p-3 backdrop-blur-md sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-label={isEn ? 'Service image preview' : 'Daawashada sawirka adeegga'}
        onClick={() => setActiveGalleryIndex(null)}
      >
        <button
          type="button"
          onClick={() => setActiveGalleryIndex(null)}
          className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-xl backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-7 sm:top-7"
          aria-label={isEn ? 'Close preview' : 'Xir sawirka'}
        >
          <X size={24} aria-hidden="true" />
        </button>

        <div
          className="relative flex w-full max-w-6xl items-center justify-center"
          onClick={(event) => event.stopPropagation()}
        >
          <img
            src={gallery[activeGalleryIndex]}
            alt={`${service.title} ${activeGalleryIndex + 1}`}
            className="max-h-[calc(100dvh-7rem)] max-w-full rounded-xl object-contain shadow-2xl sm:max-h-[calc(100dvh-6rem)]"
          />

          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPreviousImage}
                className="absolute left-1 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/70 text-white shadow-xl backdrop-blur-md transition-all hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4 sm:h-14 sm:w-14"
                aria-label={isEn ? 'Previous image' : 'Sawirkii hore'}
              >
                <ChevronLeft size={28} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={showNextImage}
                className="absolute right-1 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/70 text-white shadow-xl backdrop-blur-md transition-all hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4 sm:h-14 sm:w-14"
                aria-label={isEn ? 'Next image' : 'Sawirka xiga'}
              >
                <ChevronRight size={28} aria-hidden="true" />
              </button>
            </>
          )}

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-slate-950/75 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md sm:bottom-5 sm:text-sm">
            {activeGalleryIndex + 1} / {gallery.length}
          </div>
        </div>
      </div>
    )}

    {paidBooking && (
      <div className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-black text-slate-900">{isEn ? 'Booking Confirmed' : 'Dalabka Waa La Xaqiijiyay'}</h3>
            <p className="text-xs text-slate-600 mt-1">{isEn ? 'Payment received via Stripe.' : 'Lacagta waxaa lagu helay Stripe.'}</p>
          </div>
          <div className="p-5 space-y-3 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">{isEn ? 'Service:' : 'Adeegga:'}</span> {paidBooking.service?.title || service.title}</p>
            <p><span className="font-semibold text-slate-900">{isEn ? 'Provider:' : 'Bixiyaha:'}</span> {paidBooking.service?.provider || service.provider}</p>
            <p><span className="font-semibold text-slate-900">{isEn ? 'Price:' : 'Qiimaha:'}</span> {paidBooking.service?.priceLabel || service.priceLabel}</p>
            <p><span className="font-semibold text-slate-900">{isEn ? 'Booking ID:' : 'Lambarka Dalabka:'}</span> {paidBooking.id}</p>
            <p><span className="font-semibold text-slate-900">{isEn ? 'Logged-in name:' : 'Magaca akoonka:'}</span> {paidBooking.customerName}</p>
            <p><span className="font-semibold text-slate-900">{isEn ? 'Phone:' : 'Telefoon:'}</span> {paidBooking.customerPhone || '-'}</p>
            <p><span className="font-semibold text-slate-900">{isEn ? 'Responsible full name:' : 'Magaca buuxa ee masuulka:'}</span> {paidBooking.responsibleFullName || '-'}</p>
            <p><span className="font-semibold text-slate-900">{isEn ? 'Service date/time:' : 'Taariikh/Waqti:'}</span> {paidBooking.serviceDateTime ? new Date(paidBooking.serviceDateTime).toLocaleString() : '-'}</p>
            <p><span className="font-semibold text-slate-900">{isEn ? 'Mode:' : 'Nooca:'}</span> {paidBooking.isRemote ? (isEn ? 'Remote / Online' : 'Fog / Online') : (isEn ? 'On-site' : 'Goobta')}</p>
            {!paidBooking.isRemote && (
              <p><span className="font-semibold text-slate-900">{isEn ? 'Address:' : 'Cinwaanka:'}</span> {paidBooking.locationAddress || '-'}</p>
            )}
            <p><span className="font-semibold text-slate-900">{isEn ? 'Notes:' : 'Qoraal:'}</span> {paidBooking.notes || (isEn ? 'None' : 'Maya')}</p>
          </div>
          <div className="p-4 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={() => setPaidBooking(null)}
              className="px-4 py-2 rounded-lg bg-primary text-white font-semibold"
            >
              {isEn ? 'Close' : 'Xir'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
