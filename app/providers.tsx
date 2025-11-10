"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import React from "react";
import { UsageProvider } from "../src/contexts/UsageContext";

// Check if Clerk is properly configured
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasValidClerkKey = publishableKey && publishableKey.startsWith('pk_');

export default function Providers({ children }: { children: React.ReactNode }) {
  // When Clerk is configured, use both providers
  if (hasValidClerkKey) {
    return (
      <ClerkProvider>
        <UsageProvider>
          {children}
        </UsageProvider>
      </ClerkProvider>
    );
  }

  // When Clerk is not configured, skip both Clerk and Usage tracking
  return <>{children}</>;
}

