import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Contact ZeilaLink | Jobs, Training and Services Support",
  description:
    "Contact ZeilaLink for help with jobs, workers, training, services, and business accounts. La xiriir ZeilaLink si aad u hesho taageero.",
  path: "/contact",
  keywords: ["contact ZeilaLink", "ZeilaLink support", "nagala xiriir"],
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
