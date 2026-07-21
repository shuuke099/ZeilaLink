"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Clock3, Home, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

type OrganizationApprovalGuardProps = {
  children: ReactNode;
  expectedRole: "employer" | "provider";
};

export default function OrganizationApprovalGuard({
  children,
  expectedRole,
}: OrganizationApprovalGuardProps) {
  const { user, loading, logout } = useAuth();
  const { language } = useLanguage();
  const isEn = language === "en";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!user || user.role !== expectedRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">
            {isEn ? "Sign in required" : "Galitaan ayaa loo baahan yahay"}
          </h1>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground"
          >
            {isEn ? "Go to login" : "Tag galitaanka"}
          </Link>
        </div>
      </div>
    );
  }

  if (user.organizationApproved !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Clock3 size={28} aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-foreground">
            {isEn ? "Admin approval pending" : "Oggolaanshaha maamulka ayaa la sugayaa"}
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            {isEn
              ? "Your email is verified. An administrator must approve your organization profile before you can access this dashboard."
              : "Email-kaaga waa la xaqiijiyay. Maamule ayaa marka hore ansixinaya xogta ururkaaga ka hor intaadan gelin dashboard-ka."}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-5 font-semibold text-foreground hover:bg-muted"
            >
              <Home size={18} aria-hidden="true" />
              {isEn ? "Back to home" : "Ku laabo bogga hore"}
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <LogOut size={18} aria-hidden="true" />
              {isEn ? "Sign out" : "Ka bax"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
