"use client";

import { RiSparklingLine } from "react-icons/ri";
import { useUsage, hasValidClerkKey } from "../../contexts/UsageContext";
import cn from "classnames";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiLogoutBoxRLine, RiUserSettingsLine } from "react-icons/ri";
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
