"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ReviewSession } from "@/components/review/ReviewSession";

export default function ReviewPage() {
  const { user, state, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user || !state) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

  return <ReviewSession />;
}
