import { PrismaClient } from "@prisma/client";

export async function seedSkills(prisma: PrismaClient) {
  const skills = [
    {
      id: "seed-skill-customer-service",
      name: "Customer Service",
      nameSo: "Adeegga Macaamiisha",
      description: "Professional communication and customer support skills.",
      descriptionSo: "Xirfadaha isgaarsiinta iyo taageerada macaamiisha.",
      category: "Business",
    },
    {
      id: "seed-skill-web-development",
      name: "Web Development",
      nameSo: "Horumarinta Webka",
      description:
        "Building and maintaining modern websites and web applications.",
      descriptionSo:
        "Dhisidda iyo dayactirka website-yada iyo barnaamijyada webka.",
      category: "Technology",
    },
    {
      id: "seed-skill-automotive-repair",
      name: "Automotive Repair",
      nameSo: "Dayactirka Baabuurta",
      description:
        "Vehicle inspection, maintenance, and mechanical repair skills.",
      descriptionSo:
        "Xirfadaha baaritaanka, daryeelka iyo dayactirka baabuurta.",
      category: "Automotive",
    },
    {
      id: "seed-skill-translation",
      name: "Translation",
      nameSo: "Turjumaad",
      description: "Translation and interpretation between multiple languages.",
      descriptionSo: "Turjumaad iyo fasiraad u dhexeysa luqado kala duwan.",
      category: "Language",
    },
    {
      id: "seed-skill-warehouse",
      name: "Warehouse Operations",
      nameSo: "Hawlaha Bakhaarka",
      description:
        "Warehouse safety, inventory handling, packing, and logistics.",
      descriptionSo:
        "Badbaadada bakhaarka, maaraynta alaabta, xirxiridda iyo saadka.",
      category: "Operations",
    },
  ];

  const results = [];

  for (const skill of skills) {
    results.push(
      await prisma.skill.upsert({
        where: { name: skill.name },
        update: skill,
        create: skill,
      }),
    );
  }

  return {
    customerService: results[0],
    webDevelopment: results[1],
    automotiveRepair: results[2],
    translation: results[3],
    warehouseOperations: results[4],
  };
}
