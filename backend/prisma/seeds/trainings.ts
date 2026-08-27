import { PrismaClient } from "@prisma/client";

export async function seedTrainings(
  prisma: PrismaClient,
  providers: any,
  skills: any,
) {
  const trainings = [
    {
      id: "seed-training-customer-service",
      slug: "customer-service-excellence",

      name: "Customer Service Excellence",
      nameSo: "Heer Sare ee Adeegga Macaamiisha",

      description:
        "Learn professional communication, customer support, conflict resolution, and workplace service skills.",
      descriptionSo:
        "Baro isgaarsiinta xirfadeed, taageerada macaamiisha, xalinta khilaafaadka iyo xirfadaha adeegga goobta shaqada.",

      providerId: providers.zeilaSkillsAcademy.id,
      skillId: skills.customerService.id,

      category: "Business",
      level: "Beginner",

      duration: "4 weeks",
      durationSo: "4 toddobaad",

      deliveryMode: "in_person",

      address: "Minneapolis, MN",
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      onlineUrl: null,

      schedule: "Monday and Wednesday, 6:00 PM – 8:00 PM",
      scheduleSo: "Isniin iyo Arbaco, 6:00 PM – 8:00 PM",

      cost: 199,
      currency: "USD",

      enrollmentUrl: null,
      enrollmentOpen: true,

      imageUrl:
        "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",

      providesCertificate: true,
      certificateUrl: null,

      published: true,
      featured: true,
      featuredUntil: null,
    },
    {
      id: "seed-training-web-development",
      slug: "web-development-foundations",

      name: "Web Development Foundations",
      nameSo: "Aasaaska Horumarinta Webka",

      description:
        "Introduction to HTML, CSS, JavaScript, responsive design, and modern web development.",
      descriptionSo:
        "Hordhac HTML, CSS, JavaScript, naqshadda responsive-ka iyo horumarinta webka casriga ah.",

      providerId: providers.zeilaSkillsAcademy.id,
      skillId: skills.webDevelopment.id,

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

      onlineUrl: "https://example.com/training/web-development",

      schedule: "Tuesday and Thursday, 6:00 PM – 8:30 PM",
      scheduleSo: "Talaado iyo Khamiis, 6:00 PM – 8:30 PM",

      cost: 399,
      currency: "USD",

      enrollmentUrl: "https://example.com/enroll/web-development",
      enrollmentOpen: true,

      imageUrl:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",

      providesCertificate: true,
      certificateUrl: null,

      published: true,
      featured: true,
      featuredUntil: null,
    },
    {
      id: "seed-training-auto-repair",
      slug: "automotive-repair-basics",

      name: "Automotive Repair Basics",
      nameSo: "Aasaaska Dayactirka Baabuurta",

      description:
        "Hands-on introduction to vehicle maintenance, inspections, brakes, batteries, and basic diagnostics.",
      descriptionSo:
        "Tababar gacanta ah oo ku saabsan daryeelka baabuurta, baaritaanka, biriigyada, baytariyada iyo baaritaanka aasaasiga ah.",

      providerId: providers.communityCareerInstitute.id,
      skillId: skills.automotiveRepair.id,

      category: "Automotive",
      level: "Beginner",

      duration: "6 weeks",
      durationSo: "6 toddobaad",

      deliveryMode: "in_person",

      address: "St. Paul, MN",
      city: "St. Paul",
      state: "MN",
      postalCode: null,
      country: "US",

      onlineUrl: null,

      schedule: "Saturday, 9:00 AM – 1:00 PM",
      scheduleSo: "Sabti, 9:00 AM – 1:00 PM",

      cost: 299,
      currency: "USD",

      enrollmentUrl: null,
      enrollmentOpen: true,

      imageUrl:
        "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80",

      providesCertificate: true,
      certificateUrl: null,

      published: true,
      featured: false,
      featuredUntil: null,
    },
    {
      id: "seed-training-translation",
      slug: "somali-english-interpretation",

      name: "Somali-English Interpretation",
      nameSo: "Turjumaadda Soomaali-Ingiriisi",

      description:
        "Develop professional Somali-English interpretation and translation skills for community and workplace settings.",
      descriptionSo:
        "Horumari xirfadaha turjumaadda Soomaali-Ingiriisi ee goobaha bulshada iyo shaqada.",

      providerId: providers.communityCareerInstitute.id,
      skillId: skills.translation.id,

      category: "Language",
      level: "Intermediate",

      duration: "5 weeks",
      durationSo: "5 toddobaad",

      deliveryMode: "hybrid",

      address: "St. Paul, MN",
      city: "St. Paul",
      state: "MN",
      postalCode: null,
      country: "US",

      onlineUrl: "https://example.com/training/interpretation",

      schedule: "Saturday, 10:00 AM – 12:00 PM",
      scheduleSo: "Sabti, 10:00 AM – 12:00 PM",

      cost: 149,
      currency: "USD",

      enrollmentUrl: null,
      enrollmentOpen: true,

      imageUrl:
        "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1200&q=80",

      providesCertificate: true,
      certificateUrl: null,

      published: true,
      featured: false,
      featuredUntil: null,
    },
    {
      id: "seed-training-warehouse",
      slug: "warehouse-safety-operations",

      name: "Warehouse Safety & Operations",
      nameSo: "Badbaadada iyo Hawlaha Bakhaarka",

      description:
        "Learn warehouse safety, inventory handling, packing, shipping, receiving, and workplace procedures.",
      descriptionSo:
        "Baro badbaadada bakhaarka, maaraynta alaabta, xirxiridda, dirista, soo-dhoweynta iyo habraacyada shaqada.",

      providerId: providers.zeilaSkillsAcademy.id,
      skillId: skills.warehouseOperations.id,

      category: "Operations",
      level: "Beginner",

      duration: "3 weeks",
      durationSo: "3 toddobaad",

      deliveryMode: "in_person",

      address: "Minneapolis, MN",
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      onlineUrl: null,

      schedule: "Saturday and Sunday, 9:00 AM – 12:00 PM",
      scheduleSo: "Sabti iyo Axad, 9:00 AM – 12:00 PM",

      cost: 99,
      currency: "USD",

      enrollmentUrl: null,
      enrollmentOpen: true,

      imageUrl:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",

      providesCertificate: true,
      certificateUrl: null,

      published: true,
      featured: false,
      featuredUntil: null,
    },
  ];

  const results = [];

  for (const training of trainings) {
    results.push(
      await prisma.training.upsert({
        where: { id: training.id },
        update: training,
        create: training,
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
