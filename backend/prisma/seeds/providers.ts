import { PrismaClient } from "@prisma/client";

export async function seedProviders(
  prisma: PrismaClient,
  users: any,
  businesses: any,
) {
  const providers = [
    {
      id: "seed-provider-zeila-skills",
      slug: "zeila-skills-academy",
      contactUserId: users.aminaNur.id,
      businessId: null,

      name: "Zeila Skills Academy",
      nameSo: "Akadeemiyada Xirfadaha Zeila",

      description:
        "Career and workforce training for job seekers and working professionals.",
      descriptionSo:
        "Tababar shaqo iyo xirfadeed oo loogu talagalay shaqo-doonka iyo xirfadlayaasha.",

      logoUrl:
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=80",

      website: null,
      phone: "+1-612-555-3001",
      email: "training@example.com",

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      rating: 4.8,
      verified: true,
      verifiedAt: new Date(),
      active: true,
    },
    {
      id: "seed-provider-community-career",
      slug: "community-career-institute",
      contactUserId: users.nimcoAden.id,
      businessId: null,

      name: "Community Career Institute",
      nameSo: "Machadka Xirfadaha Bulshada",

      description:
        "Community-focused training programs supporting employment and professional development.",
      descriptionSo:
        "Barnaamijyo tababar oo bulshada ka caawiya shaqo helidda iyo horumarinta xirfadaha.",

      logoUrl:
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=500&q=80",

      website: null,
      phone: "+1-651-555-3002",
      email: "career@example.com",

      address: null,
      city: "St. Paul",
      state: "MN",
      postalCode: null,
      country: "US",

      rating: 4.6,
      verified: true,
      verifiedAt: new Date(),
      active: true,
    },
  ];

  const results = [];

  for (const provider of providers) {
    results.push(
      await prisma.provider.upsert({
        where: { id: provider.id },
        update: provider,
        create: provider,
      }),
    );
  }

  return {
    zeilaSkillsAcademy: results[0],
    communityCareerInstitute: results[1],
  };
}
