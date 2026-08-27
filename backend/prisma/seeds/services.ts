import { PrismaClient } from "@prisma/client";

type SeedBusinesses = {
  safariRestaurant?: { id: string };
  hodanPhotography?: { id: string };
  barwaaqoCleaning?: { id: string };
  abdiAutoRepair?: { id: string };
  somaliTaxServices?: { id: string };
  zeilaWebSolutions?: { id: string };
  amanTransportation?: { id: string };
  nurHomeCare?: { id: string };
  somaliTranslation?: { id: string };
  hornMoving?: { id: string };
};

export async function seedServices(
  prisma: PrismaClient,
  businesses: SeedBusinesses,
) {
  const services = [
    {
      id: "seed-service-wedding-photography",
      slug: "wedding-photography",

      title: "Wedding Photography",
      titleSo: "Sawir-qaadista Arooska",

      description:
        "Professional wedding photography for ceremonies, receptions, and special celebrations. Includes professionally edited digital photos.",
      descriptionSo:
        "Sawir-qaadis xirfad leh oo loogu talagalay aroosyada, xafladaha iyo munaasabadaha gaarka ah. Waxaa ku jira sawirro dijitaal ah oo si xirfad leh loo habeeyey.",

      category: "Photography",
      subcategory: "Wedding Photography",

      provider: "Hodan Photography",
      businessId: businesses.hodanPhotography?.id ?? null,

      priceLabel: "Starting at $500",
      priceFrom: 500,
      priceType: "starting_at",

      image:
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0101",
      email: "photos@example.com",
      website: null,

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      latitude: null,
      longitude: null,

      serviceArea: [
        "Minneapolis, MN",
        "St. Paul, MN",
        "Bloomington, MN",
        "Brooklyn Park, MN",
      ],

      remoteAvailable: false,
      availabilityMode: "contact",

      rating: 4.9,
      reviewsCount: 42,
      viewsCount: 185,

      verified: true,
      featured: true,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-service-home-cleaning",
      slug: "professional-home-cleaning",

      title: "Professional Home Cleaning",
      titleSo: "Nadiifinta Guriga ee Xirfadaysan",

      description:
        "Reliable residential cleaning for apartments, houses, and townhomes. Services include kitchens, bathrooms, floors, dusting, and general home cleaning.",
      descriptionSo:
        "Adeeg nadiifin guryo oo lagu kalsoonaan karo, kuna habboon guryaha, dabaqyada iyo townhome-yada. Waxaa ka mid ah jikada, musqulaha, sagxadaha iyo nadiifinta guud.",

      category: "Cleaning",
      subcategory: "Home Cleaning",

      provider: "Barwaaqo Cleaning Services",
      businessId: businesses.barwaaqoCleaning?.id ?? null,

      priceLabel: "Starting at $120",
      priceFrom: 120,
      priceType: "starting_at",

      image:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0102",
      email: "cleaning@example.com",
      website: null,

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      latitude: null,
      longitude: null,

      serviceArea: [
        "Minneapolis, MN",
        "St. Paul, MN",
        "Edina, MN",
        "Bloomington, MN",
      ],

      remoteAvailable: false,
      availabilityMode: "contact",

      rating: 4.8,
      reviewsCount: 67,
      viewsCount: 230,

      verified: true,
      featured: true,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-service-auto-repair",
      slug: "general-auto-repair",

      title: "Auto Repair & Maintenance",
      titleSo: "Dayactirka iyo Daryeelka Baabuurta",

      description:
        "Professional vehicle maintenance and repair including diagnostics, brakes, oil changes, batteries, and general mechanical services.",
      descriptionSo:
        "Dayactir iyo daryeel baabuur oo xirfad leh, oo ay ku jiraan baaritaanka ciladaha, biriigyada, saliid beddelka, baytariyada iyo adeegyada makaanikada guud.",

      category: "Automotive",
      subcategory: "Auto Repair",

      provider: "Abdi Auto Repair",
      businessId: businesses.abdiAutoRepair?.id ?? null,

      priceLabel: "From $75",
      priceFrom: 75,
      priceType: "starting_at",

      image:
        "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0103",
      email: "repair@example.com",
      website: null,

      address: "1820 Example Ave",
      city: "Minneapolis",
      state: "MN",
      postalCode: "55404",
      country: "US",

      latitude: null,
      longitude: null,

      serviceArea: ["Minneapolis, MN"],

      remoteAvailable: false,
      availabilityMode: "contact",

      rating: 4.7,
      reviewsCount: 91,
      viewsCount: 410,

      verified: true,
      featured: false,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-service-tax-preparation",
      slug: "personal-tax-preparation",

      title: "Personal Tax Preparation",
      titleSo: "Diyaarinta Canshuurta Shakhsiyeed",

      description:
        "Tax preparation assistance for individuals and families, including federal and state tax returns and general filing support.",
      descriptionSo:
        "Caawinta diyaarinta canshuuraha shaqsiyaadka iyo qoysaska, oo ay ku jiraan canshuuraha federaalka, gobolka iyo taageerada gudbinta.",

      category: "Financial Services",
      subcategory: "Tax Preparation",

      provider: "Somali Tax Services",
      businessId: businesses.somaliTaxServices?.id ?? null,

      priceLabel: "Starting at $99",
      priceFrom: 99,
      priceType: "starting_at",

      image:
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0104",
      email: "tax@example.com",
      website: null,

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      latitude: null,
      longitude: null,

      serviceArea: ["Minnesota"],

      remoteAvailable: true,
      availabilityMode: "contact",

      rating: 4.9,
      reviewsCount: 54,
      viewsCount: 315,

      verified: true,
      featured: true,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-service-web-development",
      slug: "custom-web-development",

      title: "Custom Web Development",
      titleSo: "Samaynta Website Gaar ah",

      description:
        "Custom website development for businesses and organizations, including responsive design, backend development, API integration, and deployment.",
      descriptionSo:
        "Samaynta website gaar ah oo loogu talagalay ganacsiyada iyo ururrada, oo ay ku jiraan naqshad responsive ah, backend, API iyo deployment.",

      category: "Technology",
      subcategory: "Web Development",

      provider: "Zeila Web Solutions",
      businessId: businesses.zeilaWebSolutions?.id ?? null,

      priceLabel: "Starting at $1,500",
      priceFrom: 1500,
      priceType: "starting_at",

      image:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0105",
      email: "web@example.com",
      website: "https://example.com",

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      latitude: null,
      longitude: null,

      serviceArea: ["United States", "Canada"],

      remoteAvailable: true,
      availabilityMode: "contact",

      rating: 5.0,
      reviewsCount: 31,
      viewsCount: 290,

      verified: true,
      featured: true,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-service-translation",
      slug: "somali-english-translation",

      title: "Somali-English Translation",
      titleSo: "Turjumaadda Af-Soomaaliga iyo Ingiriisiga",

      description:
        "Professional Somali and English translation for documents, letters, business materials, and general communication.",
      descriptionSo:
        "Turjumaad xirfad leh oo Af-Soomaali iyo Ingiriisi ah, kuna habboon dukumentiyada, waraaqaha, ganacsiga iyo isgaarsiinta guud.",

      category: "Translation",
      subcategory: "Document Translation",

      provider: "Somali Translation Services",
      businessId: businesses.somaliTranslation?.id ?? null,

      priceLabel: "From $30",
      priceFrom: 30,
      priceType: "starting_at",

      image:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0106",
      email: "translation@example.com",
      website: null,

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      latitude: null,
      longitude: null,

      serviceArea: ["United States", "Canada"],

      remoteAvailable: true,
      availabilityMode: "contact",

      rating: 4.8,
      reviewsCount: 29,
      viewsCount: 175,

      verified: true,
      featured: false,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-service-moving",
      slug: "local-moving-service",

      title: "Local Moving Service",
      titleSo: "Adeegga Guurista Gudaha",

      description:
        "Reliable local moving assistance for apartments, homes, offices, furniture, and other household belongings.",
      descriptionSo:
        "Adeeg guuris oo lagu kalsoonaan karo oo loogu talagalay guryaha, dabaqyada, xafiisyada, alaabta guriga iyo hantida kale.",

      category: "Moving",
      subcategory: "Local Moving",

      provider: "Horn Moving Services",
      businessId: businesses.hornMoving?.id ?? null,

      priceLabel: "Starting at $120/hr",
      priceFrom: 120,
      priceType: "hourly",

      image:
        "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=1200&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0107",
      email: "moving@example.com",
      website: null,

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      latitude: null,
      longitude: null,

      serviceArea: [
        "Minneapolis, MN",
        "St. Paul, MN",
        "Bloomington, MN",
        "Brooklyn Park, MN",
      ],

      remoteAvailable: false,
      availabilityMode: "contact",

      rating: 4.7,
      reviewsCount: 73,
      viewsCount: 345,

      verified: true,
      featured: false,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-service-airport-transportation",
      slug: "airport-transportation",

      title: "Airport Transportation",
      titleSo: "Gaadiidka Garoonka Diyaaradaha",

      description:
        "Pre-arranged transportation to and from the airport for individuals, families, and small groups.",
      descriptionSo:
        "Gaadiid horay loo sii qorsheeyay oo lagu tago lagagana yimaado garoonka diyaaradaha, kuna habboon shaqsiyaadka, qoysaska iyo kooxaha yaryar.",

      category: "Transportation",
      subcategory: "Airport Transportation",

      provider: "Aman Transportation",
      businessId: businesses.amanTransportation?.id ?? null,

      priceLabel: "From $45",
      priceFrom: 45,
      priceType: "starting_at",

      image:
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0108",
      email: "transport@example.com",
      website: null,

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      latitude: null,
      longitude: null,

      serviceArea: ["Minneapolis, MN", "St. Paul, MN", "MSP Airport"],

      remoteAvailable: false,
      availabilityMode: "contact",

      rating: 4.8,
      reviewsCount: 85,
      viewsCount: 390,

      verified: true,
      featured: true,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-service-home-care",
      slug: "non-medical-home-care",

      title: "Non-Medical Home Care",
      titleSo: "Daryeelka Guriga ee Aan Caafimaadka Ahayn",

      description:
        "Non-medical in-home support including companionship, meal assistance, light housekeeping, and help with everyday activities.",
      descriptionSo:
        "Taageero guriga ah oo aan caafimaad ahayn, oo ay ku jiraan wehel, caawinta cuntada, nadiifinta fudud iyo hawlaha maalinlaha ah.",

      category: "Home Care",
      subcategory: "Non-Medical Home Care",

      provider: "Nur Home Care",
      businessId: businesses.nurHomeCare?.id ?? null,

      priceLabel: "Contact for pricing",
      priceFrom: null,
      priceType: "quote",

      image:
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1576765608866-5b51046452be?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0109",
      email: "homecare@example.com",
      website: null,

      address: null,
      city: "St. Paul",
      state: "MN",
      postalCode: null,
      country: "US",

      latitude: null,
      longitude: null,

      serviceArea: ["Minneapolis, MN", "St. Paul, MN", "Roseville, MN"],

      remoteAvailable: false,
      availabilityMode: "contact",

      rating: 4.9,
      reviewsCount: 46,
      viewsCount: 260,

      verified: true,
      featured: false,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-service-catering",
      slug: "somali-event-catering",

      title: "Somali Event Catering",
      titleSo: "Cunto Diyaarinta Munaasabadaha Soomaaliyeed",

      description:
        "Somali and East African catering for weddings, graduations, family gatherings, business events, and community celebrations.",
      descriptionSo:
        "Cunto diyaarin Soomaaliyeed iyo Bariga Afrika oo loogu talagalay aroosyada, qalin-jabinta, kulamada qoyska, munaasabadaha ganacsiga iyo xafladaha bulshada.",

      category: "Catering",
      subcategory: "Event Catering",

      provider: "Safari Restaurant",
      businessId: businesses.safariRestaurant?.id ?? null,

      priceLabel: "Contact for quote",
      priceFrom: null,
      priceType: "quote",

      image:
        "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0110",
      email: "catering@example.com",
      website: null,

      address: "301 Example Ave",
      city: "Minneapolis",
      state: "MN",
      postalCode: "55415",
      country: "US",

      latitude: null,
      longitude: null,

      serviceArea: ["Minneapolis, MN", "St. Paul, MN", "Bloomington, MN"],

      remoteAvailable: false,
      availabilityMode: "contact",

      rating: 4.8,
      reviewsCount: 118,
      viewsCount: 520,

      verified: true,
      featured: true,
      featuredUntil: null,

      published: true,
      active: true,
    },
  ];

  const seededServices = [];

  for (const service of services) {
    const seededService = await prisma.service.upsert({
      where: {
        id: service.id,
      },

      update: {
        slug: service.slug,

        title: service.title,
        titleSo: service.titleSo,

        description: service.description,
        descriptionSo: service.descriptionSo,

        category: service.category,
        subcategory: service.subcategory,

        provider: service.provider,
        businessId: service.businessId,

        priceLabel: service.priceLabel,
        priceFrom: service.priceFrom,
        priceType: service.priceType,

        image: service.image,
        gallery: service.gallery,

        phone: service.phone,
        email: service.email,
        website: service.website,

        address: service.address,
        city: service.city,
        state: service.state,
        postalCode: service.postalCode,
        country: service.country,

        latitude: service.latitude,
        longitude: service.longitude,

        serviceArea: service.serviceArea,
        remoteAvailable: service.remoteAvailable,

        availabilityMode: service.availabilityMode,

        rating: service.rating,
        reviewsCount: service.reviewsCount,
        viewsCount: service.viewsCount,

        verified: service.verified,
        featured: service.featured,
        featuredUntil: service.featuredUntil,

        published: service.published,
        active: service.active,
      },

      create: service,
    });

    seededServices.push(seededService);
  }

  return {
    weddingPhotography: seededServices[0],
    homeCleaning: seededServices[1],
    autoRepair: seededServices[2],
    taxPreparation: seededServices[3],
    webDevelopment: seededServices[4],
    translation: seededServices[5],
    moving: seededServices[6],
    airportTransportation: seededServices[7],
    homeCare: seededServices[8],
    catering: seededServices[9],
  };
}
