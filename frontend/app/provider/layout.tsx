import type { ReactNode } from "react";
import OrganizationApprovalGuard from "@/components/auth/OrganizationApprovalGuard";

export default function ProviderLayout({ children }: { children: ReactNode }) {
  return (
    <OrganizationApprovalGuard expectedRole="provider">
      {children}
    </OrganizationApprovalGuard>
  );
}
