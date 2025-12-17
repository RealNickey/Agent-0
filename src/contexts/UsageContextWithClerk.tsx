"use client";

/**
 * Usage Context with Clerk Integration
 * 
 * Provides usage tracking with Clerk authentication.
 * Authenticated users have unlimited access.
 * 
 * This provider should only be used when Clerk is properly configured.
 */

import { createContext, FC, ReactNode, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  getUsageData,
  incrementMessageCount,
  hasReachedLimit as hasReachedLimitFn,
  getRemainingMessages,
  resetUsageData,
  getMessageLimit,
  getUsagePercentage,
} from "../lib/usage-tracker";

interface UsageContextValue {
  messageCount: number;
  remainingMessages: number;
  messageLimit: number;
  usagePercentage: number;
  hasReachedLimit: boolean;
  isAnonymous: boolean;
  canSendMessage: boolean;
  trackMessage: () => boolean;
  showLoginPrompt: boolean;
  setShowLoginPrompt: (show: boolean) => void;
  resetUsage: () => void;
  clerkAvailable: boolean;
}

const UsageContext = createContext<UsageContextValue | undefined>(undefined);

export interface UsageProviderProps {
  children: ReactNode;
}

// Provider that uses Clerk for authentication
export const UsageProviderWithClerk: FC<UsageProviderProps> = ({ children }) => {
  const { isSignedIn } = useUser();
  const [messageCount, setMessageCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // User is anonymous if not signed in
  const isAnonymous = !isSignedIn;

  // Load initial usage data
  useEffect(() => {
    if (isAnonymous) {
      const data = getUsageData();
      setMessageCount(data.messageCount);
    } else {
      // Authenticated users: reset any stored anonymous usage
      resetUsageData();
      setMessageCount(0);
    }
  }, [isAnonymous]);

  // Calculate derived values
  const remainingMessages = isAnonymous ? getRemainingMessages() : Infinity;
  const messageLimit = getMessageLimit();
  const usagePercentage = isAnonymous ? getUsagePercentage() : 0;
  const limitReached = isAnonymous && hasReachedLimitFn();
  const canSendMessage = !limitReached;

  const trackMessage = (): boolean => {
    // Authenticated users have unlimited access
    if (!isAnonymous) {
      return true;
    }

    if (limitReached) {
      setShowLoginPrompt(true);
      return false;
    }
    const newCount = incrementMessageCount();
    setMessageCount(newCount);
    if (newCount >= messageLimit) {
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  const resetUsage = () => {
    resetUsageData();
    setMessageCount(0);
    setShowLoginPrompt(false);
  };

  const value: UsageContextValue = {
    messageCount,
    remainingMessages,
    messageLimit,
    usagePercentage,
    hasReachedLimit: limitReached,
    isAnonymous,
    canSendMessage,
    trackMessage,
    showLoginPrompt,
    setShowLoginPrompt,
    resetUsage,
    clerkAvailable: true,
  };

  return (
    <UsageContext.Provider value={value}>
      {children}
    </UsageContext.Provider>
  );
};

export const useUsageWithClerk = () => {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error("useUsageWithClerk must be used within a UsageProviderWithClerk");
  }
  return context;
};
