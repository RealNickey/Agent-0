"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import React from "react";
import { UsageProvider } from "../src/contexts/UsageContext";

// Check if Clerk is properly configured
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasValidClerkKey = publishableKey && publishableKey.startsWith('pk_');

export default function Providers({ children }: { children: React.ReactNode }) {
  const content = (
    <UsageProvider>
      {children}
    </UsageProvider>
  );

  if (hasValidClerkKey) {
    return (
      <ClerkProvider>
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
