"use client";

import dynamic from "next/dynamic";
import cn from "classnames";
import { useRef, useState } from "react";
import { LiveClientOptions } from "../../src/types";
import { ThemeToggle } from "../../src/components/ui/theme-toggle";
const VoiceOrb = dynamic(() => import("../../src/components/ui/voiceOrb"), {
  ssr: false,
});
import SettingsDialog from "../../src/components/settings-dialog/SettingsDialog";
import IntegrationsButton from "../../src/components/integrations/IntegrationsButton";

const LiveAPIProvider = dynamic(
  () =>
    import("../../src/contexts/LiveAPIContext").then((mod) => ({
      default: mod.LiveAPIProvider,
    })),
  { ssr: false }
);

const SidePanel = dynamic(
  () => import("../../src/components/side-panel/SidePanel"),
  { ssr: false }
);
const LeftPanel = dynamic(
  () => import("../../src/components/side-panel/LeftPanel"),
  { ssr: false }
);
// Unified assistant (movies + charts + search)
const UnifiedAssistant = dynamic(() => import("../../src/tools/tmdb"), {
  ssr: false,
});
const ControlTray = dynamic(
  () => import("../../src/components/control-tray/ControlTray"),
  { ssr: false }
);
import { useLiveAPIContext } from "../../src/contexts/LiveAPIContext";
import { useToolCallUI } from "@/contexts/ToolCallUIContext";
import { motion } from "framer-motion";
import ToolCallCanvas from "@/components/tool-canvas/ToolCallCanvas";

export default function DashboardPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  // Unified experience, no manual tool selection
  // Overlay that consumes context under the provider
  const OrbOverlay = () => {
    const { hasUI } = useToolCallUI();

    return (
      <>
        <motion.div
          className="absolute z-50 pointer-events-none"
          animate={
            hasUI
              ? {
                  top: "50%",
                  left: "16.67%", // 1/3 of the left side
                  translateX: "-50%",
                  translateY: "-50%",
                }
              : {
                  top: "50%",
                  left: "50%",
                  translateX: "-50%",
                  translateY: "-50%",
                }
          }
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
        >
          <VoiceOrb size="250px" />
        </motion.div>

        {hasUI && (
          <motion.div
            className="absolute right-0 top-0 w-2/3 h-full bg-background/80 backdrop-blur-xl rounded-l-xl p-4 overflow-y-auto"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
          >
            <ToolCallCanvas />
          </motion.div>
        )}
      </>
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
          <LeftPanel />
          <main className="relative flex flex-col items-center justify-center flex-grow gap-4 max-w-full overflow-hidden bg-card text-card-foreground">
            <div className="z-20">
              <OrbOverlay />
            </div>

            {/* Top controls aligned to sidebars */}
            <div className="w-full h-12 shrink-0 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm px-3 flex items-center justify-between">
              {/* Just after left sidebar */}
              <div className="flex gap-2 text-sm text-muted-foreground">
                <span>
                  Unified assistant: movies, search & charts auto-selected
                </span>
              </div>
              {/* Controls on the right side */}
              <div className="flex items-center gap-2">
                <IntegrationsButton />
                <SettingsDialog />
                <ThemeToggle />
              </div>
            </div>

            <div className="main-app-area flex flex-1 items-center justify-center w-full">
              {/* Unified assistant renders movies & charts */}
              <UnifiedAssistant />
              <video
                className={cn(
                  "stream flex-grow max-w-[90%] rounded-[32px] max-h-fit",
                  {
                    hidden: !videoRef.current || !videoStream,
                  }
                )}
                ref={videoRef}
                autoPlay
                playsInline
              />
            </div>

            <ControlTray
              videoRef={videoRef}
              supportsVideo={true}
              onVideoStreamChange={setVideoStream}
              enableEditingSettings={false}
            >
              {/* put your own buttons here */}
            </ControlTray>
          </main>
          <SidePanel />
        </div>
      </LiveAPIProvider>
    </div>
  );
}
