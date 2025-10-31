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

  // Track user messages via content events from the client
  useEffect(() => {
    const handleContent = (event: any) => {
      // Only track user turns (not model responses)
      if (event?.turn === "user" && isAnonymous) {
        trackMessage();
      }
    };

    liveAPI.client.on("content", handleContent);
    
    return () => {
      liveAPI.client.off("content", handleContent);
    };
  }, [liveAPI.client, trackMessage, isAnonymous]);

  // Wrap the original client.send to check usage before sending
  const originalSend = useCallback(liveAPI.client.send.bind(liveAPI.client), [liveAPI.client]);
  
  useEffect(() => {
    // Create a wrapper function
    const wrappedSend = (message: any) => {
      if (isAnonymous && !canSendMessage) {
        setShowLoginPrompt(true);
        return Promise.reject(new Error("Usage limit reached. Please sign in to continue."));
      }
      return originalSend(message);
    };

    // Override the send method
    liveAPI.client.send = wrappedSend as any;
  }, [liveAPI.client, originalSend, canSendMessage, isAnonymous, setShowLoginPrompt]);

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
