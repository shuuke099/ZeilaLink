import '../src/config/env';
import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword, validatePassword } from '../src/utils/password';
import { createStableSlug } from '../src/utils/slug';

const prisma = new PrismaClient();

type SeedUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  location?: string;
  preferredLanguage?: string;
  headline?: string;
  headlineSo?: string;
  bio?: string;
  bioSo?: string;
  profilePublic?: boolean;
};

async function upsertUser(data: SeedUserInput) {
  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      passwordHash,
      role: data.role,
      phone: data.phone,
      location: data.location,
      headline: data.headline,
      headlineSo: data.headlineSo,
      bio: data.bio,
      bioSo: data.bioSo,
      profilePublic: data.profilePublic ?? false,
      preferredLanguage: data.preferredLanguage ?? 'en',
      isVerified: true,
    },
    create: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      phone: data.phone,
      location: data.location,
      headline: data.headline,
      headlineSo: data.headlineSo,
      bio: data.bio,
      bioSo: data.bioSo,
      profilePublic: data.profilePublic ?? false,
      preferredLanguage: data.preferredLanguage ?? 'en',
      isVerified: true,
    },
  });

  return user.slug
    ? user
    : prisma.user.update({
        where: { id: user.id },
        data: {
          slug: createStableSlug(
            user.name,
            user.id,
            user.role === UserRole.worker ? 'worker' : 'user',
          ),
        },
      });
}

const requiredSeedPassword = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required before running the demo seed`);
  }
  const error = validatePassword(value);
  if (error) throw new Error(`${name}: ${error}`);
  return value;
};

async function main() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_PRODUCTION_SEED !== 'true'
  ) {
    throw new Error(
      'Production seeding is disabled. Set ALLOW_PRODUCTION_SEED=true only for an intentional, reviewed seed run.',
    );
  }

  const admin = await upsertUser({
    name: 'Admin User',
    email: 'admin@zeilalink.com',
    password: requiredSeedPassword('SEED_ADMIN_PASSWORD'),
    role: UserRole.admin,
  });

  const worker = await upsertUser({
    name: 'Abduladim Abdullahi',
    email: 'worker@example.com',
    password: requiredSeedPassword('SEED_WORKER_PASSWORD'),
    role: UserRole.worker,
    phone: '+1234567890',
    location: 'Minneapolis, MN',
    preferredLanguage: 'so',
    headline: 'Warehouse and customer service professional',
    headlineSo: 'Xirfadle bakhaar iyo adeegga macaamiisha',
    bio: 'Reliable worker with experience supporting customers and warehouse operations.',
    bioSo: 'Shaqaale lagu kalsoonaan karo oo khibrad u leh adeegga macaamiisha iyo hawlaha bakhaarka.',
    profilePublic: true,
  });

  // "Employee" uses worker role in the current schema.
  const employee = await upsertUser({
    name: 'Fatima Ali',
    email: 'employee@example.com',
    password: requiredSeedPassword('SEED_EMPLOYEE_PASSWORD'),
    role: UserRole.worker,
    phone: '+1234567891',
    location: 'Minneapolis, MN',
    preferredLanguage: 'so',
    headline: 'Customer support specialist',
    headlineSo: 'Khabiir taageerada macaamiisha',
    bio: 'Customer-focused professional with strong communication and service skills.',
    bioSo: 'Xirfadle diiradda saara macaamiisha oo leh xirfado isgaarsiin iyo adeeg oo wanaagsan.',
    profilePublic: true,
  });

  const employerUser = await upsertUser({
    name: 'Sabirin Mohamed Ali',
    email: 'employer@example.com',
    password: requiredSeedPassword('SEED_EMPLOYER_PASSWORD'),
    role: UserRole.employer,
  });

  let employer = await prisma.employer.upsert({
    where: { userId: employerUser.id },
    update: {
      name: 'ZeilaLink Business Solutions',
      nameSo: 'Xalalka Ganacsiga ZeilaLink',
      description: 'A verified employer connecting workers with reliable opportunities.',
      descriptionSo: 'Loo-shaqeeye la xaqiijiyay oo shaqaalaha ku xira fursado lagu kalsoonaan karo.',
      verified: true,
    },
    create: {
      userId: employerUser.id,
      name: 'ZeilaLink Business Solutions',
      nameSo: 'Xalalka Ganacsiga ZeilaLink',
      description: 'A verified employer connecting workers with reliable opportunities.',
      descriptionSo: 'Loo-shaqeeye la xaqiijiyay oo shaqaalaha ku xira fursado lagu kalsoonaan karo.',
      verified: true,
    },
  });
  if (!employer.slug) {
    employer = await prisma.employer.update({
      where: { id: employer.id },
      data: { slug: createStableSlug(employer.name, employer.id, 'business') },
    });
  }

  const providerUser = await upsertUser({
    name: 'Training Institute',
    email: 'provider@example.com',
    password: requiredSeedPassword('SEED_PROVIDER_PASSWORD'),
    role: UserRole.provider,
  });

  let provider = await prisma.provider.upsert({
    where: { contactUserId: providerUser.id },
    update: {
      name: 'ZeilaLink Skills Academy',
      nameSo: 'Akadeemiyada Xirfadaha ZeilaLink',
      description: 'Professional training for ZeilaLink workers',
      descriptionSo: 'Tababar xirfadeed oo loogu talagalay shaqaalaha ZeilaLink',
      verified: true,
      rating: 4.5,
    },
    create: {
      name: 'ZeilaLink Skills Academy',
      nameSo: 'Akadeemiyada Xirfadaha ZeilaLink',
      contactUserId: providerUser.id,
      description: 'Professional training for ZeilaLink workers',
      descriptionSo: 'Tababar xirfadeed oo loogu talagalay shaqaalaha ZeilaLink',
      verified: true,
      rating: 4.5,
    },
  });
  if (!provider.slug) {
    provider = await prisma.provider.update({
      where: { id: provider.id },
      data: { slug: createStableSlug(provider.name, provider.id, 'provider') },
    });
  }

  // Create Skills
  const skill1 = await prisma.skill.upsert({
    where: { name: 'Customer Service' },
    update: {
      description: 'Customer service and communication skills',
      category: 'Service',
    },
    create: {
      name: 'Customer Service',
      description: 'Customer service and communication skills',
      category: 'Service',
    },
  });

  const skill2 = await prisma.skill.upsert({
    where: { name: 'Warehouse Operations' },
    update: {
      description: 'Warehouse management and logistics',
      category: 'Operations',
    },
    create: {
      name: 'Warehouse Operations',
      description: 'Warehouse management and logistics',
      category: 'Operations',
    },
  });

  // Create Sample Jobs
  let job1 = await prisma.job.upsert({
    where: { id: 'seed-job-warehouse-associate' },
    update: {
      title: 'Warehouse Associate',
      titleSo: 'Shaqaale Bakhaar',
      description: 'Looking for a reliable warehouse associate to join our team. Experience in warehouse operations preferred.',
      descriptionSo: 'Waxaan raadineynaa shaqaale bakhaar oo lagu kalsoonaan karo si uu kooxdayada ugu biiro. Khibrad hawlaha bakhaarka ah waa la doorbidayaa.',
      requirements: 'High school diploma, ability to lift 50lbs, attention to detail',
      requirementsSo: 'Shahaado dugsi sare, awoodda qaadista 50 rodol, iyo taxaddar faahfaahsan',
      benefits: 'Health insurance, paid time off, career growth opportunities',
      benefitsSo: 'Caymis caafimaad, fasax mushahar leh, iyo fursado koboc shaqo',
      employerId: employer.id,
      location: 'Minneapolis, MN',
      salaryMin: 40000,
      salaryMax: 50000,
      employmentType: 'Full-time',
      remote: false,
      tags: ['warehouse', 'logistics', 'full-time'],
      published: true,
    },
    create: {
      id: 'seed-job-warehouse-associate',
      title: 'Warehouse Associate',
      titleSo: 'Shaqaale Bakhaar',
      description: 'Looking for a reliable warehouse associate to join our team. Experience in warehouse operations preferred.',
      descriptionSo: 'Waxaan raadineynaa shaqaale bakhaar oo lagu kalsoonaan karo si uu kooxdayada ugu biiro. Khibrad hawlaha bakhaarka ah waa la doorbidayaa.',
      requirements: 'High school diploma, ability to lift 50lbs, attention to detail',
      requirementsSo: 'Shahaado dugsi sare, awoodda qaadista 50 rodol, iyo taxaddar faahfaahsan',
      benefits: 'Health insurance, paid time off, career growth opportunities',
      benefitsSo: 'Caymis caafimaad, fasax mushahar leh, iyo fursado koboc shaqo',
      employerId: employer.id,
      location: 'Minneapolis, MN',
      salaryMin: 40000,
      salaryMax: 50000,
      employmentType: 'Full-time',
      remote: false,
      tags: ['warehouse', 'logistics', 'full-time'],
      published: true,
    },
  });
  if (!job1.slug) {
    job1 = await prisma.job.update({
      where: { id: job1.id },
      data: { slug: createStableSlug(job1.title, job1.id, 'job') },
    });
  }

  let job2 = await prisma.job.upsert({
    where: { id: 'seed-job-rideshare-driver' },
    update: {
      title: 'Rideshare Driver',
      titleSo: 'Darawal Rakaab Wadaag',
      description: 'Flexible schedule driving with Uber/Lyft. Must have valid driver\'s license and clean driving record.',
      descriptionSo: 'Jadwal dabacsan oo lagu wado Uber ama Lyft. Waa in aad haysataa laysan sax ah iyo taariikh wadis oo wanaagsan.',
      requirements: 'Valid driver license, clean record, reliable vehicle',
      requirementsSo: 'Laysan sax ah, taariikh wadis oo wanaagsan, iyo gaari lagu kalsoonaan karo',
      benefits: 'Flexible schedule, earn on your own time',
      benefitsSo: 'Jadwal dabacsan iyo dakhli aad ku kasbato waqtigaaga',
      employerId: employer.id,
      location: 'Minneapolis, MN',
      salaryMin: 30000,
      salaryMax: 60000,
      employmentType: 'Part-time',
      remote: false,
      tags: ['driver', 'flexible', 'part-time'],
      published: true,
    },
    create: {
      id: 'seed-job-rideshare-driver',
      title: 'Rideshare Driver',
      titleSo: 'Darawal Rakaab Wadaag',
      description: 'Flexible schedule driving with Uber/Lyft. Must have valid driver\'s license and clean driving record.',
      descriptionSo: 'Jadwal dabacsan oo lagu wado Uber ama Lyft. Waa in aad haysataa laysan sax ah iyo taariikh wadis oo wanaagsan.',
      requirements: 'Valid driver license, clean record, reliable vehicle',
      requirementsSo: 'Laysan sax ah, taariikh wadis oo wanaagsan, iyo gaari lagu kalsoonaan karo',
      benefits: 'Flexible schedule, earn on your own time',
      benefitsSo: 'Jadwal dabacsan iyo dakhli aad ku kasbato waqtigaaga',
      employerId: employer.id,
      location: 'Minneapolis, MN',
      salaryMin: 30000,
      salaryMax: 60000,
      employmentType: 'Part-time',
      remote: false,
      tags: ['driver', 'flexible', 'part-time'],
      published: true,
    },
  });
  if (!job2.slug) {
    job2 = await prisma.job.update({
      where: { id: job2.id },
      data: { slug: createStableSlug(job2.title, job2.id, 'job') },
    });
  }

  // Create Sample Training
  let training = await prisma.training.upsert({
    where: { id: 'seed-training-customer-service' },
    update: {
      name: 'Customer Service Excellence',
      nameSo: 'Heer-sare Adeegga Macaamiisha',
      providerId: provider.id,
      skillId: skill1.id,
      duration: '4 weeks',
      durationSo: '4 toddobaad',
      cost: 299,
      description: 'Comprehensive training in customer service skills for ZeilaLink workers',
      descriptionSo: 'Tababar dhammaystiran oo ku saabsan xirfadaha adeegga macaamiisha ee shaqaalaha ZeilaLink',
      published: true,
    },
    create: {
      id: 'seed-training-customer-service',
      name: 'Customer Service Excellence',
      nameSo: 'Heer-sare Adeegga Macaamiisha',
      providerId: provider.id,
      skillId: skill1.id,
      duration: '4 weeks',
      durationSo: '4 toddobaad',
      cost: 299,
      description: 'Comprehensive training in customer service skills for ZeilaLink workers',
      descriptionSo: 'Tababar dhammaystiran oo ku saabsan xirfadaha adeegga macaamiisha ee shaqaalaha ZeilaLink',
      published: true,
    },
  });
  if (!training.slug) {
    training = await prisma.training.update({
      where: { id: training.id },
      data: { slug: createStableSlug(training.name, training.id, 'training') },
    });
  }

  const serviceSeeds = [
    {
      id: 's1',
      title: 'Professional Home Cleaning',
      titleSo: 'Nadiifinta Guriga ee Xirfadaysan',
      category: 'Cleaning',
      provider: 'CleanPro Services',
      rating: 4.9,
      reviews: 126,
      priceLabel: '$120',
      image:
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop',
      badge: 'Cleaning',
      description:
        'Keep your home spotless with a structured cleaning service designed for modern households and busy schedules.',
      descriptionSo:
        'Gurigaaga ka dhig mid nadiif ah adigoo adeegsanaya adeeg nadiifin habaysan oo loogu talagalay qoysaska casriga ah iyo jadwalka mashquulka badan.',
      gallery: [
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1563453392212-326f5e854473?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
      ],
      includes: ['Kitchen deep clean', 'Bathroom sanitation', 'Dusting and vacuum', 'Floor mopping'],
      highlights: ['Eco-safe products', 'Trained crew', 'Flexible timing'],
      packageName: 'Basic',
      packageDescription: 'Complete home cleaning package',
      revisions: '2 schedule changes included',
      deliveryTime: 'Same day availability',
      support: '7-day support warranty',
      expertName: 'Amina Yusuf',
      expertRole: 'Cleaning Supervisor',
      expertImage:
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=300&auto=format&fit=crop',
    },
    {
      id: 's2',
      title: 'Custom Web Development',
      titleSo: 'Samaynta Website Gaar ah',
      category: 'IT & Tech',
      provider: 'DevStudio Global',
      rating: 5.0,
      reviews: 95,
      priceLabel: '$2,500',
      image:
        'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1200&auto=format&fit=crop',
      badge: 'IT & Tech',
      description:
        'Build a high-performance website tailored to your brand goals, conversion strategy, and long-term growth.',
      descriptionSo:
        'Dhis website waxqabad sare leh oo waafaqsan yoolalka sumaddaada, qorshaha macaamiil-beddelka, iyo kobaca muddada dheer.',
      gallery: [
        'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1488229297570-58520851e868?q=80&w=1200&auto=format&fit=crop',
      ],
      includes: ['Responsive UI', 'Admin dashboard', 'API integration', 'SEO setup'],
      highlights: ['Modern stack', 'Fast delivery', 'Secure architecture'],
      packageName: 'Professional',
      packageDescription: 'Custom website and dashboard',
      revisions: '3 revisions included',
      deliveryTime: '14 days delivery',
      support: '30-day technical support',
      expertName: 'Abdi Ahmed',
      expertRole: 'Full-Stack Engineer',
      expertImage:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    },
  ];

  for (const service of serviceSeeds) {
    const seededService = await prisma.service.upsert({
      where: { id: service.id },
      update: service,
      create: service,
    });
    if (!seededService.slug) {
      await prisma.service.update({
        where: { id: seededService.id },
        data: {
          slug: createStableSlug(seededService.title, seededService.id, 'service'),
        },
      });
    }
  }

  console.log('Seed data created successfully!');
  console.log({
    admin: admin.email,
    worker: worker.email,
    employee: employee.email,
    employer: employerUser.email,
    provider: providerUser.email,
    jobs: [job1.id, job2.id],
    training: training.id,
    services: serviceSeeds.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
