export interface HomeJob {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  createdAt: string;
  employer: {
    name: string;
    logoUrl?: string;
    avatarUrl?: string | null;
  };
}

export interface HomeTraining {
  id: string;
  name: string;
  duration: string;
  cost: number;
  provider: {
    name: string;
    logoUrl?: string | null;
  };
}

export interface HomeStats {
  jobs: string;
  trainings: string;
  workers: string;
  successRate: string;
}

// DEMO/illustrative content: intentionally static so the homepage never waits
// for API data. The UI must identify these records and totals as non-live.
export const FEATURED_JOBS: HomeJob[] = [
  {
    id: "seed-job-warehouse-associate",
    title: "Warehouse Associate",
    location: "Minneapolis, MN",
    employmentType: "Full-time",
    createdAt: "2026-01-01T00:00:00.000Z",
    employer: { name: "ZeilaLink Business Solutions" },
  },
  {
    id: "seed-job-rideshare-driver",
    title: "Rideshare Driver",
    location: "Minneapolis, MN",
    employmentType: "Part-time",
    createdAt: "2026-01-01T00:00:00.000Z",
    employer: { name: "ZeilaLink Business Solutions" },
  },
];

export const FEATURED_TRAININGS: HomeTraining[] = [
  {
    id: "seed-training-customer-service",
    name: "Customer Service Excellence",
    duration: "4 weeks",
    cost: 299,
    provider: { name: "ZeilaLink Skills Academy" },
  },
];

export const HOME_STATS: HomeStats = {
  jobs: "2.5k+",
  trainings: "150+",
  workers: "12k+",
  successRate: "98%",
};
