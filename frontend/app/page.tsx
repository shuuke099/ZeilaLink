import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import AboutSection from "@/components/home/AboutSection";
import CapabilitiesSection from "@/components/home/CapabilitiesSection";
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import SupportSection from "@/components/home/SupportSection";
import type { Language } from "@/lib/translations";

export default function HomePage() {
  const savedLanguage = cookies().get("language")?.value;
  const language: Language = savedLanguage === "so" ? "so" : "en";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection language={language} />
      <StatsSection language={language} />
      <AboutSection language={language} />
      <CapabilitiesSection language={language} />
      <SupportSection language={language} />
    </div>
  );
}
