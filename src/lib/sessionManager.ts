/**
 * Session Manager for Agent-0
 * 
 * Handles all session CRUD operations with Redis persistence.
 * Includes automatic message history limiting and TTL management.
 */

import { v4 as uuidv4 } from 'uuid';
import { getRedisClient, withRedisRetry, isRedisConfigured } from './redis';
import type {
  AgentSession,
  SessionMessage,
  SessionCreateOptions,
  SessionUpdateOptions,
  SessionContext,
  SessionPreferences,
} from '../types';

// Session configuration constants
const SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds
const MAX_MESSAGES_PER_SESSION = 20;
const SESSION_KEY_PREFIX = 'agent0:session:';

/**
 * In-memory fallback storage for when Redis is unavailable
 */
const memoryStore = new Map<string, AgentSession>();

/**
 * Create a new session
 */
export async function createSession(
  options: SessionCreateOptions = {}
): Promise<AgentSession> {
  const sessionId = uuidv4();
  const conversationId = options.conversationId || uuidv4();
  const now = Date.now();

  const session: AgentSession = {
    sessionId,
    userId: options.userId,
    conversationId,
    createdAt: now,
    lastActivityAt: now,
    messages: [],
    context: {},
    preferences: options.preferences || {},
    metadata: {},
  };

  if (isRedisConfigured()) {
    try {
      const redis = getRedisClient();
      await redis.setex(
        `${SESSION_KEY_PREFIX}${sessionId}`,
        SESSION_TTL,
        JSON.stringify(session)
      );
    } catch (error) {
      console.error('Failed to save session to Redis, using memory fallback:', error);
      memoryStore.set(sessionId, session);
    }
  } else {
    // Fallback to memory storage
    memoryStore.set(sessionId, session);
  }

  return session;
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<AgentSession | null> {
  // Try Redis first
  if (isRedisConfigured()) {
    const result = await withRedisRetry(async () => {
      const redis = getRedisClient();
      const data = await redis.get<string>(`${SESSION_KEY_PREFIX}${sessionId}`);
      if (!data) return null;
      return typeof data === 'string' ? JSON.parse(data) : data;
    });

    if (result) {
      return result as AgentSession;
    }
  }

  // Fallback to memory store
  return memoryStore.get(sessionId) || null;
}

/**
 * Update session with new data
 */
export async function updateSession(
  sessionId: string,
  updates: SessionUpdateOptions
): Promise<AgentSession | null> {
  const session = await getSession(sessionId);
  if (!session) {
    return null;
  }

  const updatedSession: AgentSession = {
    ...session,
    lastActivityAt: Date.now(),
    context: updates.context 
      ? { ...session.context, ...updates.context }
      : session.context,
    preferences: updates.preferences
      ? { ...session.preferences, ...updates.preferences }
      : session.preferences,
    metadata: updates.metadata
      ? { ...session.metadata, ...updates.metadata }
      : session.metadata,
  };

  if (isRedisConfigured()) {
    await withRedisRetry(async () => {
      const redis = getRedisClient();
      await redis.setex(
        `${SESSION_KEY_PREFIX}${sessionId}`,
        SESSION_TTL,
        JSON.stringify(updatedSession)
      );
    });
  } else {
    memoryStore.set(sessionId, updatedSession);
  }

  return updatedSession;
}

/**
 * Add a message to the session
 * Automatically limits message history to MAX_MESSAGES_PER_SESSION
 */
export async function addMessage(
  sessionId: string,
  message: Omit<SessionMessage, 'timestamp'>
): Promise<AgentSession | null> {
  const session = await getSession(sessionId);
  if (!session) {
    return null;
  }

  const newMessage: SessionMessage = {
    ...message,
    timestamp: Date.now(),
  };

  // Limit message history
  const messages = [...session.messages, newMessage];
  if (messages.length > MAX_MESSAGES_PER_SESSION) {
    // Keep the most recent messages
    messages.splice(0, messages.length - MAX_MESSAGES_PER_SESSION);
  }

  const updatedSession: AgentSession = {
    ...session,
    messages,
    lastActivityAt: Date.now(),
  };

  if (isRedisConfigured()) {
    await withRedisRetry(async () => {
      const redis = getRedisClient();
      await redis.setex(
        `${SESSION_KEY_PREFIX}${sessionId}`,
        SESSION_TTL,
        JSON.stringify(updatedSession)
      );
    });
  } else {
    memoryStore.set(sessionId, updatedSession);
  }

  return updatedSession;
}

/**
 * Update session context
 */
export async function updateContext(
  sessionId: string,
  context: Partial<SessionContext>
): Promise<AgentSession | null> {
  return updateSession(sessionId, { context });
}

/**
 * Update session preferences
 */
export async function updatePreferences(
  sessionId: string,
  preferences: Partial<SessionPreferences>
): Promise<AgentSession | null> {
  return updateSession(sessionId, { preferences });
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  if (isRedisConfigured()) {
    const result = await withRedisRetry(async () => {
      const redis = getRedisClient();
      return await redis.del(`${SESSION_KEY_PREFIX}${sessionId}`);
    });

    if (result) {
      return result > 0;
    }
  }

  // Fallback to memory store
  return memoryStore.delete(sessionId);
}

/**
 * Get all sessions for a user (limited for performance)
 */
export async function getUserSessions(
  userId: string,
  limit: number = 10
): Promise<AgentSession[]> {
  if (!isRedisConfigured()) {
    // Memory store fallback
    const sessions = Array.from(memoryStore.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
      .slice(0, limit);
    return sessions;
  }

  // For Redis, we'd need to maintain a user index
  // Simplified implementation: scan with pattern (not ideal for large scale)
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(`${SESSION_KEY_PREFIX}*`);
    
    const sessions: AgentSession[] = [];
    for (const key of keys.slice(0, 100)) { // Limit scan
      const data = await redis.get<string>(key);
      if (data) {
        const session = typeof data === 'string' ? JSON.parse(data) : data;
        if (session.userId === userId) {
          sessions.push(session);
        }
      }
      if (sessions.length >= limit) break;
    }

    return sessions.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  } catch (error) {
    console.error('Failed to get user sessions:', error);
    return [];
  }
}

/**
 * Extend session TTL (useful for active sessions)
 */
export async function extendSessionTTL(sessionId: string): Promise<boolean> {
  if (!isRedisConfigured()) {
    return true; // Memory sessions don't expire
  }

  const result = await withRedisRetry(async () => {
    const redis = getRedisClient();
    return await redis.expire(`${SESSION_KEY_PREFIX}${sessionId}`, SESSION_TTL);
  });

  return result === 1;
}

/**
 * Get session statistics
 */
export async function getSessionStats(sessionId: string): Promise<{
  messageCount: number;
  ageInHours: number;
  lastActivityMinutesAgo: number;
} | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  const now = Date.now();
  return {
    messageCount: session.messages.length,
    ageInHours: (now - session.createdAt) / (1000 * 60 * 60),
    lastActivityMinutesAgo: (now - session.lastActivityAt) / (1000 * 60),
  };
}

/**
 * Clear all sessions (useful for testing)
 */
export async function clearAllSessions(): Promise<number> {
  if (isRedisConfigured()) {
    try {
      const redis = getRedisClient();
      const keys = await redis.keys(`${SESSION_KEY_PREFIX}*`);
      if (keys.length === 0) return 0;
      
      const deleted = await redis.del(...keys);
      return deleted;
    } catch (error) {
      console.error('Failed to clear Redis sessions:', error);
    }
  }

  const count = memoryStore.size;
  memoryStore.clear();
  return count;
}
