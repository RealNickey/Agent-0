"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import React from "react";
import { UsageProvider } from "../src/contexts/UsageContext";

// Only use Clerk if properly configured
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasValidClerkKey = publishableKey && publishableKey.startsWith('pk_');

export default function Providers({ children }: { children: React.ReactNode }) {
  // Conditionally wrap with ClerkProvider only if Clerk is configured
  if (hasValidClerkKey) {
    return (
      <ClerkProvider>
        <UsageProvider>
          {children}
        </UsageProvider>
      </ClerkProvider>
    );
  }

  // Fallback: no Clerk authentication
  return (
    <UsageProvider>
      {children}
    </UsageProvider>
  );
}
