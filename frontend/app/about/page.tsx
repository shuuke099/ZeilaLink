'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Users, GraduationCap, Briefcase, Star, Search, ShieldCheck, Zap, Globe, Rocket, Landmark } from 'lucide-react';

export default function AboutPage() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const getT = (key: string) => t(key, language);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-primary/20">
      <Navbar />

      {/* Hero Section - Matching Homepage Light Color BG */}
      <section className="relative pt-32 pb-20 lg:pt-56 lg:pb-40 overflow-hidden bg-white">
        {/* Abstract Background Accents - Matching Home */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -mr-96 -mt-96" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[100px] -ml-96 -mb-96" />

          {/* Decorative Circles - Visible on Light */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] border border-slate-200 rounded-[100%] rotate-[15deg] opacity-60" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] border border-slate-200 rounded-[100%] rotate-[-15deg] opacity-60" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="mb-6 inline-flex items-center space-x-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-blue-600 sm:mb-10 sm:px-5 sm:py-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.3em] uppercase">
              {isEn ? 'PIONEERING PROGRESS' : 'HORMUUDKA HORUMARKA'}
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter">
            {isEn ? (
              <>Designing the <br /><span className="text-primary italic">Future of Work</span></>
            ) : (
              <>Naqshadeynta <br /><span className="text-primary italic">Mustaqbalka Shaqada</span></>
            )}
          </h1>

          <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-xl mx-auto leading-relaxed">
            {isEn
              ? 'ZeilaLink is not just a platform; it is a movement dedicated to connecting elite talent with extraordinary global opportunities.'
              : 'ZeilaLink kaba badan platform; waa dhaqdhaqaaq loogu talagalay isku xirka hibada sare iyo fursadaha caalamiga ah ee aan caadiga ahayn.'}
          </p>
        </div>
      </section>

      {/* Stats - Premium Dark Contrast */}
      <section className="py-20 bg-slate-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <p className="mb-10 text-center text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
            {isEn
              ? 'Illustrative platform goals — not live totals'
              : 'Yoolal tusaale ah — ma aha tirooyin toos ah'}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { label: isEn ? 'COMMUNITY GOAL' : 'YOOLKA BULSHADA', value: '12,000+', icon: Users },
              { label: isEn ? 'PARTNER GOAL' : 'YOOLKA SHURAAGADA', value: '450+', icon: Landmark },
              { label: isEn ? 'SUCCESS GOAL' : 'YOOLKA GUUSHA', value: '98%', icon: Rocket },
              { label: isEn ? 'REGION GOAL' : 'YOOLKA GOBOLLADA', value: '18', icon: Globe },
            ].map((stat, idx) => (
              <div key={idx} className="group">
                <div className="text-4xl lg:text-5xl font-black text-white mb-2 tracking-tighter group-hover:text-primary transition-colors">
                  {stat.value}
                </div>
                <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="relative">
              <div className="aspect-square bg-slate-50 rounded-[4rem] relative overflow-hidden border border-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=1200&fit=crop"
                  alt="Vision"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover grayscale opacity-80"
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
              </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <h3 className="text-primary font-black text-sm tracking-widest uppercase">Our Mission</h3>
                <h2 className="text-5xl font-black text-slate-900 leading-[1.1]">The Pursuit of <br />Excellence.</h2>
              </div>
              <p className="text-slate-600 text-lg leading-relaxed">
                {isEn
                  ? 'We are committed to building a digital infrastructure that empowers ZeilaLink users. By leveraging cutting-edge technology and strategic partnerships, we ensure that every talented individual has a direct pathway to professional fulfillment.'
                  : 'Waxaan ka go\'an tahay dhisidda kaabayaasha dhijitaalka ah ee awoodsiinaya isticmaalayaasha ZeilaLink. Adigoo kaashanaya tiknoolajiyadda casriga ah iyo iskaashiga istiraatiijiyadeed, waxaan hubineynaa in qof kasta oo hibo leh uu leeyahay jid toos ah oo ku aaddan gashaanshada xirfadeed.'}
              </p>
              <div className="grid sm:grid-cols-2 gap-8 pt-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <ShieldCheck className="text-primary mb-4" size={32} />
                  <h4 className="font-black text-slate-900 mb-2">Verified Only</h4>
                  <p className="text-sm text-slate-500">Every employer and role undergoes a rigorous premium verification process.</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <Zap className="text-primary mb-4" size={32} />
                  <h4 className="font-black text-slate-900 mb-2">Instant Connect</h4>
                  <p className="text-sm text-slate-500">Our intelligent systems link talent with opportunities in real-time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-24 bg-slate-900 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--color-primary-rgb),0.2),transparent_60%)]" />
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Ready to start your <br /><span className="text-primary">Elite Journey?</span></h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/jobs" className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black transition-transform hover:scale-105">
              Explore Careers
            </Link>
            <Link href="/contact" className="bg-white/10 backdrop-blur-md border border-white/20 px-10 py-5 rounded-2xl font-black hover:bg-white/20 transition-all">
              Concierge Desk
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
