export type DirectoryLanguage = "en" | "so";

export interface DirectoryPagination {
  page: number;
  totalPages: number;
  total?: number;
  limit?: number;
}

export interface WorkerExperience {
  id?: string;
  jobTitle?: string | null;
  company?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
  achievements?: string | null;
}

export interface WorkerEducation {
  id?: string;
  degreeLevel?: string | null;
  institution?: string | null;
  fieldOfStudy?: string | null;
  certificationName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isVerified?: boolean;
}

export interface WorkerLanguage {
  id?: string;
  language?: string | null;
  level?: string | null;
}

export interface WorkerSkill {
  id?: string;
  level?: string | null;
  skill?: {
    name?: string | null;
  } | null;
}

export interface WorkerPreference {
  employmentType?: string | null;
  shiftPreference?: string | null;
  desiredSalaryMin?: number | null;
  desiredSalaryMax?: number | null;
}

export interface PublicWorker {
  id: string;
  slug?: string | null;
  name: string;
  headline?: string | null;
  headlineSo?: string | null;
  bio?: string | null;
  bioSo?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  preferredLanguage?: string | null;
  createdAt?: string | null;
  workerExperiences: WorkerExperience[];
  workerEducations: WorkerEducation[];
  workerLanguages: WorkerLanguage[];
  userSkills: WorkerSkill[];
  workerPreference?: WorkerPreference | null;
}

export interface PublicBusiness {
  id: string;
  slug?: string | null;
  type: "employer" | "provider" | "business";
  name: string;
  nameSo?: string | null;
  description?: string | null;
  descriptionSo?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  location?: string | null;
  website?: string | null;
  category?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  featured?: boolean;
  rating?: number | null;
  reviewsCount?: number | null;
  statusLabel?: string | null;
  bannerUrl?: string | null;
  gallery?: string[];
  subcategory?: string | null;
  serviceArea?: string[];
  remoteAvailable?: boolean;
  verified?: boolean;
  openingHours?: Record<string, string> | null;
  createdAt?: string | null;
  jobCount?: number | null;
  trainingCount?: number | null;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const finitePositiveInteger = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : undefined;

export const isPublicDirectoryIdentifier = (
  value: unknown,
): value is string =>
  typeof value === "string" &&
  /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/.test(value);

const parsePagination = (
  value: unknown,
  itemCount: number,
): DirectoryPagination => {
  if (!isRecord(value)) {
    return { page: 1, totalPages: 1, total: itemCount };
  }

  const page = finitePositiveInteger(value.page) ?? 1;
  const totalPages =
    finitePositiveInteger(value.totalPages) ??
    finitePositiveInteger(value.pages) ??
    1;
  const total =
    typeof value.total === "number" && Number.isFinite(value.total)
      ? Math.max(0, value.total)
      : itemCount;
  const limit =
    finitePositiveInteger(value.limit) ??
    finitePositiveInteger(value.pageSize);

  return {
    page,
    totalPages: Math.max(page, totalPages),
    total,
    ...(limit ? { limit } : {}),
  };
};

export const parsePublicWorker = (value: unknown): PublicWorker | null => {
  if (
    !isRecord(value) ||
    !isPublicDirectoryIdentifier(value.id) ||
    typeof value.name !== "string" ||
    !value.name.trim()
  ) {
    return null;
  }

  const slug =
    typeof value.slug === "string" && isPublicDirectoryIdentifier(value.slug)
      ? value.slug
      : null;
  const directSkills = Array.isArray(value.userSkills)
    ? (value.userSkills as WorkerSkill[])
    : null;
  const flattenedSkills = Array.isArray(value.skills)
    ? value.skills
        .filter(isRecord)
        .map((entry): WorkerSkill => ({
          id: typeof entry.id === "string" ? entry.id : undefined,
          level: typeof entry.level === "string" ? entry.level : null,
          skill: {
            name: typeof entry.name === "string" ? entry.name : null,
          },
        }))
    : [];

  return {
    ...(value as unknown as PublicWorker),
    id: value.id,
    slug,
    name: value.name.trim(),
    workerExperiences: Array.isArray(value.workerExperiences)
      ? (value.workerExperiences as WorkerExperience[])
      : Array.isArray(value.experiences)
        ? (value.experiences as WorkerExperience[])
        : [],
    workerEducations: Array.isArray(value.workerEducations)
      ? (value.workerEducations as WorkerEducation[])
      : Array.isArray(value.educations)
        ? (value.educations as WorkerEducation[])
        : [],
    workerLanguages: Array.isArray(value.workerLanguages)
      ? (value.workerLanguages as WorkerLanguage[])
      : Array.isArray(value.languages)
        ? (value.languages as WorkerLanguage[])
        : [],
    userSkills: directSkills ?? flattenedSkills,
    workerPreference: isRecord(value.workerPreference)
      ? (value.workerPreference as WorkerPreference)
      : null,
  };
};

export const parseWorkersResponse = (
  value: unknown,
): { workers: PublicWorker[]; pagination: DirectoryPagination } | null => {
  if (!isRecord(value) || !Array.isArray(value.workers)) return null;

  const workers = value.workers
    .map(parsePublicWorker)
    .filter((worker): worker is PublicWorker => worker !== null);

  if (workers.length !== value.workers.length) return null;

  const uniqueWorkers = Array.from(
    new Map(workers.map((worker) => [worker.id, worker])).values(),
  );

  return {
    workers: uniqueWorkers,
    pagination: parsePagination(value.pagination, uniqueWorkers.length),
  };
};

export const parseWorkerDetailResponse = (
  value: unknown,
): PublicWorker | null => {
  if (isRecord(value) && "worker" in value) {
    return parsePublicWorker(value.worker);
  }
  return parsePublicWorker(value);
};

export const parsePublicBusiness = (
  value: unknown,
): PublicBusiness | null => {
  if (
    !isRecord(value) ||
    !isPublicDirectoryIdentifier(value.id) ||
    (value.type !== "employer" && value.type !== "provider" && value.type !== "business") ||
    typeof value.name !== "string" ||
    !value.name.trim()
  ) {
    return null;
  }

  const slug =
    typeof value.slug === "string" && isPublicDirectoryIdentifier(value.slug)
      ? value.slug
      : null;
  const offeringsCount =
    typeof value.offeringsCount === "number" &&
    Number.isFinite(value.offeringsCount)
      ? Math.max(0, value.offeringsCount)
      : null;
  const jobCount =
    typeof value.jobCount === "number" && Number.isFinite(value.jobCount)
      ? Math.max(0, value.jobCount)
      : value.type === "employer"
        ? offeringsCount
        : null;
  const trainingCount =
    typeof value.trainingCount === "number" &&
    Number.isFinite(value.trainingCount)
      ? Math.max(0, value.trainingCount)
      : value.type === "provider"
        ? offeringsCount
        : null;

  return {
    ...(value as unknown as PublicBusiness),
    id: value.id,
    slug,
    type: value.type,
    name: value.name.trim(),
    jobCount,
    trainingCount,
  };
};

export const parseBusinessesResponse = (
  value: unknown,
): { businesses: PublicBusiness[]; pagination: DirectoryPagination; locationFallback: boolean } | null => {
  if (!isRecord(value) || !Array.isArray(value.businesses)) return null;

  const businesses = value.businesses
    .map(parsePublicBusiness)
    .filter((business): business is PublicBusiness => business !== null);

  if (businesses.length !== value.businesses.length) return null;

  const uniqueBusinesses = Array.from(
    new Map(businesses.map((business) => [business.id, business])).values(),
  );

  return {
    businesses: uniqueBusinesses,
    pagination: parsePagination(value.pagination, uniqueBusinesses.length),
    locationFallback: value.locationFallback === true,
  };
};

export const parseBusinessDetailResponse = (
  value: unknown,
): PublicBusiness | null => {
  if (isRecord(value) && "business" in value) {
    return parsePublicBusiness(value.business);
  }
  return parsePublicBusiness(value);
};

const localizedValue = (
  englishValue: string | null | undefined,
  somaliValue: string | null | undefined,
  language: DirectoryLanguage,
) => {
  if (language === "so" && somaliValue?.trim()) return somaliValue.trim();
  if (englishValue?.trim()) return englishValue.trim();
  return somaliValue?.trim() || "";
};

export const getLocalizedWorkerText = (
  worker: PublicWorker,
  language: DirectoryLanguage,
) => ({
  headline: localizedValue(worker.headline, worker.headlineSo, language),
  bio: localizedValue(worker.bio, worker.bioSo, language),
});

export const getLocalizedBusinessText = (
  business: PublicBusiness,
  language: DirectoryLanguage,
) => ({
  name: localizedValue(business.name, business.nameSo, language),
  description: localizedValue(
    business.description,
    business.descriptionSo,
    language,
  ),
});
