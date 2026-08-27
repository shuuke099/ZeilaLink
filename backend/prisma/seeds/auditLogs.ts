import { PrismaClient } from "@prisma/client";

export async function seedAuditLogs(
  prisma: PrismaClient,
  users: any,
  businesses: any,
  jobs: any,
) {
  const auditLogs = [
    {
      id: "seed-audit-1",
      userId: users.admin.id,
      action: "BUSINESS_VERIFIED",
      resourceType: "Business",
      resourceId: businesses.safariRestaurant.id,
      meta: {
        verified: true,
        source: "seed",
      },
    },
    {
      id: "seed-audit-2",
      userId: users.employerUser.id,
      action: "JOB_CREATED",
      resourceType: "Job",
      resourceId: jobs.restaurantServer.id,
      meta: {
        title: jobs.restaurantServer.title,
        source: "seed",
      },
    },
    {
      id: "seed-audit-3",
      userId: users.employerUser.id,
      action: "JOB_PUBLISHED",
      resourceType: "Job",
      resourceId: jobs.automotiveServiceAdvisor.id,
      meta: {
        published: true,
        source: "seed",
      },
    },
    {
      id: "seed-audit-4",
      userId: users.admin.id,
      action: "BUSINESS_FEATURED",
      resourceType: "Business",
      resourceId: businesses.hodanPhotography.id,
      meta: {
        featured: true,
        source: "seed",
      },
    },
    {
      id: "seed-audit-5",
      userId: users.admin.id,
      action: "USER_VERIFIED",
      resourceType: "User",
      resourceId: users.hodanAli.id,
      meta: {
        verified: true,
        source: "seed",
      },
    },
  ];

  for (const auditLog of auditLogs) {
    await prisma.auditLog.upsert({
      where: {
        id: auditLog.id,
      },
      update: auditLog,
      create: auditLog,
    });
  }
}
