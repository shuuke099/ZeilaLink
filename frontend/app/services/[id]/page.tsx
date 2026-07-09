"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import ServiceDetail from "../components/ServiceDetail";
import api from "@/lib/api";

import type { ServiceItem } from "../data/services";
import { getServiceById } from "../data/services";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { language } = useLanguage();
  const isEn = language === "en";

  const [service, setService] = useState<ServiceItem | null>(
    getServiceById(id) || null,
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadService = async () => {
      try {
        const response = await api.get(`/services/${id}`);

        if (response.data) {
          setService(response.data);
        } else {
          setService(getServiceById(id) || null);
        }
      } catch (error) {
        console.error(error);
        setService(getServiceById(id) || null);
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [id]);

  if (loading && !service) {
    return (
      <div className="min-h-screen bg-background transition-colors">
        <Navbar />

        <div className="pt-32 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
          <p className="text-slate-600">
            {isEn ? "Loading service..." : "Waxaa soo degaya adeegga..."}
          </p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background transition-colors">
        <Navbar />

        <div className="pt-32 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-black text-slate-900 mb-3">
            {isEn ? "Service not found" : "Adeegga lama helin"}
          </h1>

          <p className="text-slate-600 mb-6">
            {isEn
              ? "The service you are looking for does not exist."
              : "Adeegga aad raadineyso ma jiro."}
          </p>

          <Link href="/services" className="btn-primary">
            {isEn ? "Back to services" : "Ku laabo adeegyada"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Navbar />

      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex justify-end">
        <Link
          href="/services"
          className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-semibold text-primary hover:bg-slate-50 transition-colors"
        >
          {isEn ? "Back to services" : "Ku laabo adeegyada"}
        </Link>
      </div>

      <ServiceDetail service={service} isEn={isEn} />
    </div>
  );
}
