/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createContext, FC, ReactNode, useContext, useState, useEffect, useCallback } from "react";
import { useLiveAPI, UseLiveAPIResults } from "../hooks/use-live-api";
import { LiveClientOptions, AgentSession, SessionMessage, SessionContext, MessageType } from "../types";

interface SessionAPI {
  sessionId: string | null;
  session: AgentSession | null;
  isSessionReady: boolean;
  initializeSession: () => Promise<string | null>;
  logMessage: (role: SessionMessage['role'], content: string, type?: MessageType, metadata?: SessionMessage['metadata']) => Promise<void>;
  updateSessionContext: (context: Partial<SessionContext>) => Promise<void>;
  getSessionHistory: () => SessionMessage[];
}

const LiveAPIContext = createContext<
  | (UseLiveAPIResults & {
      toolUIActive: boolean;
      setToolUIActive: (active: boolean) => void;
    } & SessionAPI)
  | undefined
>(undefined);

export type LiveAPIProviderProps = {
  children: ReactNode;
  options: LiveClientOptions;
};

export const LiveAPIProvider: FC<LiveAPIProviderProps> = ({
  options,
  children,
}) => {
  const liveAPI = useLiveAPI(options);
  const [toolUIActive, setToolUIActive] = useState(false);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<AgentSession | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);

  /**
   * Initialize a new session or restore existing one from localStorage
   */
  const initializeSession = useCallback(async (): Promise<string | null> => {
    try {
      // Check for existing session in localStorage
      const storedSessionId = localStorage.getItem('agent0_session_id');
      
      if (storedSessionId) {
        // Try to restore existing session
        const response = await fetch(`/api/session/${storedSessionId}`);
        if (response.ok) {
          const { session: restoredSession } = await response.json();
          setSession(restoredSession);
          setSessionId(storedSessionId);
          setIsSessionReady(true);
          return storedSessionId;
        }
      }

      // Create new session
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const { session: newSession } = await response.json();
      const newSessionId = newSession.sessionId;
      
      localStorage.setItem('agent0_session_id', newSessionId);
      setSessionId(newSessionId);
      setSession(newSession);
      setIsSessionReady(true);
      
      return newSessionId;
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setIsSessionReady(false);
      return null;
    }
  }, []);

  /**
   * Log a message to the current session
   */
  const logMessage = useCallback(async (
    role: SessionMessage['role'],
    content: string,
    type: MessageType = 'text',
    metadata?: SessionMessage['metadata']
  ) => {
    if (!sessionId) {
      console.warn('No active session, skipping message log');
      return;
    }

    try {
      const response = await fetch('/api/session/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          role,
          content,
          type,
          metadata,
        }),
      });

      if (response.ok) {
        // Refresh session data
        const sessionResponse = await fetch(`/api/session/${sessionId}`);
        if (sessionResponse.ok) {
          const { session: updatedSession } = await sessionResponse.json();
          setSession(updatedSession);
        }
      }
    } catch (error) {
      console.error('Failed to log message:', error);
    }
  }, [sessionId]);

  /**
   * Update session context
   */
  const updateSessionContext = useCallback(async (context: Partial<SessionContext>) => {
    if (!sessionId) {
      console.warn('No active session, skipping context update');
      return;
    }

    try {
      const response = await fetch('/api/session/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          context,
        }),
      });

      if (response.ok) {
        // Refresh session data
        const sessionResponse = await fetch(`/api/session/${sessionId}`);
        if (sessionResponse.ok) {
          const { session: updatedSession } = await sessionResponse.json();
          setSession(updatedSession);
        }
      }
    } catch (error) {
      console.error('Failed to update context:', error);
    }
  }, [sessionId]);

  /**
   * Get session message history
   */
  const getSessionHistory = useCallback((): SessionMessage[] => {
    return session?.messages || [];
  }, [session]);

  // Auto-initialize session on mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  const contextValue = {
    ...liveAPI,
    toolUIActive,
    setToolUIActive,
    sessionId,
    session,
    isSessionReady,
    initializeSession,
    logMessage,
    updateSessionContext,
    getSessionHistory,
  };

  return (
    <LiveAPIContext.Provider value={contextValue}>
      {children}
    </LiveAPIContext.Provider>
  );
};

export const useLiveAPIContext = () => {
  const context = useContext(LiveAPIContext);
  if (!context) {
    throw new Error("useLiveAPIContext must be used wihin a LiveAPIProvider");
  }
  return context;
};
