import "../src/config/env";

import { PrismaClient } from "@prisma/client";
import { seedEmployers } from "./seeds/employers";
import { seedJobs } from "./seeds/jobs";

const prisma = new PrismaClient();

async function main() {
  let [safariRestaurant, abdiAutoRepair, amanTransportation] =
    await Promise.all([
      prisma.employer.findUnique({
        where: { id: "seed-employer-safari-restaurant" },
        select: { id: true },
      }),
      prisma.employer.findUnique({
        where: { id: "seed-employer-abdi-auto-repair" },
        select: { id: true },
      }),
      prisma.employer.findUnique({
        where: { id: "seed-employer-aman-transportation" },
        select: { id: true },
      }),
    ]);

  if (!safariRestaurant || !abdiAutoRepair || !amanTransportation) {
    const [abdiHassan, mohamedAbdi, ibrahimAden, safariBusiness, autoBusiness, transportationBusiness] = await Promise.all([
      prisma.user.findUnique({ where: { email: "abdi.hassan@example.com" }, select: { id: true } }),
      prisma.user.findUnique({ where: { email: "mohamed.abdi@example.com" }, select: { id: true } }),
      prisma.user.findUnique({ where: { email: "ibrahim.aden@example.com" }, select: { id: true } }),
      prisma.business.findUnique({ where: { id: "seed-business-safari-restaurant" }, select: { id: true } }),
      prisma.business.findUnique({ where: { id: "seed-business-abdi-auto-repair" }, select: { id: true } }),
      prisma.business.findUnique({ where: { id: "seed-business-aman-transportation" }, select: { id: true } }),
    ]);

    if (!abdiHassan || !mohamedAbdi || !ibrahimAden || !safariBusiness || !autoBusiness || !transportationBusiness) {
      throw new Error("Required seed users or businesses are missing. Run prisma:seed:businesses first.");
    }

    const employers = await seedEmployers(
      prisma,
      { abdiHassan, mohamedAbdi, ibrahimAden },
      {
        safariRestaurant: safariBusiness,
        abdiAutoRepair: autoBusiness,
        amanTransportation: transportationBusiness,
      },
    );
    safariRestaurant = employers.safariRestaurant;
    abdiAutoRepair = employers.abdiAutoRepair;
    amanTransportation = employers.amanTransportation;
  }

  const jobs = await seedJobs(prisma, {
    safariRestaurant,
    abdiAutoRepair,
    amanTransportation,
  });

  console.log(`Job seed completed: ${Object.keys(jobs).length} jobs.`);
}

main()
  .catch((error) => {
    console.error("Job seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
