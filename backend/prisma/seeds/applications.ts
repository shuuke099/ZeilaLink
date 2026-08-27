import { PrismaClient, ApplicationStatus } from "@prisma/client";

export async function seedApplications(
  prisma: PrismaClient,
  users: any,
  jobs: any,
) {
  const applications = [
    {
      id: "seed-application-1",
      jobId: jobs.restaurantServer.id,
      userId: users.hodanAli.id,
      coverLetter:
        "I am interested in this position and have strong customer service and communication skills.",
      status: ApplicationStatus.applied,
      statusHistory: [],
    },
    {
      id: "seed-application-2",
      jobId: jobs.lineCook.id,
      userId: users.fadumoYusuf.id,
      coverLetter:
        "I am dependable, hardworking, and interested in joining your restaurant team.",
      status: ApplicationStatus.reviewed,
      statusHistory: [
        {
          status: "applied",
          note: "Application submitted",
        },
        {
          status: "reviewed",
          note: "Application reviewed by employer",
        },
      ],
    },
    {
      id: "seed-application-3",
      jobId: jobs.automotiveServiceAdvisor.id,
      userId: users.ahmedOmar.id,
      coverLetter:
        "My customer service and communication experience would help me succeed in this position.",
      status: ApplicationStatus.applied,
      statusHistory: [],
    },
    {
      id: "seed-application-4",
      jobId: jobs.transportationDispatcher.id,
      userId: users.sahraMohamed.id,
      coverLetter:
        "I am bilingual in Somali and English and have strong communication and organizational skills.",
      status: ApplicationStatus.reviewed,
      statusHistory: [],
    },
    {
      id: "seed-application-5",
      jobId: jobs.customerServiceRepresentative.id,
      userId: users.hodanAli.id,
      coverLetter:
        "I am interested in helping customers and believe my communication skills are a good fit for this position.",
      status: ApplicationStatus.applied,
      statusHistory: [],
    },
  ];

  const results = [];

  for (const application of applications) {
    results.push(
      await prisma.application.upsert({
        where: { id: application.id },
        update: application,
        create: application,
      }),
    );
  }

  return results;
}
