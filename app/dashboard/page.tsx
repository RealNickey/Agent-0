"use client";

import dynamic from "next/dynamic";
import cn from "classnames";
import { useRef, useState } from "react";
import { LiveClientOptions } from "../../src/types";
import { Toaster } from "../../src/components/ui/sonner";
const VoiceOrb = dynamic(() => import("../../src/components/ui/voiceOrb"), {
  ssr: false,
});
import SettingsDialog from "../../src/components/settings-dialog/SettingsDialog";
import { motion, AnimatePresence } from "framer-motion";

const LiveAPIProvider = dynamic(
  () =>
    import("../../src/contexts/LiveAPIContext").then((mod) => ({
      default: mod.LiveAPIProvider,
    })),
  { ssr: false }
);

const UnifiedAssistant = dynamic(() => import("../../src/tools/tmdb"), {
  ssr: false,
});
const ConversationBar = dynamic(
  () =>
    import("../../src/components/ui/conversation-bar").then((mod) => ({
      default: mod.ConversationBar,
    })),
  { ssr: false }
);
import { AccountWidget } from "../../src/components/ui/account-widget";
import { useLiveAPIContext } from "../../src/contexts/LiveAPIContext";

// Main content area component that can access context
const MainContentArea = () => {
  const { toolUIActive } = useLiveAPIContext();

  return (
    <div className="main-app-area flex flex-1 items-center justify-center w-full relative">
      {/* Unified assistant renders movies & charts */}
      <UnifiedAssistant />
    </div>
  );
};

export default function DashboardPage() {
  // Unified experience, no manual tool selection
  // Overlay that consumes context under the provider
  const OrbOverlay = () => {
    const { toolUIActive } = useLiveAPIContext();

    return (
      <div className="absolute inset-0 pointer-events-none z-50">
        <motion.div
          className="absolute z-10 pointer-events-none"
          animate={{
            left: toolUIActive ? "20%" : "50%", // 20% for 2/5 position in grid
            top: "50%",
            x: toolUIActive ? "-50%" : "-50%",
            y: "-50%",
            scale: toolUIActive ? 0.8 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.5,
          }}
        >
          <VoiceOrb size="250px" />
        </motion.div>
      </div>
    );
  };

  const API_KEY =
    typeof window !== "undefined"
      ? (process.env.REACT_APP_GEMINI_API_KEY as string)
      : "";
  const apiOptions: LiveClientOptions = { apiKey: API_KEY };

  return (
    <div className="App bg-background text-foreground">
      <LiveAPIProvider options={apiOptions}>
        <div className="streaming-console flex h-screen w-screen bg-background text-foreground">
          <main className="relative flex flex-col items-center justify-center flex-grow gap-4 max-w-full overflow-hidden bg-card text-card-foreground">
            <AccountWidget />
            <div className="z-20">
              <OrbOverlay />
            </div>

            {/* Settings button on top right */}
            <div className="absolute top-4 right-4 z-30">
              <SettingsDialog />
            </div>

            <MainContentArea />

            <ConversationBar className="absolute bottom-0 left-0 right-0 z-30" />
          </main>
        </div>
        <Toaster />
      </LiveAPIProvider>
    </div>
  );
}
