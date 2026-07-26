import type { MetadataRoute } from "next";
import {
  absoluteUrl,
  getInternalApiOrigin,
} from "@/lib/seo";

export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];
type PublicRecord = Record<string, unknown>;

interface CollectionDefinition {
  endpoints: string[];
  responseKeys: string[];
  routePrefix: string;
  changeFrequency: SitemapEntry["changeFrequency"];
  priority: number;
}

const PAGE_SIZE = 100;
const MAXIMUM_PAGES_PER_COLLECTION = 100;

const collectionDefinitions: CollectionDefinition[] = [
  {
    endpoints: ["/api/jobs"],
    responseKeys: ["jobs"],
    routePrefix: "/jobs",
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    endpoints: ["/api/trainings"],
    responseKeys: ["trainings"],
    routePrefix: "/training",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    endpoints: ["/api/services"],
    responseKeys: ["services"],
    routePrefix: "/services",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    endpoints: ["/api/public/workers", "/api/workers"],
    responseKeys: ["workers", "users"],
    routePrefix: "/workers",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    endpoints: ["/api/public/businesses", "/api/businesses"],
    responseKeys: ["businesses", "organizations"],
    routePrefix: "/businesses",
    changeFrequency: "weekly",
    priority: 0.7,
  },
];

const isRecord = (value: unknown): value is PublicRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const recordsFromPayload = (
  payload: unknown,
  responseKeys: string[],
): PublicRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) return [];

  for (const key of responseKeys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }

  return [];
};

const pagesFromPayload = (payload: unknown): number | null => {
  if (!isRecord(payload) || !isRecord(payload.pagination)) return null;

  const value = payload.pagination.pages;
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
    ? Math.floor(value)
    : null;
};

const fetchPage = async (
  endpoint: string,
  page: number,
): Promise<unknown> => {
  const url = new URL(endpoint, getInternalApiOrigin());
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(PAGE_SIZE));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`SEO collection request returned ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const fetchCollection = async (
  definition: CollectionDefinition,
): Promise<PublicRecord[]> => {
  for (const endpoint of definition.endpoints) {
    try {
      const records: PublicRecord[] = [];

      for (
        let page = 1;
        page <= MAXIMUM_PAGES_PER_COLLECTION;
        page += 1
      ) {
        const payload = await fetchPage(endpoint, page);
        const pageRecords = recordsFromPayload(
          payload,
          definition.responseKeys,
        );
        records.push(...pageRecords);

        const totalPages = pagesFromPayload(payload);
        if (
          pageRecords.length === 0 ||
          (totalPages !== null && page >= totalPages) ||
          (totalPages === null && pageRecords.length < PAGE_SIZE)
        ) {
          break;
        }
      }

      return records;
    } catch {
      // A collection should never make the entire sitemap unavailable.
      // Try a future-compatible fallback endpoint, then omit it if unavailable.
    }
  }

  return [];
};

const recordIdentifier = (record: PublicRecord): string | null => {
  const slug = typeof record.slug === "string" ? record.slug.trim() : "";
  const id = typeof record.id === "string" ? record.id.trim() : "";
  return slug || id || null;
};

const recordLastModified = (record: PublicRecord): Date | undefined => {
  for (const value of [record.updatedAt, record.createdAt]) {
    if (typeof value !== "string") continue;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.valueOf())) return parsed;
  }

  return undefined;
};

const isPublicRecord = (record: PublicRecord): boolean =>
  record.published !== false &&
  record.isPublic !== false &&
  record.public !== false;

const staticEntries: SitemapEntry[] = [
  {
    url: absoluteUrl("/"),
    changeFrequency: "daily",
    priority: 1,
  },
  {
    url: absoluteUrl("/jobs"),
    changeFrequency: "daily",
    priority: 0.95,
  },
  {
    url: absoluteUrl("/training"),
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    url: absoluteUrl("/services"),
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    url: absoluteUrl("/workers"),
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    url: absoluteUrl("/businesses"),
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: absoluteUrl("/about"),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: absoluteUrl("/contact"),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: absoluteUrl("/privacy"),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: absoluteUrl("/terms"),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: absoluteUrl("/cookies"),
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const collections = await Promise.all(
    collectionDefinitions.map(async (definition) => ({
      definition,
      records: await fetchCollection(definition),
    })),
  );

  const entries = new Map<string, SitemapEntry>(
    staticEntries.map((entry) => [entry.url, entry]),
  );

  for (const { definition, records } of collections) {
    if (
      records.length > 0 &&
      (definition.routePrefix === "/workers" ||
        definition.routePrefix === "/businesses")
    ) {
      const hubUrl = absoluteUrl(definition.routePrefix);
      entries.set(hubUrl, {
        url: hubUrl,
        changeFrequency: definition.changeFrequency,
        priority:
          definition.routePrefix === "/workers" ? 0.85 : 0.8,
      });
    }

    for (const record of records) {
      if (!isPublicRecord(record)) continue;

      const identifier = recordIdentifier(record);
      if (!identifier) continue;

      const url = absoluteUrl(
        `${definition.routePrefix}/${encodeURIComponent(identifier)}`,
      );
      entries.set(url, {
        url,
        lastModified: recordLastModified(record),
        changeFrequency: definition.changeFrequency,
        priority: definition.priority,
      });
    }
  }

  return Array.from(entries.values());
}
