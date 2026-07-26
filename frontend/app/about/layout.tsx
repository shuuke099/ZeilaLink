import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "About ZeilaLink | Connecting Somali Talent and Opportunity",
  description:
    "Learn how ZeilaLink connects Somali talent, employers, training providers, service professionals, and businesses. Baro sida ZeilaLink bulshada Soomaaliyeed ugu xirto fursadaha.",
  path: "/about",
  keywords: ["about ZeilaLink", "Somali talent platform", "nagu saabsan"],
});

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}
