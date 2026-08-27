import { PrismaClient } from "@prisma/client";

type SeedEmployers = {
  safariRestaurant: { id: string };
  abdiAutoRepair: { id: string };
  amanTransportation: { id: string };
};

export async function seedJobs(prisma: PrismaClient, employers: SeedEmployers) {
  const jobSeeds = [
    {
      id: "seed-job-restaurant-server",
      slug: "restaurant-server-safari",

      title: "Restaurant Server",
      titleSo: "Shaqaale Adeegga Makhaayadda",

      description:
        "Safari Restaurant is looking for a friendly and reliable restaurant server to assist customers, take orders, serve meals, and maintain a welcoming dining environment.",
      descriptionSo:
        "Makhaayadda Safari waxay raadineysaa shaqaale adeeg oo saaxiibtinimo leh laguna kalsoonaan karo, kaas oo caawinaya macaamiisha, qaadaya dalabaadka, cuntada adeegaya, isla markaana ilaalinaya jawi wanaagsan.",

      requirements:
        "Strong customer service skills, good communication, reliability, and ability to work in a fast-paced restaurant environment.",
      requirementsSo:
        "Xirfad wanaagsan oo adeegga macaamiisha ah, isgaarsiin wanaagsan, isku hallayn iyo awoodda ka shaqaynta jawi makhaayadeed oo mashquul badan.",

      benefits:
        "Flexible scheduling, employee meals, and opportunities for additional hours.",
      benefitsSo:
        "Jadwal dabacsan, cunto shaqaale iyo fursado saacado shaqo oo dheeraad ah.",

      employerId: employers.safariRestaurant.id,

      location: "Minneapolis, MN",
      city: "Minneapolis",
      state: "MN",
      postalCode: "55415",
      country: "US",

      remote: false,

      salaryMin: 15,
      salaryMax: 20,
      salaryCurrency: "USD",
      salaryPeriod: "hour",

      employmentType: "Full-time",

      tags: ["restaurant", "server", "customer-service", "hospitality"],

      published: true,
      viewsCount: 142,

      applicationDeadline: null,
    },

    {
      id: "seed-job-line-cook",
      slug: "line-cook-safari",

      title: "Line Cook",
      titleSo: "Cunto Kariyaha Makhaayadda",

      description:
        "Prepare meals according to restaurant standards, maintain a clean kitchen workstation, and support daily food preparation operations.",
      descriptionSo:
        "Diyaari cuntada si waafaqsan heerarka makhaayadda, ilaali nadaafadda goobta jikada, kana qaybqaado diyaarinta cuntada maalinlaha ah.",

      requirements:
        "Basic food preparation experience, ability to work efficiently, knowledge of kitchen safety, and dependable attendance.",
      requirementsSo:
        "Khibrad aasaasi ah oo diyaarinta cuntada, awood shaqo oo hufan, aqoonta badbaadada jikada iyo joogitaan lagu kalsoonaan karo.",

      benefits:
        "Employee meals, flexible scheduling, training, and opportunities for advancement.",
      benefitsSo:
        "Cunto shaqaale, jadwal dabacsan, tababar iyo fursado horumar shaqo.",

      employerId: employers.safariRestaurant.id,

      location: "Minneapolis, MN",
      city: "Minneapolis",
      state: "MN",
      postalCode: "55415",
      country: "US",

      remote: false,

      salaryMin: 18,
      salaryMax: 23,
      salaryCurrency: "USD",
      salaryPeriod: "hour",

      employmentType: "Full-time",

      tags: ["restaurant", "cook", "kitchen", "food-service"],

      published: true,
      viewsCount: 96,

      applicationDeadline: null,
    },

    {
      id: "seed-job-cashier",
      slug: "cashier-safari",

      title: "Cashier",
      titleSo: "Qasnade",

      description:
        "Assist customers with orders and payments while providing professional and friendly customer service.",
      descriptionSo:
        "Ka caawi macaamiisha dalabaadka iyo lacag-bixinta adigoo siinaya adeeg xirfad leh oo saaxiibtinimo leh.",

      requirements:
        "Customer service skills, basic math skills, attention to detail, and ability to operate a point-of-sale system.",
      requirementsSo:
        "Xirfadaha adeegga macaamiisha, xisaab aasaasi ah, taxaddar faahfaahsan iyo awoodda isticmaalka nidaamka lacag-bixinta.",

      benefits: "Flexible schedule, employee meals, and on-the-job training.",
      benefitsSo:
        "Jadwal dabacsan, cunto shaqaale iyo tababar shaqada gudaheeda ah.",

      employerId: employers.safariRestaurant.id,

      location: "Minneapolis, MN",
      city: "Minneapolis",
      state: "MN",
      postalCode: "55415",
      country: "US",

      remote: false,

      salaryMin: 15,
      salaryMax: 18,
      salaryCurrency: "USD",
      salaryPeriod: "hour",

      employmentType: "Part-time",

      tags: ["cashier", "restaurant", "customer-service"],

      published: true,
      viewsCount: 118,

      applicationDeadline: null,
    },

    {
      id: "seed-job-auto-technician",
      slug: "automotive-technician-abdi-auto",

      title: "Automotive Technician",
      titleSo: "Farsamayaqaan Baabuur",

      description:
        "Diagnose, maintain, and repair customer vehicles including brakes, suspension, batteries, and general mechanical systems.",
      descriptionSo:
        "Baar, dayactir oo hagaaji baabuurta macaamiisha, oo ay ku jiraan biriigyada, suspension-ka, baytariyada iyo nidaamyada makaanikada guud.",

      requirements:
        "Automotive repair experience, knowledge of vehicle systems, ability to use diagnostic equipment, and a valid driver license.",
      requirementsSo:
        "Khibrad dayactirka baabuurta, aqoonta nidaamyada baabuurta, awoodda isticmaalka qalabka baaritaanka iyo laysan wadis oo sax ah.",

      benefits:
        "Competitive pay, training opportunities, employee discounts, and career growth.",
      benefitsSo:
        "Mushahar tartan leh, fursado tababar, qiimo-dhimis shaqaale iyo horumar shaqo.",

      employerId: employers.abdiAutoRepair.id,

      location: "Minneapolis, MN",
      city: "Minneapolis",
      state: "MN",
      postalCode: "55404",
      country: "US",

      remote: false,

      salaryMin: 25,
      salaryMax: 35,
      salaryCurrency: "USD",
      salaryPeriod: "hour",

      employmentType: "Full-time",

      tags: ["automotive", "mechanic", "technician", "repair"],

      published: true,
      viewsCount: 205,

      applicationDeadline: null,
    },

    {
      id: "seed-job-auto-service-advisor",
      slug: "service-advisor-abdi-auto",

      title: "Automotive Service Advisor",
      titleSo: "La-taliyaha Adeegga Baabuurta",

      description:
        "Assist customers with vehicle service requests, explain recommended repairs, schedule appointments, and coordinate work with technicians.",
      descriptionSo:
        "Ka caawi macaamiisha codsiyada dayactirka baabuurta, sharax dayactirrada lagu taliyay, qorshee ballamaha, iskuna xidh macaamiisha iyo farsamayaqaannada.",

      requirements:
        "Strong communication, customer service experience, basic automotive knowledge, and organizational skills.",
      requirementsSo:
        "Isgaarsiin wanaagsan, khibrad adeegga macaamiisha, aqoon aasaasi ah oo baabuurta ah iyo xirfado abaabul.",

      benefits:
        "Paid training, employee discounts, and opportunities for advancement.",
      benefitsSo:
        "Tababar mushahar leh, qiimo-dhimis shaqaale iyo fursado horumar shaqo.",

      employerId: employers.abdiAutoRepair.id,

      location: "Minneapolis, MN",
      city: "Minneapolis",
      state: "MN",
      postalCode: "55404",
      country: "US",

      remote: false,

      salaryMin: 20,
      salaryMax: 27,
      salaryCurrency: "USD",
      salaryPeriod: "hour",

      employmentType: "Full-time",

      tags: ["automotive", "customer-service", "service-advisor"],

      published: true,
      viewsCount: 137,

      applicationDeadline: null,
    },

    {
      id: "seed-job-auto-shop-helper",
      slug: "shop-helper-abdi-auto",

      title: "Auto Shop Helper",
      titleSo: "Kaaliyaha Goobta Dayactirka",

      description:
        "Support automotive technicians by organizing tools, maintaining work areas, moving vehicles, and assisting with basic shop duties.",
      descriptionSo:
        "Ka taageer farsamayaqaannada baabuurta diyaarinta qalabka, nadaafadda goobta shaqada, dhaqaajinta baabuurta iyo hawlaha aasaasiga ah ee goobta dayactirka.",

      requirements:
        "Reliable attendance, willingness to learn, ability to perform physical tasks, and valid driver license preferred.",
      requirementsSo:
        "Joogitaan lagu kalsoonaan karo, rabitaan waxbarasho, awood hawlo jireed iyo laysan wadis oo la doorbidayo.",

      benefits:
        "On-the-job training and opportunity to develop automotive repair skills.",
      benefitsSo:
        "Tababar shaqada gudaheeda ah iyo fursad lagu horumariyo xirfadaha dayactirka baabuurta.",

      employerId: employers.abdiAutoRepair.id,

      location: "Minneapolis, MN",
      city: "Minneapolis",
      state: "MN",
      postalCode: "55404",
      country: "US",

      remote: false,

      salaryMin: 17,
      salaryMax: 21,
      salaryCurrency: "USD",
      salaryPeriod: "hour",

      employmentType: "Full-time",

      tags: ["automotive", "entry-level", "shop-helper"],

      published: true,
      viewsCount: 173,

      applicationDeadline: null,
    },

    {
      id: "seed-job-driver",
      slug: "driver-aman-transportation",

      title: "Passenger Driver",
      titleSo: "Darawal Rakaab",

      description:
        "Transport passengers safely throughout the Twin Cities while providing reliable and professional customer service.",
      descriptionSo:
        "Si ammaan ah ugu qaad rakaabka magaalooyinka mataanaha adigoo siinaya adeeg lagu kalsoonaan karo oo xirfad leh.",

      requirements:
        "Valid driver license, safe driving record, reliable attendance, customer service skills, and familiarity with the Twin Cities area.",
      requirementsSo:
        "Laysan wadis oo sax ah, taariikh wadis oo wanaagsan, joogitaan lagu kalsoonaan karo, xirfadaha adeegga macaamiisha iyo aqoonta magaalooyinka mataanaha.",

      benefits:
        "Flexible scheduling, training, and opportunities for additional hours.",
      benefitsSo: "Jadwal dabacsan, tababar iyo fursado saacado dheeraad ah.",

      employerId: employers.amanTransportation.id,

      location: "Minneapolis–St. Paul, MN",
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      remote: false,

      salaryMin: 20,
      salaryMax: 27,
      salaryCurrency: "USD",
      salaryPeriod: "hour",

      employmentType: "Full-time",

      tags: ["driver", "transportation", "customer-service"],

      published: true,
      viewsCount: 324,

      applicationDeadline: null,
    },

    {
      id: "seed-job-dispatcher",
      slug: "dispatcher-aman-transportation",

      title: "Transportation Dispatcher",
      titleSo: "Isuduwaha Gaadiidka",

      description:
        "Coordinate drivers, passenger pickups, schedules, and daily transportation operations.",
      descriptionSo:
        "Isku dubbarid darawallada, qaadista rakaabka, jadwalka iyo hawlaha gaadiidka maalinlaha ah.",

      requirements:
        "Strong communication, organization, basic computer skills, and ability to manage multiple transportation requests.",
      requirementsSo:
        "Isgaarsiin wanaagsan, abaabul, xirfadaha kombiyuutarka aasaasiga ah iyo awoodda maaraynta codsiyo gaadiid oo badan.",

      benefits:
        "Paid training, stable schedule, and advancement opportunities.",
      benefitsSo:
        "Tababar mushahar leh, jadwal deggan iyo fursado horumar shaqo.",

      employerId: employers.amanTransportation.id,

      location: "Minneapolis, MN",
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      remote: false,

      salaryMin: 21,
      salaryMax: 28,
      salaryCurrency: "USD",
      salaryPeriod: "hour",

      employmentType: "Full-time",

      tags: ["dispatcher", "transportation", "operations"],

      published: true,
      viewsCount: 187,

      applicationDeadline: null,
    },

    {
      id: "seed-job-customer-service",
      slug: "customer-service-aman-transportation",

      title: "Customer Service Representative",
      titleSo: "Wakiilka Adeegga Macaamiisha",

      description:
        "Assist customers with transportation reservations, questions, schedule changes, and general service requests.",
      descriptionSo:
        "Ka caawi macaamiisha qabsashada gaadiidka, su’aalaha, beddelka jadwalka iyo codsiyada adeegga guud.",

      requirements:
        "Strong communication skills, professional phone etiquette, basic computer skills, and customer service experience preferred.",
      requirementsSo:
        "Xirfado isgaarsiin oo wanaagsan, hab-dhaqan xirfad leh oo telefoonka ah, xirfadaha kombiyuutarka aasaasiga ah iyo khibrad adeegga macaamiisha oo la doorbidayo.",

      benefits:
        "Paid training, flexible scheduling, and opportunities for advancement.",
      benefitsSo:
        "Tababar mushahar leh, jadwal dabacsan iyo fursado horumar shaqo.",

      employerId: employers.amanTransportation.id,

      location: "Minneapolis, MN",
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      remote: false,

      salaryMin: 18,
      salaryMax: 23,
      salaryCurrency: "USD",
      salaryPeriod: "hour",

      employmentType: "Full-time",

      tags: ["customer-service", "transportation", "office"],

      published: true,
      viewsCount: 211,

      applicationDeadline: null,
    },

    {
      id: "seed-job-bookkeeper",
      slug: "part-time-bookkeeper-aman-transportation",

      title: "Part-Time Bookkeeper",
      titleSo: "Xisaabiye Waqti-dhiman",

      description:
        "Maintain basic financial records, organize invoices and expenses, assist with payment records, and support routine bookkeeping tasks.",
      descriptionSo:
        "Maamul diiwaannada maaliyadeed ee aasaasiga ah, abaabul qaansheegyada iyo kharashaadka, kana caawi diiwaanka lacag-bixinta iyo hawlaha xisaabaadka.",

      requirements:
        "Bookkeeping experience, attention to detail, basic spreadsheet skills, and ability to maintain accurate financial records.",
      requirementsSo:
        "Khibrad xisaabeed, taxaddar faahfaahsan, xirfadaha spreadsheet-ka aasaasiga ah iyo awoodda ilaalinta diiwaanno maaliyadeed oo sax ah.",

      benefits: "Flexible part-time schedule and hybrid work options.",
      benefitsSo:
        "Jadwal waqti-dhiman oo dabacsan iyo fursad shaqo isku-dhafan.",

      employerId: employers.amanTransportation.id,

      location: "Minneapolis, MN",
      city: "Minneapolis",
      state: "MN",
      postalCode: null,
      country: "US",

      remote: true,

      salaryMin: 22,
      salaryMax: 30,
      salaryCurrency: "USD",
      salaryPeriod: "hour",

      employmentType: "Part-time",

      tags: ["bookkeeping", "accounting", "part-time", "hybrid"],

      published: true,
      viewsCount: 156,

      applicationDeadline: null,
    },
  ];

  const seededJobs = [];

  for (const job of jobSeeds) {
    const seededJob = await prisma.job.upsert({
      where: {
        id: job.id,
      },
      update: {
        slug: job.slug,

        title: job.title,
        titleSo: job.titleSo,

        description: job.description,
        descriptionSo: job.descriptionSo,

        requirements: job.requirements,
        requirementsSo: job.requirementsSo,

        benefits: job.benefits,
        benefitsSo: job.benefitsSo,

        employerId: job.employerId,

        location: job.location,
        city: job.city,
        state: job.state,
        postalCode: job.postalCode,
        country: job.country,

        remote: job.remote,

        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        salaryPeriod: job.salaryPeriod,

        employmentType: job.employmentType,

        tags: job.tags,

        published: job.published,
        viewsCount: job.viewsCount,

        applicationDeadline: job.applicationDeadline,
      },
      create: job,
    });

    seededJobs.push(seededJob);
  }

  return {
    restaurantServer: seededJobs[0],
    lineCook: seededJobs[1],
    cashier: seededJobs[2],

    automotiveTechnician: seededJobs[3],
    automotiveServiceAdvisor: seededJobs[4],
    autoShopHelper: seededJobs[5],

    passengerDriver: seededJobs[6],
    transportationDispatcher: seededJobs[7],
    customerServiceRepresentative: seededJobs[8],
    bookkeeper: seededJobs[9],
  };
}
