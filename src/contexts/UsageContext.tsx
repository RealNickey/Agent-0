/**
 * Usage Context
 * 
 * Provides usage tracking and limit enforcement for anonymous users.
 * Authenticated users have unlimited access.
 * 
 * When Clerk is not configured, this context still works but treats all users as anonymous.
 */

import { createContext, FC, ReactNode, useContext, useEffect, useState } from "react";
import {
  getUsageData,
  incrementMessageCount,
  hasReachedLimit,
  getRemainingMessages,
  resetUsageData,
  getMessageLimit,
  getUsagePercentage,
} from "../lib/usage-tracker";

// Check if Clerk is properly configured at module level
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
export const hasValidClerkKey = typeof publishableKey === 'string' && publishableKey.startsWith('pk_');

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
  clerkAvailable: boolean;
}

const UsageContext = createContext<UsageContextValue | undefined>(undefined);

export interface UsageProviderProps {
  children: ReactNode;
}

// Provider that works without Clerk authentication
export const UsageProvider: FC<UsageProviderProps> = ({ children }) => {
  const [messageCount, setMessageCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Without Clerk integration in this provider, user is always anonymous
  const isAnonymous = true;

  // Load initial usage data
  useEffect(() => {
    const data = getUsageData();
    setMessageCount(data.messageCount);
  }, []);

  // Calculate derived values
  const remainingMessages = getRemainingMessages();
  const messageLimit = getMessageLimit();
  const usagePercentage = getUsagePercentage();
  const limitReached = hasReachedLimit();
  const canSendMessage = !limitReached;

  const trackMessage = (): boolean => {
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
    clerkAvailable: hasValidClerkKey,
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
    // Return safe defaults when used outside provider (e.g., during SSR/build)
    return {
      messageCount: 0,
      remainingMessages: Infinity,
      messageLimit: 10,
      usagePercentage: 0,
      hasReachedLimit: false,
      isAnonymous: true,
      canSendMessage: true,
      trackMessage: () => true,
      showLoginPrompt: false,
      setShowLoginPrompt: () => {},
      resetUsage: () => {},
      clerkAvailable: false,
    };
  }
  return context;
};
