/**
 * Usage Tracker
 * 
 * Tracks anonymous user usage via local storage.
 * Authenticated users have unlimited usage.
 */

const STORAGE_KEY = "agent0_anonymous_usage";
const ANONYMOUS_MESSAGE_LIMIT = 10;

export interface UsageData {
  messageCount: number;
  lastReset: string; // ISO timestamp
  sessionId: string;
}

/**
 * Generate a unique session ID for anonymous users
 */
function generateSessionId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get current usage data from local storage
 */
export function getUsageData(): UsageData {
  if (typeof window === "undefined") {
    return {
      messageCount: 0,
      lastReset: new Date().toISOString(),
      sessionId: generateSessionId(),
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const newData: UsageData = {
        messageCount: 0,
        lastReset: new Date().toISOString(),
        sessionId: generateSessionId(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error reading usage data:", error);
    return {
      messageCount: 0,
      lastReset: new Date().toISOString(),
      sessionId: generateSessionId(),
    };
  }
}

/**
 * Save usage data to local storage
 */
export function saveUsageData(data: UsageData): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving usage data:", error);
  }
}

/**
 * Increment message count for anonymous users
 * Returns new count
 */
export function incrementMessageCount(): number {
  const data = getUsageData();
  data.messageCount += 1;
  saveUsageData(data);
  return data.messageCount;
}

/**
 * Check if anonymous user has reached usage limit
 */
export function hasReachedLimit(): boolean {
  const data = getUsageData();
  return data.messageCount >= ANONYMOUS_MESSAGE_LIMIT;
}

/**
 * Get remaining messages for anonymous users
 */
export function getRemainingMessages(): number {
  const data = getUsageData();
  const remaining = ANONYMOUS_MESSAGE_LIMIT - data.messageCount;
  return Math.max(0, remaining);
}

/**
 * Reset usage data (called after successful login)
 */
export function resetUsageData(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error resetting usage data:", error);
  }
}

/**
 * Get the message limit for display purposes
 */
export function getMessageLimit(): number {
  return ANONYMOUS_MESSAGE_LIMIT;
}

/**
 * Get usage percentage (0-100)
 */
export function getUsagePercentage(): number {
  const data = getUsageData();
  return Math.min(100, (data.messageCount / ANONYMOUS_MESSAGE_LIMIT) * 100);
}
