import {
  parsePublicBusiness,
  type PublicBusiness,
} from "@/lib/publicDirectoryTypes";

export const BUSINESS_FAVORITES_EVENT = "zeilalink:business-favorites";

const storageKey = (userId?: string | null) =>
  `zeilalink:business-favorites:${userId || "guest"}`;

export const getBusinessFavorites = (
  userId?: string | null,
): PublicBusiness[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(storageKey(userId)) || "[]",
    );
    if (!Array.isArray(stored)) return [];

    return stored
      .map(parsePublicBusiness)
      .filter((business): business is PublicBusiness => business !== null);
  } catch {
    return [];
  }
};

export const isBusinessFavorite = (
  businessId: string,
  userId?: string | null,
) => getBusinessFavorites(userId).some((business) => business.id === businessId);

export const toggleBusinessFavorite = (
  business: PublicBusiness,
  userId?: string | null,
) => {
  const favorites = getBusinessFavorites(userId);
  const alreadyFavorite = favorites.some((item) => item.id === business.id);
  const nextFavorites = alreadyFavorite
    ? favorites.filter((item) => item.id !== business.id)
    : [business, ...favorites];

  window.localStorage.setItem(storageKey(userId), JSON.stringify(nextFavorites));
  window.dispatchEvent(
    new CustomEvent(BUSINESS_FAVORITES_EVENT, {
      detail: { userId: userId || "guest" },
    }),
  );

  return !alreadyFavorite;
};

