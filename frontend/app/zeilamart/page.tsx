'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ZeilaMartPage() {
  const { language } = useLanguage();
  const somali = language === 'so';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pb-20 pt-32 text-center">
        <h1 className="text-3xl font-bold text-heading">ZeilaMart</h1>
        <p className="mt-4 text-foreground/70">
          {somali
            ? 'Suuqa ZeilaMart weli ma furna. Inta aad sugayso, eeg ganacsiyada iyo qiimo-dhimisyada.'
            : 'The ZeilaMart marketplace is not open yet. In the meantime, explore local businesses and deals.'}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/businesses" className="rounded-xl bg-primary px-5 py-3 font-semibold text-white">
            {somali ? 'Arag dhamaan ganacsiyada' : 'View all businesses'}
          </Link>
          <Link href="/deals" className="rounded-xl border border-border px-5 py-3 font-semibold text-primary">
            {somali ? 'Arag dhamaan qiimo-dhimisyada' : 'View all deals'}
          </Link>
        </div>
      </main>
    </div>
  );
}
