"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  Globe,
  ArrowRight,
} from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ContactPage() {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-primary selection:text-white">
      <Navbar />

      {/* Contact Section - 'Concierge Desk' Layout Redesign */}
      <section className="pt-40 pb-32 px-4 bg-white selection:bg-primary selection:text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-0">
            {/* Left Column: Direct Assistance */}
            <div className="lg:pr-20 py-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center space-x-2 bg-slate-50 text-slate-500 px-5 py-2.5 rounded-full mb-8 border border-slate-100 shadow-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                  {isEn
                    ? "Global Support Center"
                    : "Xarunta Taageerada Caalamiga"}
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
                {isEn ? (
                  <>
                    Get in{" "}
                    <span className="text-primary relative inline-block">
                      Touch{" "}
                      <div className="absolute -bottom-2 left-0 w-full h-3 bg-primary/10 -z-10" />
                    </span>
                  </>
                ) : (
                  <>
                    Nala soo{" "}
                    <span className="text-primary relative inline-block">
                      Xiriir{" "}
                      <div className="absolute -bottom-2 left-0 w-full h-3 bg-primary/10 -z-10" />
                    </span>
                  </>
                )}
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed mb-10 max-w-md">
                {isEn
                  ? "We're building the future of work at ZeilaLink. Our team is dedicated to providing you with the most seamless career journey imaginable."
                  : "Waxaan dhiseynaa mustaqbalka shaqada ee ZeilaLink. Kooxdayadu waxay u go'an tahay inay ku siiyaan socdaalka shaqo ee ugu wanaagsan ee aad qiyaasi karto."}
              </p>

              <div className="space-y-6">
                <a
                  href="https://wa.me/19522288655"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all no-underline w-full sm:w-auto"
                >
                  <WhatsAppIcon size={20} fill="white" />
                  {isEn ? "MESSAGE US ON WHATSAPP" : "NAGA SOO QOR WHATSAPP"}
                </a>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                  <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">
                    {isEn
                      ? "Typical response time: Under 5 minutes"
                      : "Waqtiga jawaabta caadiga ah: In ka yar 5 daqiiqo"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Information Desk */}
            <div className="lg:pl-20 py-10 lg:border-l border-slate-100 space-y-16">
              <div>
                <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-10">
                  {isEn ? "Talent Support Desk" : "Miiska Taageerada Tayada"}
                </h3>

                <div className="space-y-10">
                  {/* Location */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {isEn ? "LOCATION" : "GOOBTA"}
                    </p>
                    <p className="text-xl font-bold text-slate-900 leading-tight">
                      Minneapolis
                      <br />
                      MN, USA
                    </p>
                  </div>

                  {/* Connect */}
                  <div className="space-y-6">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {isEn ? "CONNECT" : "XIRIIRKA"}
                    </p>
                    <div className="space-y-4 max-w-sm">
                      <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                        <span className="text-slate-500 font-medium">
                          {isEn ? "Talent Support" : "Taageerada Tayada"}
                        </span>
                        <a
                          href="tel:+19522288655"
                          className="text-xl font-bold text-slate-900 hover:text-primary transition-colors no-underline"
                        >
                          +1 (952) 228-8655
                        </a>
                      </div>
                      <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                        <span className="text-slate-500 font-medium">
                          {isEn ? "General Inquiry" : "Weydiinta Guud"}
                        </span>
                        <a
                          href="tel:+19522288655"
                          className="text-xl font-bold text-slate-900 hover:text-primary transition-colors no-underline"
                        >
                          +1 (952) 228-8655
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Inquiries */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {isEn ? "INQUIRIES" : "CODSIGA"}
                    </p>
                    <a
                      href="mailto:contact@zeilalink.com"
                      className="text-xl font-bold text-primary hover:underline decoration-2 underline-offset-8 transition-all"
                    >
                      contact@zeilalink.com
                    </a>
                  </div>

                  {/* Availability */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {isEn ? "AVAILABILITY" : "OOGOLAASHAHA"}
                    </p>
                    <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
                      {isEn
                        ? "Our career consultants are on hand 24 hours a day, 7 days a week, ensuring you never miss an opportunity."
                        : "La-taliyayaashayada shaqada waxay joogaan 24 saac maalintii, 7 maalmood usbuucii, iyagoo hubinaya inaadan marnaba seegin fursad."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
