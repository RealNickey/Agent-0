"use client";

import { useUsage } from "../../contexts/UsageContext";
import { hasValidClerkKey } from "../../lib/clerk-config";
import dynamic from "next/dynamic";

// Only load Clerk-dependent component when Clerk is configured
const AccountWidgetWithClerk = hasValidClerkKey
  ? dynamic(() => import("./account-widget-clerk").then(mod => mod.AccountWidgetWithClerk), { ssr: false })
  : () => null;

export function AccountWidget() {
  const { clerkAvailable } = useUsage();

  // If Clerk is not available, don't show the widget at all
  if (!clerkAvailable) {
    return null;
  }

  return <AccountWidgetWithClerk />;
}
