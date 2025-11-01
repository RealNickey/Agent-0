"use client";

import dynamic from "next/dynamic";
import { LiveAPIProvider } from "@/contexts/LiveAPIContext";

const ConversationBar = dynamic(
  () =>
    import("@/components/ui/conversation-bar").then(
      (mod) => mod.ConversationBar
    ),
  { ssr: false }
);

export function ConversationBarClient() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Gemini API key not configured</p>
          <p className="text-xs text-muted-foreground">Set REACT_APP_GEMINI_API_KEY in your .env.local file</p>
        </div>
      </div>
    );
  }

  return (
    <LiveAPIProvider
      options={{
        url: process.env.REACT_APP_API_BASE_URL,
        apiKey,
      }}
    >
      <ConversationBar />
    </LiveAPIProvider>
  );
}
