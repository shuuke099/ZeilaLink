import { PrismaClient } from "@prisma/client";

type SeedUsers = {
  admin: { id: string };
  worker: { id: string };
  employee: { id: string };
  employerUser: { id: string };
  providerUser: { id: string };
};

export async function seedBusinesses(prisma: PrismaClient, users: SeedUsers) {
  const businessSeeds = [
    {
      id: "seed-business-safari-restaurant",
      slug: "safari-restaurant",
      userId: users.employerUser.id,

      name: "Safari Restaurant",
      nameSo: "Makhaayadda Safari",

      description:
        "Somali and East African restaurant serving traditional meals, family dining, and catering for special events.",
      descriptionSo:
        "Makhaayad Soomaaliyeed iyo Bariga Afrika ah oo bixisa cunto dhaqameed, cunto qoys iyo adeeg cunto oo munaasabadaha ah.",

      category: "Food & Dining",
      subcategory: "Somali Restaurant",

      logoUrl:
        "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=500&q=80",

      bannerUrl:
        "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0201",
      email: "safari@example.com",
      website: null,

      address: "301 Example Ave",
      city: "Minneapolis",
      state: "MN",
      postalCode: "55415",
      country: "US",

      latitude: null,
      longitude: null,
      timezone: "America/Chicago",

      hasPhysicalLocation: true,
      serviceArea: ["Minneapolis, MN", "St. Paul, MN"],
      remoteAvailable: false,

      rating: 4.8,
      reviewsCount: 118,
      viewsCount: 780,

      verified: true,
      claimed: true,

      featured: true,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-business-hodan-photography",
      slug: "hodan-photography",
      userId: users.worker.id,

      name: "Hodan Photography",
      nameSo: "Hodan Sawir-qaadis",

      description:
        "Professional photography for weddings, graduations, family portraits, community events, and special celebrations.",
      descriptionSo:
        "Sawir-qaadis xirfad leh oo loogu talagalay aroosyada, qalin-jabinta, sawirrada qoyska, munaasabadaha bulshada iyo xafladaha gaarka ah.",

      category: "Photography",
      subcategory: "Wedding & Event Photography",

      logoUrl:
        "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=500&q=80",

      bannerUrl:
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0202",
      email: "hodan@example.com",
      website: null,

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      latitude: null,
      longitude: null,
      timezone: "America/Chicago",

      hasPhysicalLocation: false,
      serviceArea: [
        "Minneapolis, MN",
        "St. Paul, MN",
        "Bloomington, MN",
        "Brooklyn Park, MN",
      ],
      remoteAvailable: false,

      rating: 4.9,
      reviewsCount: 42,
      viewsCount: 425,

      verified: true,
      claimed: true,

      featured: true,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-business-barwaaqo-cleaning",
      slug: "barwaaqo-cleaning-services",
      userId: users.employee.id,

      name: "Barwaaqo Cleaning Services",
      nameSo: "Adeegga Nadaafadda Barwaaqo",

      description:
        "Residential and small-business cleaning services with flexible scheduling throughout the Twin Cities.",
      descriptionSo:
        "Adeegyada nadaafadda guryaha iyo ganacsiyada yaryar oo leh jadwal dabacsan guud ahaan magaalooyinka mataanaha.",

      category: "Cleaning",
      subcategory: "Residential Cleaning",

      logoUrl:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80",

      bannerUrl:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0203",
      email: "barwaaqo@example.com",
      website: null,

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      latitude: null,
      longitude: null,
      timezone: "America/Chicago",

      hasPhysicalLocation: false,
      serviceArea: [
        "Minneapolis, MN",
        "St. Paul, MN",
        "Bloomington, MN",
        "Edina, MN",
      ],
      remoteAvailable: false,

      rating: 4.8,
      reviewsCount: 67,
      viewsCount: 350,

      verified: true,
      claimed: true,

      featured: false,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-business-abdi-auto-repair",
      slug: "abdi-auto-repair",
      userId: users.employerUser.id,

      name: "Abdi Auto Repair",
      nameSo: "Dayactirka Baabuurta Abdi",

      description:
        "Local auto repair shop providing diagnostics, brake service, oil changes, battery replacement, and general vehicle maintenance.",
      descriptionSo:
        "Goob dayactir baabuur oo bixisa baaritaanka ciladaha, adeegga biriigyada, saliid beddelka, baytari beddelka iyo daryeelka guud ee baabuurta.",

      category: "Automotive",
      subcategory: "Auto Repair",

      logoUrl:
        "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=500&q=80",

      bannerUrl:
        "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1600&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0204",
      email: "abdiauto@example.com",
      website: null,

      address: "1820 Example Ave",
      city: "Minneapolis",
      state: "MN",
      postalCode: "55404",
      country: "US",

      latitude: null,
      longitude: null,
      timezone: "America/Chicago",

      hasPhysicalLocation: true,
      serviceArea: ["Minneapolis, MN", "St. Paul, MN"],
      remoteAvailable: false,

      rating: 4.7,
      reviewsCount: 91,
      viewsCount: 610,

      verified: true,
      claimed: true,

      featured: true,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-business-somali-tax-services",
      slug: "somali-tax-services",
      userId: users.providerUser.id,

      name: "Somali Tax Services",
      nameSo: "Adeegga Canshuuraha Soomaaliyeed",

      description:
        "Tax preparation and filing support for individuals, families, and small businesses.",
      descriptionSo:
        "Diyaarinta iyo gudbinta canshuuraha shaqsiyaadka, qoysaska iyo ganacsiyada yaryar.",

      category: "Financial Services",
      subcategory: "Tax Preparation",

      logoUrl:
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=500&q=80",

      bannerUrl:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0205",
      email: "tax@example.com",
      website: null,

      address: "2400 Example St",
      city: "Minneapolis",
      state: "MN",
      postalCode: "55407",
      country: "US",

      latitude: null,
      longitude: null,
      timezone: "America/Chicago",

      hasPhysicalLocation: true,
      serviceArea: ["Minnesota", "United States"],
      remoteAvailable: true,

      rating: 4.9,
      reviewsCount: 54,
      viewsCount: 440,

      verified: true,
      claimed: true,

      featured: true,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-business-zeila-web-solutions",
      slug: "zeila-web-solutions",
      userId: users.admin.id,

      name: "Zeila Web Solutions",
      nameSo: "Xalalka Webka Zeila",

      description:
        "Web development and digital technology services for businesses, organizations, and entrepreneurs.",
      descriptionSo:
        "Adeegyada samaynta website-yada iyo tiknoolajiyada dijitaalka ah ee ganacsiyada, ururrada iyo ganacsatada.",

      category: "Technology",
      subcategory: "Web Development",

      logoUrl:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=500&q=80",

      bannerUrl:
        "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1600&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0206",
      email: "web@example.com",
      website: "https://example.com",

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      latitude: null,
      longitude: null,
      timezone: "America/Chicago",

      hasPhysicalLocation: false,
      serviceArea: ["United States", "Canada"],
      remoteAvailable: true,

      rating: 5.0,
      reviewsCount: 31,
      viewsCount: 380,

      verified: true,
      claimed: true,

      featured: true,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-business-aman-transportation",
      slug: "aman-transportation",
      userId: users.employerUser.id,

      name: "Aman Transportation",
      nameSo: "Gaadiidka Aman",

      description:
        "Local transportation company providing scheduled rides, airport transportation, and transportation services throughout the Twin Cities.",
      descriptionSo:
        "Shirkad gaadiid oo bixisa safarro la sii qorsheeyay, gaadiidka garoonka diyaaradaha iyo adeegyada gaadiidka guud ahaan magaalooyinka mataanaha.",

      category: "Transportation",
      subcategory: "Passenger Transportation",

      logoUrl:
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=500&q=80",

      bannerUrl:
        "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1600&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0207",
      email: "aman@example.com",
      website: null,

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      latitude: null,
      longitude: null,
      timezone: "America/Chicago",

      hasPhysicalLocation: false,
      serviceArea: ["Minneapolis, MN", "St. Paul, MN", "MSP Airport"],
      remoteAvailable: false,

      rating: 4.8,
      reviewsCount: 85,
      viewsCount: 515,

      verified: true,
      claimed: true,

      featured: false,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-business-nur-home-care",
      slug: "nur-home-care",
      userId: users.providerUser.id,

      name: "Nur Home Care",
      nameSo: "Daryeelka Guriga Nur",

      description:
        "Community-focused non-medical home care business providing companionship and everyday support in the home.",
      descriptionSo:
        "Ganacsi daryeel guri oo bulshada u adeegaya, bixiyana wehel iyo taageerada hawlaha maalinlaha ah ee guriga.",

      category: "Home Care",
      subcategory: "Non-Medical Home Care",

      logoUrl:
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=500&q=80",

      bannerUrl:
        "https://images.unsplash.com/photo-1576765608866-5b51046452be?auto=format&fit=crop&w=1600&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1576765608866-5b51046452be?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0208",
      email: "nur@example.com",
      website: null,

      address: "1200 Example Blvd",
      city: "St. Paul",
      state: "MN",
      postalCode: "55104",
      country: "US",

      latitude: null,
      longitude: null,
      timezone: "America/Chicago",

      hasPhysicalLocation: true,
      serviceArea: ["Minneapolis, MN", "St. Paul, MN", "Roseville, MN"],
      remoteAvailable: false,

      rating: 4.9,
      reviewsCount: 46,
      viewsCount: 360,

      verified: true,
      claimed: true,

      featured: false,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-business-somali-translation",
      slug: "somali-translation-services",
      userId: users.worker.id,

      name: "Somali Translation Services",
      nameSo: "Adeegga Turjumaadda Soomaaliyeed",

      description:
        "Somali-English translation services for documents, businesses, organizations, and individuals.",
      descriptionSo:
        "Adeegyada turjumaadda Af-Soomaaliga iyo Ingiriisiga ee dukumentiyada, ganacsiyada, ururrada iyo shaqsiyaadka.",

      category: "Translation",
      subcategory: "Language Services",

      logoUrl:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=500&q=80",

      bannerUrl:
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0209",
      email: "translation@example.com",
      website: null,

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      latitude: null,
      longitude: null,
      timezone: "America/Chicago",

      hasPhysicalLocation: false,
      serviceArea: ["United States", "Canada"],
      remoteAvailable: true,

      rating: 4.8,
      reviewsCount: 29,
      viewsCount: 240,

      verified: true,
      claimed: true,

      featured: false,
      featuredUntil: null,

      published: true,
      active: true,
    },

    {
      id: "seed-business-horn-moving",
      slug: "horn-moving-services",
      userId: users.employee.id,

      name: "Horn Moving Services",
      nameSo: "Adeegga Guurista Horn",

      description:
        "Local moving company helping families and businesses move apartments, homes, offices, furniture, and household belongings.",
      descriptionSo:
        "Shirkad guuris oo maxalli ah oo qoysaska iyo ganacsiyada ka caawisa guurista guryaha, dabaqyada, xafiisyada, alaabta guriga iyo hantida kale.",

      category: "Moving",
      subcategory: "Local Moving",

      logoUrl:
        "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=500&q=80",

      bannerUrl:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80",

      gallery: [
        "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80",
      ],

      phone: "+1-612-555-0210",
      email: "moving@example.com",
      website: null,

      address: null,
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      latitude: null,
      longitude: null,
      timezone: "America/Chicago",

      hasPhysicalLocation: false,
      serviceArea: [
        "Minneapolis, MN",
        "St. Paul, MN",
        "Bloomington, MN",
        "Brooklyn Park, MN",
      ],
      remoteAvailable: false,

      rating: 4.7,
      reviewsCount: 73,
      viewsCount: 455,

      verified: true,
      claimed: true,

      featured: false,
      featuredUntil: null,

      published: true,
      active: true,
    },
  ];

  const seededBusinesses = [];

  for (const business of businessSeeds) {
    const seededBusiness = await prisma.business.upsert({
      where: {
        id: business.id,
      },

      update: {
        slug: business.slug,
        userId: business.userId,

        name: business.name,
        nameSo: business.nameSo,

        description: business.description,
        descriptionSo: business.descriptionSo,

        category: business.category,
        subcategory: business.subcategory,

        logoUrl: business.logoUrl,
        bannerUrl: business.bannerUrl,
        gallery: business.gallery,

        phone: business.phone,
        email: business.email,
        website: business.website,

        address: business.address,
        city: business.city,
        state: business.state,
        postalCode: business.postalCode,
        country: business.country,

        latitude: business.latitude,
        longitude: business.longitude,
        timezone: business.timezone,

        hasPhysicalLocation: business.hasPhysicalLocation,
        serviceArea: business.serviceArea,
        remoteAvailable: business.remoteAvailable,

        rating: business.rating,
        reviewsCount: business.reviewsCount,
        viewsCount: business.viewsCount,

        verified: business.verified,
        claimed: business.claimed,

        featured: business.featured,
        featuredUntil: business.featuredUntil,

        published: business.published,
        active: business.active,
      },

      create: business,
    });

    seededBusinesses.push(seededBusiness);
  }

  return {
    safariRestaurant: seededBusinesses[0],
    hodanPhotography: seededBusinesses[1],
    barwaaqoCleaning: seededBusinesses[2],
    abdiAutoRepair: seededBusinesses[3],
    somaliTaxServices: seededBusinesses[4],
    zeilaWebSolutions: seededBusinesses[5],
    amanTransportation: seededBusinesses[6],
    nurHomeCare: seededBusinesses[7],
    somaliTranslation: seededBusinesses[8],
    hornMoving: seededBusinesses[9],
  };
}
