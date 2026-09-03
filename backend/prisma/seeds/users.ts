import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword, validatePassword } from "../../src/utils/password";

const requiredSeedPassword = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required before running the seed`);
  }

  const error = validatePassword(value);

  if (error) {
    throw new Error(`${name}: ${error}`);
  }

  return value;
};

export async function seedUsers(prisma: PrismaClient) {
  const seedPassword = requiredSeedPassword("SEED_USER_PASSWORD");
  const passwordHash = await hashPassword(seedPassword);

  const userSeeds = [
    {
      id: "seed-user-admin",
      slug: "admin-user",
      name: "Admin User",
      email: "abduladimabdullahi95@gmail.com",
      passwordHash,
      role: UserRole.admin,
      phone: null,
      location: "Minneapolis, MN",

      bio: "ZeilaLink platform administrator.",
      bioSo: "Maamulaha madasha ZeilaLink.",

      headline: "Platform Administrator",
      headlineSo: "Maamulaha Madasha",

      profilePublic: false,
      preferredLanguage: "en",
      isVerified: true,

      avatarUrl:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=500&q=80",

      verificationToken: null,
      verificationExpires: null,
    },

    {
      id: "seed-user-abdi-hassan",
      slug: "abdi-hassan",
      name: "Abdi Hassan",
      email: "abdi.hassan@example.com",
      passwordHash,
      role: UserRole.employer,
      phone: "+1-612-555-1001",
      location: "Minneapolis, MN",

      bio: "Local business owner serving customers throughout the Minneapolis area.",
      bioSo:
        "Milkiile ganacsi maxalli ah oo macaamiisha ugu adeega magaalada Minneapolis iyo nawaaxigeeda.",

      headline: "Business Owner",
      headlineSo: "Milkiile Ganacsi",

      profilePublic: true,
      preferredLanguage: "so",
      isVerified: true,

      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",

      verificationToken: null,
      verificationExpires: null,
    },

    {
      id: "seed-user-hodan-ali",
      slug: "hodan-ali",
      name: "Hodan Ali",
      email: "hodan.ali@example.com",
      passwordHash,
      role: UserRole.worker,
      phone: "+1-612-555-1002",
      location: "Minneapolis, MN",

      bio: "Creative photographer specializing in weddings, family portraits, and community events.",
      bioSo:
        "Sawir-qaade hal-abuur leh oo ku takhasustay aroosyada, sawirrada qoyska iyo munaasabadaha bulshada.",

      headline: "Professional Photographer",
      headlineSo: "Sawir-qaade Xirfadle",

      profilePublic: true,
      preferredLanguage: "so",
      isVerified: true,

      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80",

      verificationToken: null,
      verificationExpires: null,
    },

    {
      id: "seed-user-fadumo-yusuf",
      slug: "fadumo-yusuf",
      name: "Fadumo Yusuf",
      email: "fadumo.yusuf@example.com",
      passwordHash,
      role: UserRole.worker,
      phone: "+1-612-555-1003",
      location: "St. Paul, MN",

      bio: "Reliable professional with experience in residential cleaning and customer service.",
      bioSo:
        "Xirfadle lagu kalsoonaan karo oo khibrad u leh nadaafadda guryaha iyo adeegga macaamiisha.",

      headline: "Cleaning Professional",
      headlineSo: "Xirfadle Nadaafadeed",

      profilePublic: true,
      preferredLanguage: "so",
      isVerified: true,

      avatarUrl:
        "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=500&q=80",

      verificationToken: null,
      verificationExpires: null,
    },

    {
      id: "seed-user-mohamed-abdi",
      slug: "mohamed-abdi",
      name: "Mohamed Abdi",
      email: "mohamed.abdi@example.com",
      passwordHash,
      role: UserRole.employer,
      phone: "+1-612-555-1004",
      location: "Minneapolis, MN",

      bio: "Automotive professional with experience in vehicle repair and maintenance.",
      bioSo:
        "Xirfadle baabuur oo khibrad u leh dayactirka iyo daryeelka baabuurta.",

      headline: "Automotive Business Owner",
      headlineSo: "Milkiile Ganacsi Baabuur",

      profilePublic: true,
      preferredLanguage: "so",
      isVerified: true,

      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80",

      verificationToken: null,
      verificationExpires: null,
    },

    {
      id: "seed-user-amina-nur",
      slug: "amina-nur",
      name: "Amina Nur",
      email: "amina.nur@example.com",
      passwordHash,
      role: UserRole.provider,
      phone: "+1-612-555-1005",
      location: "Minneapolis, MN",

      bio: "Community professional focused on education, training, and career development.",
      bioSo:
        "Xirfadle bulshada ah oo diiradda saarta waxbarashada, tababarka iyo horumarinta xirfadaha.",

      headline: "Training Provider",
      headlineSo: "Bixiyaha Tababarka",

      profilePublic: true,
      preferredLanguage: "so",
      isVerified: true,

      avatarUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80",

      verificationToken: null,
      verificationExpires: null,
    },

    {
      id: "seed-user-ahmed-omar",
      slug: "ahmed-omar",
      name: "Ahmed Omar",
      email: "ahmed.omar@example.com",
      passwordHash,
      role: UserRole.worker,
      phone: "+1-612-555-1006",
      location: "Bloomington, MN",

      bio: "Web developer building modern websites and digital solutions for small businesses.",
      bioSo:
        "Horumariye web oo dhisa website-yo casri ah iyo xalal dijitaal ah oo loogu talagalay ganacsiyada yaryar.",

      headline: "Web Developer",
      headlineSo: "Horumariye Web",

      profilePublic: true,
      preferredLanguage: "en",
      isVerified: true,

      avatarUrl:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80",

      verificationToken: null,
      verificationExpires: null,
    },

    {
      id: "seed-user-sahra-mohamed",
      slug: "sahra-mohamed",
      name: "Sahra Mohamed",
      email: "sahra.mohamed@example.com",
      passwordHash,
      role: UserRole.worker,
      phone: "+1-612-555-1007",
      location: "Minneapolis, MN",

      bio: "Bilingual professional providing Somali and English language support.",
      bioSo:
        "Xirfadle laba-luqadle ah oo bixisa taageero luqadeed oo Af-Soomaali iyo Ingiriisi ah.",

      headline: "Somali-English Translator",
      headlineSo: "Turjubaan Soomaali iyo Ingiriisi",

      profilePublic: true,
      preferredLanguage: "so",
      isVerified: true,

      avatarUrl:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&q=80",

      verificationToken: null,
      verificationExpires: null,
    },

    {
      id: "seed-user-ibrahim-aden",
      slug: "ibrahim-aden",
      name: "Ibrahim Aden",
      email: "ibrahim.aden@example.com",
      passwordHash,
      role: UserRole.employer,
      phone: "+1-612-555-1008",
      location: "Minneapolis, MN",

      bio: "Transportation professional serving customers throughout the Twin Cities.",
      bioSo:
        "Xirfadle gaadiid oo macaamiisha ugu adeega guud ahaan magaalooyinka mataanaha.",

      headline: "Transportation Business Owner",
      headlineSo: "Milkiile Ganacsi Gaadiid",

      profilePublic: true,
      preferredLanguage: "so",
      isVerified: true,

      avatarUrl:
        "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=500&q=80",

      verificationToken: null,
      verificationExpires: null,
    },

    {
      id: "seed-user-nimco-aden",
      slug: "nimco-aden",
      name: "Nimco Aden",
      email: "nimco.aden@example.com",
      passwordHash,
      role: UserRole.provider,
      phone: "+1-612-555-1009",
      location: "St. Paul, MN",

      bio: "Community service professional focused on helping families access reliable local services.",
      bioSo:
        "Xirfadle adeeg bulsho oo diiradda saarta ka caawinta qoysaska helitaanka adeegyo maxalli ah oo lagu kalsoonaan karo.",

      headline: "Community Service Provider",
      headlineSo: "Bixiyaha Adeegga Bulshada",

      profilePublic: true,
      preferredLanguage: "so",
      isVerified: true,

      avatarUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80",

      verificationToken: null,
      verificationExpires: null,
    },
  ];

  const seededUsers = [];

  for (const user of userSeeds) {
    const seededUser = await prisma.user.upsert({
      // The admin seed has a stable ID so its login email can be changed
      // without creating a second administrator account.
      where:
        user.id === "seed-user-admin"
          ? { id: user.id }
          : { email: user.email },

      update: {
        slug: user.slug,
        name: user.name,
        passwordHash: user.passwordHash,
        role: user.role,
        phone: user.phone,
        location: user.location,

        bio: user.bio,
        bioSo: user.bioSo,

        headline: user.headline,
        headlineSo: user.headlineSo,

        profilePublic: user.profilePublic,
        preferredLanguage: user.preferredLanguage,
        isVerified: user.isVerified,

        avatarUrl: user.avatarUrl,

        verificationToken: user.verificationToken,
        verificationExpires: user.verificationExpires,
      },

      create: user,
    });

    seededUsers.push(seededUser);
  }

  return {
    admin: seededUsers[0],
    abdiHassan: seededUsers[1],
    hodanAli: seededUsers[2],
    fadumoYusuf: seededUsers[3],
    mohamedAbdi: seededUsers[4],
    aminaNur: seededUsers[5],
    ahmedOmar: seededUsers[6],
    sahraMohamed: seededUsers[7],
    ibrahimAden: seededUsers[8],
    nimcoAden: seededUsers[9],

    worker: seededUsers[2],
    employee: seededUsers[3],
    employerUser: seededUsers[1],
    providerUser: seededUsers[5],
  };
}
