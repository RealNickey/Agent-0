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
const Altair = dynamic(
  () =>
    import("../../src/tools/altair/Altair").then((m) => ({
      default: m.Altair,
    })),
  { ssr: false }
);
const TMDbMovieBrowser = dynamic(() => import("../../src/tools/tmdb"), {
  ssr: false,
});
const ControlTray = dynamic(
  () => import("../../src/components/control-tray/ControlTray"),
  { ssr: false }
);
import { useLiveAPIContext } from "../../src/contexts/LiveAPIContext";

export default function DashboardPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [activeApp, setActiveApp] = useState<"movies" | "altair">("movies");
  // Overlay that consumes context under the provider
  const OrbOverlay = () => {
    return (
      <div className="absolute inset-0 pointer-events-none z-50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <VoiceOrb size="250px" />
        </div>
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
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveApp("movies")}
                  className={cn(
                    "px-3 h-8 rounded text-sm font-medium transition-colors",
                    activeApp === "movies"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  🎬 Movie Browser
                </button>
                <button
                  onClick={() => setActiveApp("altair")}
                  className={cn(
                    "px-3 h-8 rounded text-sm font-medium transition-colors",
                    activeApp === "altair"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  📊 Altair Charts
                </button>
              </div>
              {/* Controls on the right side */}
              <div className="flex items-center gap-2">
                <IntegrationsButton />
                <SettingsDialog />
                <ThemeToggle />
              </div>
            </div>

            <div className="main-app-area flex flex-1 items-center justify-center w-full">
              {/* Conditional App Rendering */}
              {activeApp === "movies" && <TMDbMovieBrowser />}
              {activeApp === "altair" && <Altair />}
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
