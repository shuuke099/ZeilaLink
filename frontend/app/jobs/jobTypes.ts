export interface PublicJob {
  id: string;
  slug?: string | null;
  title: string;
  titleSo?: string | null;
  description: string;
  descriptionSo?: string | null;
  requirements?: string;
  requirementsSo?: string | null;
  benefits?: string | null;
  benefitsSo?: string | null;
  location: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  employmentType: string;
  remote: boolean;
  tags?: string[];
  createdAt: string;
  applicationDeadline?: string | null;
  employer: {
    id?: string;
    slug?: string | null;
    name: string;
    nameSo?: string | null;
    logoUrl?: string | null;
    avatarUrl?: string | null;
    description?: string | null;
    descriptionSo?: string | null;
  };
  _count?: {
    applications: number;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isNullableString = (value: unknown) =>
  value === undefined || value === null || typeof value === "string";

const isNullableNonNegativeNumber = (value: unknown) =>
  value === undefined ||
  value === null ||
  (typeof value === "number" && Number.isFinite(value) && value >= 0);

export const isValidJobId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/.test(value);

export const parsePublicJob = (value: unknown): PublicJob | null => {
  if (!isRecord(value) || !isRecord(value.employer)) return null;

  if (
    !isValidJobId(value.id) ||
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    typeof value.location !== "string" ||
    typeof value.employmentType !== "string" ||
    typeof value.remote !== "boolean" ||
    typeof value.createdAt !== "string" ||
    Number.isNaN(Date.parse(value.createdAt)) ||
    typeof value.employer.name !== "string" ||
    !isNullableString(value.slug) ||
    !isNullableString(value.titleSo) ||
    !isNullableString(value.descriptionSo) ||
    !isNullableString(value.requirements) ||
    !isNullableString(value.requirementsSo) ||
    !isNullableString(value.benefits) ||
    !isNullableString(value.benefitsSo) ||
    !isNullableString(value.applicationDeadline) ||
    !isNullableString(value.employer.id) ||
    !isNullableString(value.employer.slug) ||
    !isNullableString(value.employer.nameSo) ||
    !isNullableString(value.employer.logoUrl) ||
    !isNullableString(value.employer.avatarUrl) ||
    !isNullableString(value.employer.description) ||
    !isNullableString(value.employer.descriptionSo) ||
    !isNullableNonNegativeNumber(value.salaryMin) ||
    !isNullableNonNegativeNumber(value.salaryMax)
  ) {
    return null;
  }

  if (
    value.applicationDeadline &&
    Number.isNaN(Date.parse(value.applicationDeadline as string))
  ) {
    return null;
  }

  if (
    value.tags !== undefined &&
    (!Array.isArray(value.tags) || value.tags.some((tag) => typeof tag !== "string"))
  ) {
    return null;
  }

  if (
    value._count !== undefined &&
    (!isRecord(value._count) ||
      typeof value._count.applications !== "number" ||
      !Number.isFinite(value._count.applications))
  ) {
    return null;
  }

  return value as unknown as PublicJob;
};

export const parseJobsResponse = (value: unknown): PublicJob[] | null => {
  if (!isRecord(value) || !Array.isArray(value.jobs)) return null;

  const jobs = value.jobs.map(parsePublicJob);
  if (jobs.some((job) => job === null)) return null;

  return Array.from(
    new Map((jobs as PublicJob[]).map((job) => [job.id, job])).values(),
  );
};

export const getLocalizedJobText = (
  job: PublicJob,
  language: "en" | "so",
) => {
  const useSomali = language === "so";

  return {
    title: useSomali && job.titleSo?.trim() ? job.titleSo : job.title,
    description:
      useSomali && job.descriptionSo?.trim()
        ? job.descriptionSo
        : job.description,
    requirements:
      useSomali && job.requirementsSo?.trim()
        ? job.requirementsSo
        : job.requirements,
    benefits:
      useSomali && job.benefitsSo?.trim() ? job.benefitsSo : job.benefits,
    employerName:
      useSomali && job.employer.nameSo?.trim()
        ? job.employer.nameSo
        : job.employer.name,
    employerDescription:
      useSomali && job.employer.descriptionSo?.trim()
        ? job.employer.descriptionSo
        : job.employer.description,
  };
};
