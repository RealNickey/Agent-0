"use client";

import { ClerkProvider } from "@clerk/nextjs";
import React from "react";
import { UsageProvider } from "../src/contexts/UsageContext";
import { UsageProviderWithClerk } from "../src/contexts/UsageContextWithClerk";
import { hasValidClerkKey } from "../src/lib/clerk-config";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Conditionally wrap with ClerkProvider and use appropriate UsageProvider
  if (hasValidClerkKey) {
    return (
      <ClerkProvider>
        <UsageProviderWithClerk>
          {children}
        </UsageProviderWithClerk>
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
