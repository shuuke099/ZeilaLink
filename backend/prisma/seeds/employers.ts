import { PrismaClient } from "@prisma/client";

type SeedUsers = {
  abdiHassan: { id: string };
  mohamedAbdi: { id: string };
  ibrahimAden: { id: string };
};

type SeedBusinesses = {
  safariRestaurant: { id: string };
  abdiAutoRepair: { id: string };
  amanTransportation: { id: string };
};

export async function seedEmployers(
  prisma: PrismaClient,
  users: SeedUsers,
  businesses: SeedBusinesses,
) {
  const employerSeeds = [
    {
      id: "seed-employer-safari-restaurant",
      slug: "safari-restaurant-employer",

      userId: users.abdiHassan.id,
      businessId: businesses.safariRestaurant.id,

      name: "Safari Restaurant",
      nameSo: "Makhaayadda Safari",

      description:
        "Somali and East African restaurant offering employment opportunities in food service, hospitality, and restaurant operations.",
      descriptionSo:
        "Makhaayad Soomaaliyeed iyo Bariga Afrika ah oo bixisa fursado shaqo oo ku saabsan adeegga cuntada, martigelinta iyo hawlaha makhaayadda.",

      logoUrl:
        "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=500&q=80",

      bannerUrl:
        "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80",

      website: null,
      phone: "+1-612-555-0201",
      email: "safari@example.com",

      address: "301 Example Ave",
      city: "Minneapolis",
      state: "MN",
      postalCode: "55415",
      country: "US",

      verified: true,
      verifiedAt: new Date(),
      active: true,
    },

    {
      id: "seed-employer-abdi-auto-repair",
      slug: "abdi-auto-repair-employer",

      userId: users.mohamedAbdi.id,
      businessId: businesses.abdiAutoRepair.id,

      name: "Abdi Auto Repair",
      nameSo: "Dayactirka Baabuurta Abdi",

      description:
        "Automotive repair business hiring skilled technicians and support staff for vehicle repair and maintenance operations.",
      descriptionSo:
        "Ganacsi dayactirka baabuurta ah oo shaqaaleysiinaya farsamayaqaanno iyo shaqaale taageero oo ka shaqeeya dayactirka iyo daryeelka baabuurta.",

      logoUrl:
        "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=500&q=80",

      bannerUrl:
        "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1600&q=80",

      website: null,
      phone: "+1-612-555-0204",
      email: "abdiauto@example.com",

      address: "1820 Example Ave",
      city: "Minneapolis",
      state: "MN",
      postalCode: "55404",
      country: "US",

      verified: true,
      verifiedAt: new Date(),
      active: true,
    },

    {
      id: "seed-employer-aman-transportation",
      slug: "aman-transportation-employer",

      userId: users.ibrahimAden.id,
      businessId: businesses.amanTransportation.id,

      name: "Aman Transportation",
      nameSo: "Gaadiidka Aman",

      description:
        "Transportation company offering employment opportunities for drivers, dispatchers, customer service representatives, and operations staff.",
      descriptionSo:
        "Shirkad gaadiid oo bixisa fursado shaqo oo loogu talagalay darawallada, dispatchers-ka, shaqaalaha adeegga macaamiisha iyo hawlaha shirkadda.",

      logoUrl:
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=500&q=80",

      bannerUrl:
        "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1600&q=80",

      website: null,
      phone: "+1-612-555-0207",
      email: "aman@example.com",

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      verified: true,
      verifiedAt: new Date(),
      active: true,
    },
  ];

  const seededEmployers = [];

  for (const employer of employerSeeds) {
    const seededEmployer = await prisma.employer.upsert({
      where: {
        id: employer.id,
      },

      update: {
        slug: employer.slug,

        userId: employer.userId,
        businessId: employer.businessId,

        name: employer.name,
        nameSo: employer.nameSo,

        description: employer.description,
        descriptionSo: employer.descriptionSo,

        logoUrl: employer.logoUrl,
        bannerUrl: employer.bannerUrl,

        website: employer.website,
        phone: employer.phone,
        email: employer.email,

        address: employer.address,
        city: employer.city,
        state: employer.state,
        postalCode: employer.postalCode,
        country: employer.country,

        verified: employer.verified,
        verifiedAt: employer.verifiedAt,
        active: employer.active,
      },

      create: employer,
    });

    seededEmployers.push(seededEmployer);
  }

  return {
    safariRestaurant: seededEmployers[0],
    abdiAutoRepair: seededEmployers[1],
    amanTransportation: seededEmployers[2],
  };
}
