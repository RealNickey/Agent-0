"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import React from "react";
import { UsageProvider } from "../src/contexts/UsageContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <UsageProvider>
        {children}
      </UsageProvider>
    </ClerkProvider>
  );
}
