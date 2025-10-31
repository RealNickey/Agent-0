"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Landing() {
  const router = useRouter();

  useEffect(() => {
    // Redirect all users (authenticated or not) to dashboard
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-15 text-neutral-80">
      <p>Loading...</p>
    </div>
  );
}
