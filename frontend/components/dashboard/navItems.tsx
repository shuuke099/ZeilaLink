'use client';

import type { ComponentProps } from 'react';
import {
  BarChart3,
  Briefcase,
  CalendarCheck2,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  Lightbulb,
  Settings,
  User,
  Users,
  Warehouse
} from 'lucide-react';
import type { DashboardNavItem } from './DashboardShell';

const Building = (props: ComponentProps<'svg'>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M4 21h16M6 21V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v17M6 8h8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 8v13M10 12h1M10 16h1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusIcon = (props: ComponentProps<'svg'>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const workerNavItems: DashboardNavItem[] = [
  { label: 'Dashboard Overview', href: '/worker', icon: Home },
  { label: 'My Profile', href: '/worker/profile', icon: User },
  { label: 'My Applications', href: '/worker/applications', icon: FileText },
  { label: 'Recommended Jobs', href: '/worker/recommended', icon: Lightbulb },
  { label: 'Settings', href: '/worker/settings', icon: Settings },
];

export const employerNavItems: DashboardNavItem[] = [
  { label: 'Dashboard Overview', href: '/employer', icon: Home },
  { label: 'Post a Job', href: '/employer/post-job', icon: Briefcase },
  { label: 'My Job Posts', href: '/employer/jobs', icon: ClipboardList },
  { label: 'View Applicants', href: '/employer/applicants', icon: Users },
  { label: 'Company Profile', href: '/employer/company', icon: Building },
  { label: 'Settings', href: '/employer/settings', icon: Settings },
];

export const adminNavItems: DashboardNavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: Home },
  { label: 'User Management', href: '/admin/users', icon: Warehouse },
  { label: 'Jobs', href: '/admin/jobs', icon: Briefcase },
  { label: 'Services', href: '/admin/services', icon: ClipboardList },
  { label: 'Service Bookings', href: '/admin/service-bookings', icon: CalendarCheck2 },
  { label: 'Trainings', href: '/admin/providers', icon: FileText },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export const providerNavItems: DashboardNavItem[] = [
  { label: 'Dashboard Overview', href: '/provider', icon: Home },
  { label: 'Add Training Program', href: '/provider/programs/new', icon: PlusIcon },
  { label: 'My Courses', href: '/provider/courses', icon: GraduationCap },
  { label: 'Enrolled Students', href: '/provider/students', icon: Users },
  { label: 'Settings', href: '/provider/settings', icon: Settings },
];

