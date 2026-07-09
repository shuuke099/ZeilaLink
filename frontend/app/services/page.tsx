'use client';

import Navbar from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import ServiceList from './components/ServiceList';

export default function ServicesPage() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Navbar />
      <ServiceList isEn={isEn} />
    </div>
  );
}
