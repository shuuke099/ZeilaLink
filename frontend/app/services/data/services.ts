export type ServiceItem = {
  id: string;
  title: string;
  category: string;
  provider: string;
  rating: number;
  reviews: number;
  priceLabel: string;
  image: string;
  badge: string;
  description: string;
  gallery: string[];
  includes: string[];
  highlights: string[];
  packageName: string;
  packageDescription: string;
  revisions: string;
  deliveryTime: string;
  support: string;
  expertName: string;
  expertRole: string;
  expertImage: string;
  /** True only for bundled preview content, never for an API-backed listing. */
  isDemo?: boolean;
};

export const serviceCategories = [
  'All Services',
  'Cleaning',
  'IT & Tech',
  'Construction',
  'Marketing',
  'Cleaning & Maintenance',
  'Electronic & Mechanical Repair',
  'Design & Coding',
  'Other',
];

const sampleServices: ServiceItem[] = [
  {
    id: 's1',
    title: 'Professional Home Cleaning',
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
  {
    id: 's3',
    title: 'Modern Home Remodeling',
    category: 'Construction',
    provider: 'Urban Structure',
    rating: 4.8,
    reviews: 188,
    priceLabel: '$15,000',
    image:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200&auto=format&fit=crop',
    badge: 'Construction',
    description:
      'Transform living spaces with practical design, quality materials, and end-to-end project management.',
    gallery: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop',
    ],
    includes: ['Site assessment', 'Material planning', 'Execution team', 'Final finishing'],
    highlights: ['Licensed crew', 'Transparent timeline', 'Quality guarantee'],
    packageName: 'Enterprise',
    packageDescription: 'End-to-end remodeling package',
    revisions: '2 design revisions',
    deliveryTime: '4-8 weeks timeline',
    support: 'Post-project inspection support',
    expertName: 'Mohamed Ali',
    expertRole: 'Project Architect',
    expertImage:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 's4',
    title: 'Growth Marketing Strategy',
    category: 'Marketing',
    provider: 'Marketly Agency',
    rating: 4.7,
    reviews: 289,
    priceLabel: '$800',
    image:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
    badge: 'Marketing',
    description:
      'Get a measurable marketing roadmap focused on acquisition, retention, and profitable growth channels.',
    gallery: [
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1200&auto=format&fit=crop',
    ],
    includes: ['Channel audit', 'Campaign strategy', 'KPI framework', 'Execution playbook'],
    highlights: ['Data-first planning', 'Audience targeting', 'ROI focused'],
    packageName: 'Basic',
    packageDescription: 'Marketing strategy starter package',
    revisions: '2 revisions included',
    deliveryTime: '7 days delivery',
    support: '14-day follow-up support',
    expertName: 'Hodan Warsame',
    expertRole: 'Growth Strategist',
    expertImage:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 's5',
    title: 'UI/UX Product Design',
    category: 'IT & Tech',
    provider: 'PixelCraft Studio',
    rating: 4.9,
    reviews: 122,
    priceLabel: '$1,200',
    image:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop',
    badge: 'IT & Tech',
    description:
      'Create elegant product experiences with user research, interface design, and conversion-centered UX flows.',
    gallery: [
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1559028012-481c04fa702d?q=80&w=1200&auto=format&fit=crop',
    ],
    includes: ['User flow map', 'Wireframes', 'High-fidelity UI', 'Prototype handoff'],
    highlights: ['Research-backed design', 'Accessible UI', 'Fast iteration'],
    packageName: 'Professional',
    packageDescription: 'Complete UX and UI package',
    revisions: '4 revisions included',
    deliveryTime: '10 days delivery',
    support: 'Design handoff support',
    expertName: 'Nimo Hassan',
    expertRole: 'Senior Product Designer',
    expertImage:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 's6',
    title: 'Deep Office Sanitization',
    category: 'Cleaning',
    provider: 'Sanitize Pro Group',
    rating: 4.6,
    reviews: 212,
    priceLabel: '$450',
    image:
      'https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=1200&auto=format&fit=crop',
    badge: 'Cleaning',
    description:
      'Professional sanitization for offices, clinics, and retail spaces using industry-grade cleaning protocols.',
    gallery: [
      'https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1603712725038-e9334ae8f39f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581579188871-45ea61f2a28a?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=1200&auto=format&fit=crop',
    ],
    includes: ['Surface disinfection', 'Equipment cleaning', 'Air-touchpoint sanitation', 'Waste-safe disposal'],
    highlights: ['Certified chemicals', 'Rapid turnaround', 'Compliance-ready'],
    packageName: 'Basic',
    packageDescription: 'Office sanitization package',
    revisions: '1 revisit included',
    deliveryTime: 'Within 24 hours',
    support: '48-hour quality guarantee',
    expertName: 'Fatima Noor',
    expertRole: 'Sanitation Lead',
    expertImage:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=300&auto=format&fit=crop',
  },
];

export const services: ServiceItem[] = sampleServices.map((service) => ({
  ...service,
  isDemo: true,
}));

export const getServiceById = (id: string) => services.find((service) => service.id === id);
