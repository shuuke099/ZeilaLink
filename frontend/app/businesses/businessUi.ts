import type { PublicBusiness } from "@/lib/publicDirectoryTypes";

const somaliCategoryLabels: Record<string, string> = {
  Automotive: "Gaadiidka",
  Beauty: "Quruxda",
  Construction: "Dhismaha",
  Education: "Waxbarashada",
  "Financial Services": "Adeegyada maaliyadda",
  "Food & Dining": "Cunto iyo maqaayado",
  Health: "Caafimaadka",
  "Home Care": "Daryeelka guriga",
  Hospitality: "Martigelinta",
  Photography: "Sawir-qaadista",
  "Professional Services": "Adeegyada xirfadlayaasha",
  Restaurant: "Maqaayadaha",
  Retail: "Tafaariiqda",
  Technology: "Tiknoolajiyada",
  Translation: "Turjumaadda",
  Transport: "Gaadiidka",
  Transportation: "Gaadiidka",
  Other: "Kale",
};

/** Business names are proper names and never change with the interface language. */
export const getCanonicalBusinessName = (
  business: Pick<PublicBusiness, "name">,
) => business.name.trim();

/** Category labels may be localized, while the API/filter value remains canonical. */
export const getBusinessCategoryLabel = (
  category: string | null | undefined,
  isSomali: boolean,
) => {
  const canonical = category?.trim() || "";
  if (!canonical || !isSomali) return canonical;
  return somaliCategoryLabels[canonical] || canonical;
};
