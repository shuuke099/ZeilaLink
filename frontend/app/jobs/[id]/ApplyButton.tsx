"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface ApplyButtonProps {
  jobId: string;
}

export default function ApplyButton({ jobId }: ApplyButtonProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleApplyClick = () => {
    const applyPath = `/jobs/${encodeURIComponent(jobId)}/apply`;

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(applyPath)}`);
      return;
    }

    router.push(applyPath);
  };

  return (
    <button
      type="button"
      onClick={handleApplyClick}
      disabled={loading}
      className="btn-primary rounded-xl px-6 py-3 text-sm font-black uppercase tracking-wider disabled:cursor-wait disabled:opacity-60"
    >
      Apply Now
    </button>
  );
}
