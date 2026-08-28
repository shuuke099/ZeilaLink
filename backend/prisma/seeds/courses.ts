import { PrismaClient } from "@prisma/client";

type SeedProviders = {
  northstarCareerCenter: { id: string };
  twinCitiesTechAcademy: { id: string };
  metroTradesInstitute: { id: string };
  communityLanguageCenter: { id: string };
  metroWorkforceCenter: { id: string };
};

type SeedSkills = {
  customerService: { id: string };
  conflictResolution: { id: string };

  html: { id: string };
  css: { id: string };
  javascript: { id: string };
  react: { id: string };
  nodejs: { id: string };
  databases: { id: string };

  automotiveRepair: { id: string };
  vehicleDiagnostics: { id: string };

  translation: { id: string };
  interpretation: { id: string };

  warehouseOperations: { id: string };
  inventoryManagement: { id: string };
};

export async function seedCourses(
  prisma: PrismaClient,
  providers: SeedProviders,
  skills: SeedSkills,
) {
  const courses = [
    {
      course: {
        id: "seed-course-customer-service",
        slug: "customer-service-excellence",

        name: "Customer Service Excellence",
        nameSo: "Heer Sare ee Adeegga Macaamiisha",

        description:
          "Develop practical customer service, professional communication, conflict resolution, and workplace service skills.",
        descriptionSo:
          "Horumari xirfadaha adeegga macaamiisha, isgaarsiinta xirfadeed, xalinta khilaafaadka iyo adeegga goobta shaqada.",

        providerId: providers.northstarCareerCenter.id,

        category: "Business",
        level: "Beginner",

        duration: "4 weeks",
        durationSo: "4 toddobaad",

        deliveryMode: "in_person",

        address: "100 Example Ave",
        city: "Minneapolis",
        state: "MN",
        postalCode: "55401",
        country: "US",
        timezone: "America/Chicago",

        onlineUrl: null,

        startDate: new Date("2026-09-14T00:00:00.000Z"),
        endDate: new Date("2026-10-09T00:00:00.000Z"),
        registrationDeadline: new Date("2026-09-10T23:59:59.000Z"),

        schedule: "Monday and Wednesday, 6:00 PM – 8:00 PM",
        scheduleSo: "Isniin iyo Arbaco, 6:00 PM – 8:00 PM",

        cost: 199,
        currency: "USD",

        enrollmentUrl: "https://example.com/northstar/customer-service",
        enrollmentOpen: true,

        imageUrl:
          "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",

        gallery: [
          "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        ],

        providesCertificate: true,
        certificateUrl: null,

        published: true,
        featured: true,
        featuredUntil: null,
      },

      skillIds: [skills.customerService.id, skills.conflictResolution.id],
    },

    {
      course: {
        id: "seed-course-web-development-foundations",
        slug: "web-development-foundations",

        name: "Web Development Foundations",
        nameSo: "Aasaaska Horumarinta Webka",

        description:
          "Learn the foundations of modern web development including HTML, CSS, JavaScript, responsive design, and frontend development.",
        descriptionSo:
          "Baro aasaaska horumarinta webka casriga ah oo ay ku jiraan HTML, CSS, JavaScript iyo naqshadda responsive-ka.",

        providerId: providers.twinCitiesTechAcademy.id,

        category: "Technology",
        level: "Beginner",

        duration: "8 weeks",
        durationSo: "8 toddobaad",

        deliveryMode: "online",

        address: null,
        city: null,
        state: null,
        postalCode: null,
        country: "US",
        timezone: "America/Chicago",

        onlineUrl: "https://example.com/tech-academy/web-development",

        startDate: new Date("2026-09-15T00:00:00.000Z"),
        endDate: new Date("2026-11-05T00:00:00.000Z"),
        registrationDeadline: new Date("2026-09-12T23:59:59.000Z"),

        schedule: "Tuesday and Thursday, 6:00 PM – 8:30 PM",
        scheduleSo: "Talaado iyo Khamiis, 6:00 PM – 8:30 PM",

        cost: 399,
        currency: "USD",

        enrollmentUrl:
          "https://example.com/tech-academy/register/web-development",
        enrollmentOpen: true,

        imageUrl:
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",

        gallery: [
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
        ],

        providesCertificate: true,
        certificateUrl: null,

        published: true,
        featured: true,
        featuredUntil: null,
      },

      skillIds: [skills.html.id, skills.css.id, skills.javascript.id],
    },

    {
      course: {
        id: "seed-course-full-stack-web-development",
        slug: "full-stack-web-development",

        name: "Full Stack Web Development",
        nameSo: "Horumarinta Full Stack Webka",

        description:
          "Build modern full stack applications while learning frontend development, backend development, APIs, databases, and application architecture.",
        descriptionSo:
          "Baro dhisidda barnaamijyada full stack oo ay ku jiraan frontend, backend, API-yada iyo database-yada.",

        providerId: providers.twinCitiesTechAcademy.id,

        category: "Technology",
        level: "Intermediate",

        duration: "12 weeks",
        durationSo: "12 toddobaad",

        deliveryMode: "hybrid",

        address: "200 Example St",
        city: "Minneapolis",
        state: "MN",
        postalCode: "55403",
        country: "US",
        timezone: "America/Chicago",

        onlineUrl: "https://example.com/tech-academy/full-stack",

        startDate: new Date("2026-09-21T00:00:00.000Z"),
        endDate: new Date("2026-12-11T00:00:00.000Z"),
        registrationDeadline: new Date("2026-09-17T23:59:59.000Z"),

        schedule: "Monday and Wednesday, 6:00 PM – 8:00 PM",
        scheduleSo: "Isniin iyo Arbaco, 6:00 PM – 8:00 PM",

        cost: 599,
        currency: "USD",

        enrollmentUrl: "https://example.com/tech-academy/register/full-stack",
        enrollmentOpen: true,

        imageUrl:
          "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",

        gallery: [
          "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        ],

        providesCertificate: true,
        certificateUrl: null,

        published: true,
        featured: true,
        featuredUntil: null,
      },

      skillIds: [
        skills.html.id,
        skills.css.id,
        skills.javascript.id,
        skills.react.id,
        skills.nodejs.id,
        skills.databases.id,
      ],
    },

    {
      course: {
        id: "seed-course-automotive-repair",
        slug: "automotive-repair-basics",

        name: "Automotive Repair Basics",
        nameSo: "Aasaaska Dayactirka Baabuurta",

        description:
          "Gain hands-on experience with vehicle inspections, routine maintenance, brakes, batteries, and basic diagnostics.",
        descriptionSo:
          "Hel khibrad gacanta ah oo ku saabsan baaritaanka baabuurta, dayactirka joogtada ah, biriigyada, baytariyada iyo baaritaanka aasaasiga ah.",

        providerId: providers.metroTradesInstitute.id,

        category: "Automotive",
        level: "Beginner",

        duration: "6 weeks",
        durationSo: "6 toddobaad",

        deliveryMode: "in_person",

        address: "300 Example Rd",
        city: "St. Paul",
        state: "MN",
        postalCode: "55101",
        country: "US",
        timezone: "America/Chicago",

        onlineUrl: null,

        startDate: new Date("2026-09-19T00:00:00.000Z"),
        endDate: new Date("2026-10-24T00:00:00.000Z"),
        registrationDeadline: new Date("2026-09-15T23:59:59.000Z"),

        schedule: "Saturday, 9:00 AM – 1:00 PM",
        scheduleSo: "Sabti, 9:00 AM – 1:00 PM",

        cost: 299,
        currency: "USD",

        enrollmentUrl: "https://example.com/trades/register/automotive",
        enrollmentOpen: true,

        imageUrl:
          "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80",

        gallery: [
          "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80",
        ],

        providesCertificate: true,
        certificateUrl: null,

        published: true,
        featured: true,
        featuredUntil: null,
      },

      skillIds: [skills.automotiveRepair.id, skills.vehicleDiagnostics.id],
    },

    {
      course: {
        id: "seed-course-somali-english-interpretation",
        slug: "somali-english-interpretation",

        name: "Somali-English Interpretation",
        nameSo: "Fasiraadda Soomaali-Ingiriisi",

        description:
          "Develop practical Somali-English interpretation and translation skills for professional, workplace, and community settings.",
        descriptionSo:
          "Horumari xirfadaha fasiraadda iyo turjumaadda Soomaali-Ingiriisi ee goobaha xirfadeed, shaqada iyo bulshada.",

        providerId: providers.communityLanguageCenter.id,

        category: "Language",
        level: "Intermediate",

        duration: "5 weeks",
        durationSo: "5 toddobaad",

        deliveryMode: "hybrid",

        address: "400 Example Blvd",
        city: "St. Paul",
        state: "MN",
        postalCode: "55104",
        country: "US",
        timezone: "America/Chicago",

        onlineUrl: "https://example.com/language-center/interpretation",

        startDate: new Date("2026-10-03T00:00:00.000Z"),
        endDate: new Date("2026-10-31T00:00:00.000Z"),
        registrationDeadline: new Date("2026-09-28T23:59:59.000Z"),

        schedule: "Saturday, 10:00 AM – 12:30 PM",
        scheduleSo: "Sabti, 10:00 AM – 12:30 PM",

        cost: 149,
        currency: "USD",

        enrollmentUrl:
          "https://example.com/language-center/register/interpretation",
        enrollmentOpen: true,

        imageUrl:
          "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1200&q=80",

        gallery: [
          "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
        ],

        providesCertificate: true,
        certificateUrl: null,

        published: true,
        featured: true,
        featuredUntil: null,
      },

      skillIds: [skills.translation.id, skills.interpretation.id],
    },

    {
      course: {
        id: "seed-course-warehouse-operations",
        slug: "warehouse-safety-operations",

        name: "Warehouse Safety & Operations",
        nameSo: "Badbaadada iyo Hawlaha Bakhaarka",

        description:
          "Learn practical warehouse safety, receiving, packing, shipping, inventory handling, and workplace procedures.",
        descriptionSo:
          "Baro badbaadada bakhaarka, soo-dhoweynta, xirxiridda, dirista, maaraynta alaabta iyo habraacyada shaqada.",

        providerId: providers.metroWorkforceCenter.id,

        category: "Operations",
        level: "Beginner",

        duration: "3 weeks",
        durationSo: "3 toddobaad",

        deliveryMode: "in_person",

        address: "500 Example Dr",
        city: "Minneapolis",
        state: "MN",
        postalCode: "55411",
        country: "US",
        timezone: "America/Chicago",

        onlineUrl: null,

        startDate: new Date("2026-09-12T00:00:00.000Z"),
        endDate: new Date("2026-09-27T00:00:00.000Z"),
        registrationDeadline: new Date("2026-09-09T23:59:59.000Z"),

        schedule: "Saturday and Sunday, 9:00 AM – 12:00 PM",
        scheduleSo: "Sabti iyo Axad, 9:00 AM – 12:00 PM",

        cost: 0,
        currency: "USD",

        enrollmentUrl: "https://example.com/workforce/register/warehouse",
        enrollmentOpen: true,

        imageUrl:
          "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",

        gallery: [
          "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1200&q=80",
        ],

        providesCertificate: true,
        certificateUrl: null,

        published: true,
        featured: true,
        featuredUntil: null,
      },

      skillIds: [skills.warehouseOperations.id, skills.inventoryManagement.id],
    },
  ];

  const seededCourses = [];

  for (const item of courses) {
    const course = await prisma.course.upsert({
      where: {
        id: item.course.id,
      },

      update: item.course,

      create: item.course,
    });

    await prisma.courseSkill.deleteMany({
      where: {
        courseId: course.id,
      },
    });

    await prisma.courseSkill.createMany({
      data: item.skillIds.map((skillId) => ({
        courseId: course.id,
        skillId,
      })),

      skipDuplicates: true,
    });

    seededCourses.push(course);
  }

  return {
    customerService: seededCourses[0],
    webDevelopmentFoundations: seededCourses[1],
    fullStackWebDevelopment: seededCourses[2],
    automotiveRepair: seededCourses[3],
    somaliEnglishInterpretation: seededCourses[4],
    warehouseOperations: seededCourses[5],
  };
}
