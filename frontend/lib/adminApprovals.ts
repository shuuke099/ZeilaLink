import api from '@/lib/api';

export type OrganizationApproval = {
  id: string;
  type: 'employer' | 'provider';
  name: string;
  verified: boolean;
  identity: Record<string, string | null>;
};

export type ApprovableAdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified?: boolean;
  organizationApproved?: boolean;
  organization?: OrganizationApproval | null;
};

export const canApproveOrganization = (
  user: ApprovableAdminUser,
): user is ApprovableAdminUser & { organization: OrganizationApproval } =>
  user.isVerified === true &&
  Boolean(user.organization) &&
  user.organization?.verified === false;

export const approveOrganization = async (
  organization: OrganizationApproval,
): Promise<void> => {
  await api.post(`/admin/verify-${organization.type}/${organization.id}`, {
    identity: organization.identity,
  });
};
