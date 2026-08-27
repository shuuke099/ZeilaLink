import { PrismaClient } from "@prisma/client";

export async function seedMessages(
  prisma: PrismaClient,
  users: any,
  jobs: any,
) {
  const messages = [
    {
      id: "seed-message-1",
      fromUserId: users.hodanAli.id,
      toUserId: users.employerUser.id,
      jobId: jobs.restaurantServer.id,
      content:
        "Hello, I am interested in this position. Is the job still available?",
      read: true,
      readAt: new Date("2026-08-20T10:30:00"),
    },
    {
      id: "seed-message-2",
      fromUserId: users.employerUser.id,
      toUserId: users.hodanAli.id,
      jobId: jobs.restaurantServer.id,
      content:
        "Yes, the position is still available. Thank you for your interest.",
      read: true,
      readAt: new Date("2026-08-20T11:00:00"),
    },
    {
      id: "seed-message-3",
      fromUserId: users.ahmedOmar.id,
      toUserId: users.employerUser.id,
      jobId: jobs.automotiveServiceAdvisor.id,
      content:
        "I submitted my application and wanted to confirm that it was received.",
      read: true,
      readAt: new Date("2026-08-22T14:00:00"),
    },
    {
      id: "seed-message-4",
      fromUserId: users.sahraMohamed.id,
      toUserId: users.employerUser.id,
      jobId: jobs.transportationDispatcher.id,
      content: "Does this position require previous dispatching experience?",
      read: false,
      readAt: null,
    },
    {
      id: "seed-message-5",
      fromUserId: users.employerUser.id,
      toUserId: users.sahraMohamed.id,
      jobId: jobs.transportationDispatcher.id,
      content:
        "Previous experience is preferred, but we also consider candidates with strong communication skills.",
      read: false,
      readAt: null,
    },
  ];

  for (const message of messages) {
    await prisma.message.upsert({
      where: {
        id: message.id,
      },
      update: message,
      create: message,
    });
  }
}
