'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ImagePreviewModal from '@/components/ImagePreviewModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSafeMailtoUrl, getSafeStoredUrl, getSafeTelUrl } from '@/lib/safeUrl';
import { Award, BookOpen, CalendarDays, Check, CheckCircle2, Clock3, Copy, DollarSign, ExternalLink, FileCheck2, Globe2, GraduationCap, Heart, Languages, Mail, MapPin, Monitor, Phone, Share2, ShieldCheck, Star, UserRound, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface TrainingDetail {
  id: string; slug?: string | null; name: string; nameSo?: string | null;
  description: string; descriptionSo?: string | null; duration: string; durationSo?: string | null;
  cost: number; currency?: string; imageUrl?: string | null; gallery?: string[];
  providesCertificate?: boolean; certificateUrl?: string | null; featured?: boolean;
  category?: string | null; level?: string | null; deliveryMode?: string | null;
  address?: string | null; city?: string | null; state?: string | null; postalCode?: string | null;
  country?: string | null; onlineUrl?: string | null; enrollmentUrl?: string | null;
  enrollmentOpen?: boolean; startDate?: string | null; endDate?: string | null;
  registrationDeadline?: string | null; schedule?: string | null; scheduleSo?: string | null;
  learningOutcomes?: string[]; requirements?: string[];
  skills?: Array<{ id?: string; name: string }>;
  provider: { id: string; slug?: string | null; name: string; nameSo?: string | null; logoUrl?: string | null; description?: string | null; descriptionSo?: string | null; rating?: number | null; verified?: boolean | null; website?: string | null; phone?: string | null; email?: string | null; address?: string | null; city?: string | null; state?: string | null; postalCode?: string | null };
}

type Props = { initialTraining: TrainingDetail; publicPath: string };
const panel = 'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';
const valueMaps: Record<string, string> = { Beginner: 'Bilow', Intermediate: 'Dhexdhexaad', Advanced: 'Sare', Technology: 'Tiknoolajiyad', Business: 'Ganacsi', Health: 'Caafimaad', Trades: 'Farsamooyin', Language: 'Luqado', Languages: 'Luqado', Arts: 'Farshaxan', General: 'Guud', Online: 'Onlayn', 'In Person': 'Goob joog', Hybrid: 'Isku dhafan', 'All levels': 'Dhammaan heerarka' };
const courseContentSo: Record<string, string> = {
  'Use medical terminology in administrative work': 'U adeegso eray-bixinta caafimaadka shaqada maamulka',
  'Understand patient-information privacy and professional ethics': 'Faham asturnaanta macluumaadka bukaanka iyo anshaxa xirfadeed',
  'Practice medical office procedures': 'Ku tababar habraacyada xafiiska caafimaadka',
  'Understand insurance, billing, and coding basics': 'Faham aasaaska caymiska, biilasha iyo koodhaynta caafimaadka',
  'Use office software and professional communication': 'Adeegso barnaamijyada xafiiska iyo isgaarsiinta xirfadeed',
  'Be at least 18 years old': 'Da’daadu ha ahaato ugu yaraan 18 sano',
  'Have a high-school diploma or GED': 'Hayso shahaadada dugsiga sare ama GED',
  'Provide valid government-issued identification': 'Soo bandhig aqoonsi dowladeed oo ansax ah',
  'Meet Summit’s placement-test requirements': 'Buuxi shuruudaha imtixaanka meelaynta ee Summit',
  'Complete required admissions, FAFSA, and financial-aid steps': 'Dhammaystir tallaabooyinka gelitaanka, FAFSA iyo kaalmada dhaqaale ee loo baahan yahay',
  'Confirm current eligibility, cohort location, dates, and seat availability directly with Summit': 'Si toos ah Summit uga xaqiiji u-qalmitaanka hadda, goobta kooxda, taariikhaha iyo kuraasta bannaan',
  'Practical, job-ready knowledge': 'Aqoon wax ku ool ah oo shaqo diyaar u ah',
  'Industry-standard tools and workflows': 'Qalabka iyo habraacyada heerka warshadaha',
  'Hands-on exercises and guided practice': 'Layli gacanta ah iyo tababar hagitaan leh',
  'Confidence to apply your new skills': 'Kalsooni aad xirfadahaaga cusub ku adeegsan karto',
  'No prior professional experience required': 'Khibrad xirfadeed oo hore looma baahna',
  'Basic computer skills recommended': 'Xirfadaha kombiyuutarka aasaasiga ah waa lagu talinayaa',
  'Reliable internet access for online sessions': 'Internet la isku halayn karo ayaa looga baahan yahay casharrada onlaynka ah',
  'Commitment to complete course activities': 'Ballanqaad dhammaystirka hawlaha koorsada',
};
const translateDescriptionToSomali = (value: string) => {
  const translations: Array<[string, string]> = [
    ['Summit advertises no out-of-pocket cost to students, supported by financial aid and gift funding.', 'Summit waxay sheegaysaa in ardaydu aysan jeebkooda wax lacag ah ka bixin, iyadoo ay taageerayaan kaalmada dhaqaale iyo deeqaha.'],
    ['Applicants must complete the required admissions and financial-aid process; eligibility is determined by Summit.', 'Codsadayaashu waa inay dhammaystiraan habraaca gelitaanka iyo kaalmada dhaqaale ee loo baahan yahay; u-qalmitaankana Summit ayaa go’aamisa.'],
    ['Current start dates and available seats are not confirmed.', 'Taariikhaha hadda ee bilowga iyo kuraasta bannaan weli lama xaqiijin.'],
    ['Check the official program page before applying.', 'Ka hubi bogga rasmiga ah ee barnaamijka ka hor intaadan codsan.'],
    ['Program information researched', 'Macluumaadka barnaamijka waxaa la baaray'],
    ['Cover image: AI-generated illustration, not a photograph of Summit’s campus or students.', 'Sawirka daboolka: waa sawir ay samaysay AI, mana aha sawir laga qaaday xarunta Summit ama ardaydeeda.'],
    ['Develop practical customer service, professional communication, conflict resolution, and workplace service skills.', 'Horumari xirfadaha wax-ku-oolka ah ee adeegga macaamiisha, isgaarsiinta xirfadeed, xalinta khilaafaadka iyo adeegga goobta shaqada.'],
    ['Learn the foundations of modern web development including HTML, CSS, JavaScript, responsive design, and frontend development.', 'Baro aasaaska horumarinta webka casriga ah oo ay ku jiraan HTML, CSS, JavaScript, naqshadda la qabsanaysa shaashadaha iyo horumarinta frontend-ka.'],
  ];
  return translations.reduce((text, [english, somali]) => text.replaceAll(english, somali), value);
};

export default function TrainingDetailClient({ initialTraining: training, publicPath }: Props) {
  const [activeImage, setActiveImage] = React.useState<number | null>(null);
  const { language } = useLanguage();
  const so = language === 'so';
  const t = (en: string, somali: string) => so ? somali : en;
  const translatedValue = (value: string) => so ? valueMaps[value] || value : value;
  // The course title intentionally remains canonical in both interface languages.
  const name = training.name;
  const description = so
    ? training.descriptionSo?.trim() || translateDescriptionToSomali(training.description)
    : training.description;
  const duration = so && training.durationSo?.trim() ? training.durationSo : training.duration;
  const schedule = so && training.scheduleSo?.trim() ? training.scheduleSo : training.schedule;
  const providerName = so && training.provider.nameSo?.trim() ? training.provider.nameSo : training.provider.name;
  const providerDescription = so && training.provider.descriptionSo?.trim() ? training.provider.descriptionSo : training.provider.description;
  const rawFormat = (training.deliveryMode || 'in_person').replace('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  const format = translatedValue(rawFormat);
  const physicalAddress = [training.address, training.city, training.state, training.postalCode, training.country].filter(Boolean).join(', ');
  const location = training.deliveryMode === 'online' ? t('Online', 'Onlayn') : physicalAddress || t('Provided during registration', 'Waxaa la bixinayaa marka la isdiiwaangelinayo');
  const mapUrl = training.deliveryMode !== 'online' && physicalAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(physicalAddress)}`
    : null;
  const mapEmbedUrl = mapUrl
    ? `https://www.google.com/maps?q=${encodeURIComponent(physicalAddress)}&output=embed`
    : null;
  const price = training.cost === 0 ? t('Free', 'Bilaash') : new Intl.NumberFormat(so ? 'so-SO' : 'en-US', { style: 'currency', currency: training.currency || 'USD', maximumFractionDigits: 0 }).format(training.cost);
  const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat(so ? 'so-SO' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : t('Flexible', 'Dabacsan');
  const enrollUrl = getSafeStoredUrl(training.enrollmentUrl) || getSafeStoredUrl(training.onlineUrl);
  const websiteUrl = getSafeStoredUrl(training.provider.website);
  const emailUrl = getSafeMailtoUrl(training.provider.email || undefined);
  const phoneUrl = getSafeTelUrl(training.provider.phone || undefined);
  const gallery = Array.from(new Set([training.imageUrl, ...(training.gallery || [])].filter((item): item is string => Boolean(item))));
  const outcomes = training.learningOutcomes?.length ? training.learningOutcomes : so ? ['Aqoon wax ku ool ah oo shaqo diyaar u ah', 'Qalabka iyo habraacyada heerka warshadaha', 'Layli gacanta ah iyo hagitaan', 'Kalsooni aad xirfadahaaga cusub ku adeegsan karto'] : ['Practical, job-ready knowledge', 'Industry-standard tools and workflows', 'Hands-on exercises and guided practice', 'Confidence to apply your new skills'];
  const requirements = training.requirements?.length ? training.requirements : so ? ['Khibrad xirfadeed oo hore looma baahna', 'Xirfadaha kombiyuutarka aasaasiga ah waa lagu talinayaa', 'Internet la isku halayn karo ayaa looga baahan yahay casharrada onlaynka ah', 'Ballanqaad dhammaystirka hawlaha koorsada'] : ['No prior professional experience required', 'Basic computer skills recommended', 'Reliable internet access for online sessions', 'Commitment to complete course activities'];
  const localizedOutcomes = so ? outcomes.map((item) => courseContentSo[item] || item) : outcomes;
  const localizedRequirements = so ? requirements.map((item) => courseContentSo[item] || item) : requirements;
  const registerButton = enrollUrl ? <a href={enrollUrl} target="_blank" rel="noopener noreferrer" className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[11px] font-bold text-white">{t('Visit Registration Page', 'Fur Bogga Isdiiwaangelinta')} <ExternalLink size={13} /></a> : <span className="flex h-10 w-full items-center justify-center rounded-lg bg-slate-100 px-4 text-[11px] font-bold text-slate-500 dark:bg-slate-800">{t('Registration link coming soon', 'Xiriirka isdiiwaangelinta dhowaan ayuu imanayaa')}</span>;

  return <div className="detail-readable min-h-screen bg-[#fafafe] text-slate-900 dark:bg-slate-950 dark:text-slate-100"><Navbar /><main className="mx-auto max-w-[1440px] px-4 pb-14 pt-20 sm:px-6 lg:px-8"><div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
    <div className="min-w-0 space-y-4">
      <section className={`${panel} overflow-hidden`}><button type="button" onClick={() => training.imageUrl && setActiveImage(0)} disabled={!training.imageUrl} aria-label={t(`Preview ${name} image`, `Eeg sawirka ${name}`)} className="relative block h-[230px] w-full bg-gradient-to-br from-violet-100 to-slate-200 sm:h-[330px] lg:h-[390px]">{training.imageUrl ? <img src={training.imageUrl} alt={name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-primary"><GraduationCap size={72} /></div>}{training.featured && <span className="absolute left-3 top-3 rounded bg-primary px-2 py-1 text-[9px] font-bold uppercase text-white">{t('Featured', 'La soo bandhigay')}</span>}</button><div className="p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div><h1 className="text-[23px] font-extrabold leading-tight text-slate-950 dark:text-white sm:text-[28px]">{name}</h1><p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-slate-500">{t('Offered by', 'Waxaa bixiya')} <span>{providerName}</span>{training.provider.verified && <CheckCircle2 size={14} className="fill-emerald-500 text-white" />}</p></div><button aria-label={t('Save course', 'Keydi koorsada')} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200"><Heart size={17} /></button></div><div className="mt-3 flex gap-5 text-[11px] text-slate-600">{training.provider.rating ? <span className="flex items-center gap-1"><Star size={12} />{training.provider.rating.toFixed(1)} {t('rating', 'qiimeyn')}</span> : null}<span className="flex items-center gap-1"><UsersRound size={12} />{t('Open enrollment', 'Isdiiwaangelintu way furan tahay')}</span></div><div className="mt-4 grid gap-2 border-t pt-4 text-[11px] sm:grid-cols-2 xl:grid-cols-4"><span><CalendarDays size={13} className="mr-2 inline text-primary" />{formatDate(training.startDate)} – {formatDate(training.endDate)}</span><span><Clock3 size={13} className="mr-2 inline text-primary" />{schedule || duration}</span><span><MapPin size={13} className="mr-2 inline text-primary" />{location}</span><span><UserRound size={13} className="mr-2 inline text-primary" />{translatedValue(training.level || 'All levels')}</span></div></div></section>
      <section className="rounded-xl border border-primary/20 bg-primary/5 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[12px] font-bold">{t('This training is offered by an external provider.', 'Tababarkan waxaa bixiya bixiye dibadeed.')}</p><p className="mt-1 text-[11px] text-slate-500">{t('Registration and course delivery are managed by the provider.', 'Isdiiwaangelinta iyo bixinta koorsada waxaa maamula bixiyaha.')}</p></div><div className="w-full sm:w-56">{registerButton}</div></div></section>
      <Panel title={t('About this training', 'Ku saabsan tababarkan')}><p className="whitespace-pre-line text-[14px] leading-7 text-slate-600">{description}</p></Panel>
      {gallery.length > 1 && <Panel title={t('Gallery', 'Sawirrada')} action={`${gallery.length} ${t('photos', 'sawir')}`}><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{gallery.slice(0, 6).map((image, index) => <button key={image} onClick={() => setActiveImage(index)} className="h-24 overflow-hidden rounded-lg sm:h-32"><img src={image} alt="" className="h-full w-full object-cover" /></button>)}</div></Panel>}
      <Panel title={t('What you will learn', 'Waxaad baran doontaa')}><div className="grid gap-2 sm:grid-cols-2">{localizedOutcomes.map(outcome => <p key={outcome} className="flex gap-2 text-[11px] leading-5 text-slate-600"><CheckCircle2 size={13} className="mt-1 shrink-0 text-primary" />{outcome}</p>)}</div></Panel>
      <Panel title={t('Schedule', 'Jadwalka')}><div className="grid gap-4 text-[11px] sm:grid-cols-2 lg:grid-cols-4"><Info label={t('Start date', 'Taariikhda bilowga')} value={formatDate(training.startDate)} /><Info label={t('End date', 'Taariikhda dhammaadka')} value={formatDate(training.endDate)} /><Info label={t('Time', 'Waqtiga')} value={schedule || t('Contact provider', 'La xiriir bixiyaha')} /><Info label={t('Duration', 'Muddada')} value={duration} /></div></Panel>
    </div>
    <aside className="space-y-3 lg:sticky lg:top-20">
      <section className={`${panel} p-4`}><h2 className="text-sm font-extrabold">{t('At a glance', 'Dulmar kooban')}</h2><div className="mt-3 divide-y"><Row icon={GraduationCap} label={t('Level', 'Heerka')} value={translatedValue(training.level || 'All levels')} /><Row icon={Clock3} label={t('Duration', 'Muddada')} value={duration} /><Row icon={BookOpen} label={t('Category', 'Qaybta')} value={translatedValue(training.category || 'General')} /><Row icon={Monitor} label={t('Format', 'Habka')} value={format} /><Row icon={Languages} label={t('Language', 'Luqadda')} value="English" /><Row icon={Award} label={t('Certificate', 'Shahaado')} value={training.providesCertificate ? t('Yes', 'Haa') : t('No', 'Maya')} /><Row icon={DollarSign} label={t('Price', 'Qiimaha')} value={price} /></div></section>
      <section className={`${panel} p-4`}><h2 className="text-sm font-extrabold">{t('Training provider', 'Bixiyaha tababarka')}</h2><div className="mt-3 flex gap-3">{training.provider.logoUrl ? <img src={training.provider.logoUrl} alt={providerName} className="h-12 w-12 rounded-lg object-cover" /> : <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 font-bold text-primary">{providerName.charAt(0)}</div>}<div><p className="text-[12px] font-bold">{providerName}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{providerDescription || t('Trusted training provider.', 'Bixiye tababar oo lagu kalsoon yahay.')}</p></div></div><div className="mt-3 space-y-2 text-[10px]">{websiteUrl && <a href={websiteUrl} target="_blank" rel="noopener noreferrer"><Globe2 size={12} className="mr-2 inline" />{t('Visit website', 'Fur bogga')}</a>}{phoneUrl && <a href={phoneUrl} className="block"><Phone size={12} className="mr-2 inline" />{training.provider.phone}</a>}{emailUrl && <a href={emailUrl} className="block"><Mail size={12} className="mr-2 inline" />{training.provider.email}</a>}</div>{training.provider.slug && <Link href={`/businesses/${training.provider.slug}`} className="mt-4 flex h-9 items-center justify-center rounded-lg border border-primary/30 text-[10px] font-bold text-primary">{t('View provider profile', 'Eeg xogta bixiyaha')}</Link>}</section>
      <section className={`${panel} p-4`}><h2 className="text-sm font-extrabold">{t('How to join', 'Sida loogu biiro')}</h2><ol className="mt-3 space-y-2">{(so ? ['Guji badhanka isdiiwaangelinta', 'Akoon ka samee bogga bixiyaha', 'Dhammaystir isdiiwaangelinta iyo lacag-bixinta', 'Ka hel xaqiijin bixiyaha'] : ['Click the registration button', 'Create an account on the provider website', 'Complete registration and payment', 'Receive confirmation from the provider']).map((step, index) => <li key={step} className="flex gap-2 text-[10px] leading-4 text-slate-600"><span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">{index + 1}</span>{step}</li>)}</ol><div className="mt-4">{registerButton}</div></section>
      {mapEmbedUrl && mapUrl ? <section className={`${panel} overflow-hidden`}><div className="flex items-center justify-between px-4 py-3"><h2 className="text-sm font-extrabold"><MapPin size={14} className="mr-2 inline text-primary" />{t('Location', 'Goobta')}</h2><a href={mapUrl} target="_blank" rel="noopener noreferrer" aria-label={t('Open in Google Maps', 'Ka fur Khariidadaha Google')} className="text-primary transition hover:opacity-70"><ExternalLink size={15} /></a></div><iframe src={mapEmbedUrl} title={t(`Map showing ${location}`, `Khariidadda muujinaysa ${location}`)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-56 w-full border-0" allowFullScreen /></section> : <section className={`${panel} p-4`}><h2 className="text-sm font-extrabold"><MapPin size={14} className="mr-2 inline text-primary" />{t('Location', 'Goobta')}</h2><p className="mt-2 text-[11px] font-semibold">{location}</p></section>}
      <section className={`${panel} p-4`}><h2 className="text-sm font-extrabold"><FileCheck2 size={14} className="mr-2 inline text-primary" />{t('Eligibility & requirements', 'U-qalmitaanka iyo shuruudaha')}</h2><div className="mt-3 space-y-2">{localizedRequirements.map(requirement => <p key={requirement} className="flex gap-2 text-[10px] leading-4 text-slate-600"><Check size={11} className="mt-0.5 shrink-0 text-emerald-600" />{requirement}</p>)}</div></section>
      <ShareCard publicPath={publicPath} so={so} />
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="flex gap-2 text-[10px] leading-4 text-slate-600"><ShieldCheck size={15} className="shrink-0 text-primary" />{t('Verify program details directly before registering.', 'Si toos ah u xaqiiji faahfaahinta barnaamijka ka hor isdiiwaangelinta.')}</p></div>
    </aside>
  </div></main><ImagePreviewModal images={gallery} activeIndex={activeImage} title={name} onChange={setActiveImage} onClose={() => setActiveImage(null)} /></div>;
}

function Panel({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) { return <section className={`${panel} p-4 sm:p-5`}><div className="mb-3 flex justify-between"><h2 className="text-sm font-extrabold">{title}</h2>{action && <span className="text-[10px] font-semibold text-primary">{action}</span>}</div>{children}</section>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[9px] font-semibold uppercase text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{value}</p></div>; }
function Row({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) { return <div className="flex items-center justify-between gap-3 py-2 text-[10px]"><span className="flex items-center gap-2 text-slate-500"><Icon size={12} className="text-primary" />{label}</span><span className="text-right font-semibold">{value}</span></div>; }
function ShareCard({ publicPath, so }: { publicPath: string; so: boolean }) { const copy = () => void navigator.clipboard?.writeText(window.location.origin + publicPath); return <section className={`${panel} p-4`}><h2 className="text-sm font-extrabold"><Share2 size={14} className="mr-2 inline text-primary" />{so ? 'La wadaag tababarkan' : 'Share this training'}</h2><button onClick={copy} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-primary/30 text-[10px] font-bold text-primary"><Copy size={12} />{so ? 'Nuqul xiriirka' : 'Copy link'}</button></section>; }
