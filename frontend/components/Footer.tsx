"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Briefcase,
  Globe,
  Share2,
  AtSign,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePathname } from "next/navigation";

export default function Footer() {
  const { language } = useLanguage();
  const pathname = usePathname();
  const isEn = language === "en";
  const isDashboard =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/employer") ||
    pathname?.startsWith("/worker") ||
    pathname?.startsWith("/provider");
  const isTrainingPage = pathname?.startsWith("/trainings");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isDashboard || isTrainingPage || isAuthPage) return null;

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand & Mission */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/icon.png"
                alt="ZeilaLink logo"
                width={32}
                height={32}
                className="w-8 h-8 rounded-lg object-contain"
                priority
              />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                ZeilaLink
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              {isEn
                ? "The leading platform for People talent to find meaningful work and develop professional skills."
                : "Madasha ugu horreysa ee hibooyinka dadka ay ka helaan shaqo macno leh iyo horumarinta xirfadaha."}
            </p>
            <div className="flex space-x-4">
              {[Facebook, Twitter, Linkedin, Youtube].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all duration-300"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-6">
              {isEn ? "Quick Links" : "Xiriirro Degdeg ah"}
            </h4>
            <ul className="space-y-4">
              {[
                {
                  label: isEn ? "Browse Jobs" : "Raadi Shaqooyin",
                  href: "/jobs",
                },
                {
                  label: isEn ? "Skill Training" : "Tababar Xirfado",
                  href: "/trainings",
                },
                { label: isEn ? "About Us" : "Nagu Saabsan", href: "/about" },
                {
                  label: isEn ? "Contact Support" : "Taageerada",
                  href: "/contact",
                },
                {
                  label: isEn ? "Privacy Policy" : "Qaanuunka Asturnaanta",
                  href: "/about",
                },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="hover:text-blue-500 transition-colors flex items-center group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:border-l md:border-slate-800 md:pl-12">
            <h4 className="text-white font-semibold text-lg mb-6">
              {isEn ? "Contact Info" : "Macluumaadka Xiriirka"}
            </h4>
            <ul className="space-y-5">
              <li className="flex items-start space-x-4 group">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                  <MapPin className="text-blue-500" size={20} />
                </div>
                <span>Minnesota, USA</span>
              </li>
              <li className="flex items-center space-x-4 group">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                  <Phone className="text-blue-500" size={18} />
                </div>
                <span>+1 (952) 228-8655</span>
              </li>
              <li className="flex items-center space-x-4 group">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                  <Mail className="text-blue-500" size={18} />
                </div>
                <span>contact@zeilalink.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} ZeilaLink Platform.{" "}
            {isEn
              ? "All rights reserved."
              : "Dhammaan xuquuqdu waa dhowran yihiin."}
          </p>
          <div className="flex space-x-6 text-sm">
            <Link href="/about" className="hover:text-blue-500">
              Terms
            </Link>
            <Link href="/about" className="hover:text-blue-500">
              Privacy
            </Link>
            <Link href="/about" className="hover:text-blue-500">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
