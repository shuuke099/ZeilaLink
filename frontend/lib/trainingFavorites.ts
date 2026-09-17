export type TrainingFavorite = {
  id: string;
  slug?: string | null;
  name: string;
  imageUrl?: string | null;
  duration?: string | null;
  deliveryMode?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number | null;
  provider: { name: string };
};

export const TRAINING_FAVORITES_EVENT = "zeilalink:training-favorites";

const storageKey = (userId?: string | null) =>
  `zeilalink:training-favorites:${userId || "guest"}`;

const parseTrainingFavorite = (value: unknown): TrainingFavorite | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const provider = item.provider;
  if (
    typeof item.id !== "string" ||
    typeof item.name !== "string" ||
    !provider ||
    typeof provider !== "object" ||
    Array.isArray(provider) ||
    typeof (provider as Record<string, unknown>).name !== "string"
  ) return null;
  return item as unknown as TrainingFavorite;
};

export const getTrainingFavorites = (userId?: string | null): TrainingFavorite[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey(userId)) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored
      .map(parseTrainingFavorite)
      .filter((training): training is TrainingFavorite => training !== null);
  } catch {
    return [];
  }
};

export const isTrainingFavorite = (trainingId: string, userId?: string | null) =>
  getTrainingFavorites(userId).some((training) => training.id === trainingId);

export const toggleTrainingFavorite = (
  training: TrainingFavorite,
  userId?: string | null,
) => {
  const favorites = getTrainingFavorites(userId);
  const alreadyFavorite = favorites.some((item) => item.id === training.id);
  const nextFavorites = alreadyFavorite
    ? favorites.filter((item) => item.id !== training.id)
    : [training, ...favorites];

  window.localStorage.setItem(storageKey(userId), JSON.stringify(nextFavorites));
  window.dispatchEvent(new CustomEvent(TRAINING_FAVORITES_EVENT));
  return !alreadyFavorite;
};
