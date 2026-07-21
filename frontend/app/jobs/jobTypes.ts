export interface PublicJob {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  benefits?: string | null;
  location: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  employmentType: string;
  remote: boolean;
  tags?: string[];
  createdAt: string;
  applicationDeadline?: string | null;
  employer: {
    name: string;
    logoUrl?: string | null;
    avatarUrl?: string | null;
    description?: string | null;
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
  typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value);

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
    !isNullableString(value.requirements) ||
    !isNullableString(value.benefits) ||
    !isNullableString(value.applicationDeadline) ||
    !isNullableString(value.employer.logoUrl) ||
    !isNullableString(value.employer.avatarUrl) ||
    !isNullableString(value.employer.description) ||
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
