import type { ReactNode } from "react";
import OrganizationApprovalGuard from "@/components/auth/OrganizationApprovalGuard";

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return (
    <OrganizationApprovalGuard expectedRole="employer">
      {children}
    </OrganizationApprovalGuard>
  );
}
