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
import { motion, AnimatePresence } from "framer-motion";

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

// Main content area component that can access context
const MainContentArea = ({
  videoRef,
  videoStream,
}: {
  videoRef: any;
  videoStream: any;
}) => {
  const { toolUIActive } = useLiveAPIContext();

  return (
    <div className="main-app-area flex flex-1 items-center justify-center w-full relative">
      {/* Unified assistant renders movies & charts */}
      <UnifiedAssistant />
      <video
        className={cn("stream flex-grow max-w-[90%] rounded-[32px] max-h-fit", {
          hidden: !videoRef.current || !videoStream,
        })}
        ref={videoRef}
        autoPlay
        playsInline
      />
    </div>
  );
};

export default function DashboardPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
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

            <MainContentArea videoRef={videoRef} videoStream={videoStream} />

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
