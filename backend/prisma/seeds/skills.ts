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
      id: "seed-skill-conflict-resolution",
      name: "Conflict Resolution",
      nameSo: "Xallinta Khilaafaadka",
      description:
        "Techniques for handling disagreements and resolving workplace or customer conflicts.",
      descriptionSo:
        "Farsamooyinka lagu maareeyo laguna xalliyo khilaafaadka goobta shaqada ama macaamiisha.",
      category: "Business",
    },
    {
      id: "seed-skill-html",
      name: "HTML",
      nameSo: null,
      description: "Structuring modern web pages using semantic HTML.",
      descriptionSo: null,
      category: "Technology",
    },
    {
      id: "seed-skill-css",
      name: "CSS",
      nameSo: null,
      description: "Styling responsive and accessible web interfaces.",
      descriptionSo: null,
      category: "Technology",
    },
    {
      id: "seed-skill-javascript",
      name: "JavaScript",
      nameSo: null,
      description: "Programming interactive web applications with JavaScript.",
      descriptionSo: null,
      category: "Technology",
    },
    {
      id: "seed-skill-react",
      name: "React",
      nameSo: null,
      description: "Building component-based user interfaces with React.",
      descriptionSo: null,
      category: "Technology",
    },
    {
      id: "seed-skill-nodejs",
      name: "Node.js",
      nameSo: null,
      description: "Building server-side applications and APIs with Node.js.",
      descriptionSo: null,
      category: "Technology",
    },
    {
      id: "seed-skill-databases",
      name: "Databases",
      nameSo: null,
      description: "Working with application data and database fundamentals.",
      descriptionSo: null,
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
      id: "seed-skill-vehicle-diagnostics",
      name: "Vehicle Diagnostics",
      nameSo: "Baaritaanka Baabuurta",
      description: "Basic techniques for identifying common vehicle problems.",
      descriptionSo:
        "Farsamooyinka aasaasiga ah ee lagu ogaado dhibaatooyinka caadiga ah ee baabuurta.",
      category: "Automotive",
    },
    {
      id: "seed-skill-translation",
      name: "Translation",
      nameSo: "Turjumaad",
      description: "Translation between written content in multiple languages.",
      descriptionSo: "Turjumaadda qoraallada u dhexeeya luqado kala duwan.",
      category: "Language",
    },
    {
      id: "seed-skill-interpretation",
      name: "Interpretation",
      nameSo: "Fasiraad",
      description: "Professional spoken-language interpretation skills.",
      descriptionSo: "Xirfadaha fasiraadda hadalka ee xirfadeed.",
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
    {
      id: "seed-skill-inventory",
      name: "Inventory Management",
      nameSo: "Maareynta Alaabta",
      description: "Tracking, organizing, receiving, and handling inventory.",
      descriptionSo:
        "Diiwaangelinta, habeynta, soo-dhoweynta iyo maaraynta alaabta.",
      category: "Operations",
    },
  ];

  const results = [];

  for (const skill of skills) {
    const result = await prisma.skill.upsert({
      where: {
        name: skill.name,
      },
      update: {
        nameSo: skill.nameSo,
        description: skill.description,
        descriptionSo: skill.descriptionSo,
        category: skill.category,
      },
      create: skill,
    });

    results.push(result);
  }

  return {
    customerService: results[0],
    conflictResolution: results[1],

    html: results[2],
    css: results[3],
    javascript: results[4],
    react: results[5],
    nodejs: results[6],
    databases: results[7],

    automotiveRepair: results[8],
    vehicleDiagnostics: results[9],

    translation: results[10],
    interpretation: results[11],

    warehouseOperations: results[12],
    inventoryManagement: results[13],
  };
}
