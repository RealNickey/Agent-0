/**
 * Usage Context
 * 
 * Provides usage tracking and limit enforcement for anonymous users.
 * Authenticated users have unlimited access.
 */

import { createContext, FC, ReactNode, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  getUsageData,
  incrementMessageCount,
  hasReachedLimit,
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
  trackMessage: () => boolean; // Returns false if limit reached
  showLoginPrompt: boolean;
  setShowLoginPrompt: (show: boolean) => void;
  resetUsage: () => void;
}

const UsageContext = createContext<UsageContextValue | undefined>(undefined);

export interface UsageProviderProps {
  children: ReactNode;
}

export const UsageProvider: FC<UsageProviderProps> = ({ children }) => {
  const { isSignedIn, user } = useUser();
  const [messageCount, setMessageCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Check if user is anonymous
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
  const limitReached = isAnonymous && hasReachedLimit();
  const canSendMessage = !limitReached;

  /**
   * Track a message sent by the user
   * Returns false if the limit has been reached
   */
  const trackMessage = (): boolean => {
    // Authenticated users have unlimited access
    if (!isAnonymous) {
      return true;
    }

    // Check if already at limit
    if (limitReached) {
      setShowLoginPrompt(true);
      return false;
    }

    // Increment count
    const newCount = incrementMessageCount();
    setMessageCount(newCount);

    // Check if we just hit the limit
    if (newCount >= messageLimit) {
      setShowLoginPrompt(true);
      return false;
    }

    return true;
  };

  /**
   * Reset usage data (typically called after login)
   */
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
  };

  return (
    <UsageContext.Provider value={value}>
      {children}
    </UsageContext.Provider>
  );
};

export const useUsage = () => {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error("useUsage must be used within a UsageProvider");
  }
  return context;
};
