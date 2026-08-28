import { PrismaClient } from "@prisma/client";

export async function seedProviders(prisma: PrismaClient) {
  const providers = [
    {
      id: "seed-provider-northstar-career-center",
      slug: "northstar-career-center",

      contactUserId: null,
      businessId: null,

      name: "Northstar Career Center",
      nameSo: null,

      description:
        "Career development and workforce training programs for job seekers and working professionals.",
      descriptionSo: null,

      logoUrl:
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=80",

      website: "https://example.com/northstar-career-center",
      phone: "+1-612-555-3001",
      email: "northstar@example.com",

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",
      timezone: "America/Chicago",

      rating: 4.8,
      verified: true,
      verifiedAt: new Date("2026-01-15"),
      active: true,
    },

    {
      id: "seed-provider-twin-cities-tech-academy",
      slug: "twin-cities-tech-academy",

      contactUserId: null,
      businessId: null,

      name: "Twin Cities Tech Academy",
      nameSo: null,

      description:
        "Technology education provider offering practical courses in web development and software skills.",
      descriptionSo: null,

      logoUrl:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=80",

      website: "https://example.com/twin-cities-tech-academy",
      phone: "+1-612-555-3002",
      email: "tech@example.com",

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",
      timezone: "America/Chicago",

      rating: 4.9,
      verified: true,
      verifiedAt: new Date("2026-02-10"),
      active: true,
    },

    {
      id: "seed-provider-metro-trades-institute",
      slug: "metro-trades-institute",

      contactUserId: null,
      businessId: null,

      name: "Metro Trades Institute",
      nameSo: null,

      description:
        "Hands-on career training focused on automotive repair, diagnostics, and skilled trades.",
      descriptionSo: null,

      logoUrl:
        "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=500&q=80",

      website: "https://example.com/metro-trades-institute",
      phone: "+1-651-555-3003",
      email: "trades@example.com",

      address: null,
      city: "St. Paul",
      state: "MN",
      postalCode: null,
      country: "US",
      timezone: "America/Chicago",

      rating: 4.7,
      verified: true,
      verifiedAt: new Date("2026-03-05"),
      active: true,
    },

    {
      id: "seed-provider-community-language-center",
      slug: "community-language-center",

      contactUserId: null,
      businessId: null,

      name: "Community Language Center",
      nameSo: null,

      description:
        "Language education and professional interpretation training for multilingual communities.",
      descriptionSo: null,

      logoUrl:
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=500&q=80",

      website: "https://example.com/community-language-center",
      phone: "+1-612-555-3004",
      email: "language@example.com",

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",
      timezone: "America/Chicago",

      rating: 4.8,
      verified: true,
      verifiedAt: new Date("2026-04-12"),
      active: true,
    },

    {
      id: "seed-provider-metro-workforce-center",
      slug: "metro-workforce-center",

      contactUserId: null,
      businessId: null,

      name: "Metro Workforce Center",
      nameSo: null,

      description:
        "Workforce development programs focused on employment readiness, warehouse operations, and career advancement.",
      descriptionSo: null,

      logoUrl:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=500&q=80",

      website: "https://example.com/metro-workforce-center",
      phone: "+1-651-555-3005",
      email: "workforce@example.com",

      address: null,
      city: "St. Paul",
      state: "MN",
      postalCode: null,
      country: "US",
      timezone: "America/Chicago",

      rating: 4.6,
      verified: true,
      verifiedAt: new Date("2026-05-20"),
      active: true,
    },
  ];

  const results = [];

  for (const provider of providers) {
    results.push(
      await prisma.provider.upsert({
        where: {
          id: provider.id,
        },
        update: provider,
        create: provider,
      }),
    );
  }

  return {
    northstarCareerCenter: results[0],
    twinCitiesTechAcademy: results[1],
    metroTradesInstitute: results[2],
    communityLanguageCenter: results[3],
    metroWorkforceCenter: results[4],
  };
}
