import type { Metadata } from "next";
import JobsClient from "./JobsClient";
import { parseJobsResponse, type PublicJob } from "./jobTypes";
import { serverApiGet } from "@/lib/serverApi";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find Jobs | ZeilaLink",
  description:
    "Browse published job opportunities from employers on ZeilaLink and find your next career move.",
};

interface JobsLoadResult {
  jobs: PublicJob[];
  loadError: boolean;
}

const loadPublishedJobs = async (): Promise<JobsLoadResult> => {
  try {
    const response = await serverApiGet<unknown>("/jobs");
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
