import type { Metadata } from "next";
import JobsClient from "./JobsClient";
import { parseJobsResponse, type PublicJob } from "./jobTypes";
import { serverApiGet } from "@/lib/serverApi";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs in Somalia | Shaqooyin | ZeilaLink",
  description:
    "Find verified jobs in Somalia and remote opportunities on ZeilaLink. Ka raadi shaqooyin la xaqiijiyey, shaqo fog, iyo fursado xirfadeed.",
  alternates: {
    canonical: "/jobs",
  },
  openGraph: {
    title: "Jobs in Somalia | Shaqooyin | ZeilaLink",
    description:
      "Browse verified jobs and remote opportunities for Somali professionals.",
    url: "/jobs",
    siteName: "ZeilaLink",
    locale: "en_SO",
    alternateLocale: ["so_SO"],
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "ZeilaLink jobs and opportunities",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jobs in Somalia | Shaqooyin | ZeilaLink",
    description:
      "Browse verified jobs and remote opportunities for Somali professionals.",
    images: [absoluteUrl("/twitter-image")],
  },
};

interface JobsLoadResult {
  jobs: PublicJob[];
  loadError: boolean;
}

const loadPublishedJobs = async (): Promise<JobsLoadResult> => {
  try {
    const response = await serverApiGet<unknown>("/jobs?limit=100");
    const jobs = parseJobsResponse(response);

    if (!jobs) {
      return { jobs: [], loadError: true };
    }

    return { jobs, loadError: false };
  } catch {
    return { jobs: [], loadError: true };
  }
};

export default async function JobsPage() {
  const { jobs, loadError } = await loadPublishedJobs();

  return (
    <JobsClient
      initialJobs={jobs}
      loadError={loadError}
      renderedAt={new Date().toISOString()}
    />
  );
}
