import "../src/config/env";

import { PrismaClient } from "@prisma/client";
import { seedServices } from "./seeds/services";

const prisma = new PrismaClient();

async function main() {
  const businesses = await prisma.business.findMany({
    where: {
      id: {
        in: [
          "seed-business-safari-restaurant",
          "seed-business-hodan-photography",
          "seed-business-barwaaqo-cleaning",
          "seed-business-abdi-auto-repair",
          "seed-business-somali-tax-services",
          "seed-business-zeila-web-solutions",
          "seed-business-aman-transportation",
          "seed-business-somali-translation",
          "seed-business-horn-moving",
        ],
      },
    },
    select: { id: true },
  });

  const byId = new Map(businesses.map((business) => [business.id, business]));
  await seedServices(prisma, {
    safariRestaurant: byId.get("seed-business-safari-restaurant"),
    hodanPhotography: byId.get("seed-business-hodan-photography"),
    barwaaqoCleaning: byId.get("seed-business-barwaaqo-cleaning"),
    abdiAutoRepair: byId.get("seed-business-abdi-auto-repair"),
    somaliTaxServices: byId.get("seed-business-somali-tax-services"),
    zeilaWebSolutions: byId.get("seed-business-zeila-web-solutions"),
    amanTransportation: byId.get("seed-business-aman-transportation"),
    somaliTranslation: byId.get("seed-business-somali-translation"),
    hornMoving: byId.get("seed-business-horn-moving"),
  });

  await prisma.service.deleteMany({
    where: {
      id: {
        in: ["seed-service-home-care", "seed-service-catering"],
      },
    },
  });

  console.log("Service seed completed: 8 services.");
}

main()
  .catch((error) => {
    console.error("Service seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
