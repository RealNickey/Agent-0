"use client";

import { SignedIn, SignedOut, SignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Landing() {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) router.replace("/dashboard");
  }, [isSignedIn, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-15 text-neutral-80">
      <SignedOut>
        <div className="p-6 rounded-xl bg-neutral-5 border border-neutral-30 shadow-md flex flex-col items-center gap-4">
          <h1 className="text-2xl font-semibold">Sign in to continue</h1>
          <SignIn routing="hash" />
        </div>
      </SignedOut>
      <SignedIn>
        <p>Redirecting to dashboard...</p>
      </SignedIn>
    </div>
  );
}
