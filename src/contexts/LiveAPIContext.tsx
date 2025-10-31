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
import { LiveClientOptions } from "../types";
import { useUsage } from "./UsageContext";
import LoginPromptModal from "../components/login-prompt/LoginPromptModal";

const LiveAPIContext = createContext<
  | (UseLiveAPIResults & {
      toolUIActive: boolean;
      setToolUIActive: (active: boolean) => void;
      canSendMessage: boolean;
    })
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
  
  // Usage tracking
  const {
    trackMessage,
    canSendMessage,
    showLoginPrompt,
    setShowLoginPrompt,
    remainingMessages,
    messageLimit,
    isAnonymous,
  } = useUsage();

  // Track user messages by intercepting send calls
  // We'll create a proxy for the send method that tracks usage
  useEffect(() => {
    const client = liveAPI.client;
    const originalSend = client.send.bind(client);
    
    // Create a wrapper that checks usage limits before sending
    const wrappedSend = (parts: any, turnComplete: boolean = true) => {
      // Check if this is a user-initiated message (not a health check or system message)
      // Health checks and system messages typically use session.sendClientContent directly
      if (isAnonymous && !canSendMessage) {
        setShowLoginPrompt(true);
        throw new Error("Usage limit reached. Please sign in to continue.");
      }
      
      // Track the message for anonymous users
      if (isAnonymous) {
        trackMessage();
      }
      
      // Call the original send method with proper signature
      return originalSend(parts, turnComplete);
    };

    // Replace the send method
    client.send = wrappedSend;
    
    // Cleanup: restore original send method
    return () => {
      client.send = originalSend;
    };
  }, [liveAPI.client, canSendMessage, isAnonymous, setShowLoginPrompt, trackMessage]);

  return (
    <LiveAPIContext.Provider
      value={{ ...liveAPI, toolUIActive, setToolUIActive, canSendMessage }}
    >
      {children}
      <LoginPromptModal
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        remainingMessages={remainingMessages}
        messageLimit={messageLimit}
      />
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
