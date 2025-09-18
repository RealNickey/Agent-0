"use client";

import { ClerkProvider } from "@clerk/nextjs";
import React from "react";
import { ToolCallUIProvider } from "../src/contexts/ToolCallUIContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ToolCallUIProvider>{children}</ToolCallUIProvider>
    </ClerkProvider>
  );
}
