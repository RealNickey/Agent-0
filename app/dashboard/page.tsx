"use client";

import dynamic from "next/dynamic";
import cn from "classnames";
import { useRef, useState } from "react";
import { LiveClientOptions } from "../../src/types";
import { ThemeToggle } from "../../src/components/ui/theme-toggle";

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
const Altair = dynamic(
  () =>
    import("../../src/tools/altair/Altair").then((m) => ({
      default: m.Altair,
    })),
  { ssr: false }
);
const ControlTray = dynamic(
  () => import("../../src/components/control-tray/ControlTray"),
  { ssr: false }
);

export default function DashboardPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const API_KEY =
    typeof window !== "undefined"
      ? (process.env.REACT_APP_GEMINI_API_KEY as string)
      : "";
  const apiOptions: LiveClientOptions = { apiKey: API_KEY };

  return (
    <div className="App bg-background text-foreground">
      <LiveAPIProvider options={apiOptions}>
        <div className="streaming-console flex h-screen w-screen bg-background text-foreground">
          <SidePanel />
          <main className="flex flex-col items-center justify-center flex-grow gap-4 max-w-full overflow-hidden bg-card text-card-foreground">
            <div className="absolute top-4 right-4 z-10">
              <ThemeToggle />
            </div>
            <div className="main-app-area flex flex-1 items-center justify-center">
              <Altair />
              <video
                className={cn("stream", {
                  hidden: !videoRef.current || !videoStream,
                })}
                ref={videoRef}
                autoPlay
                playsInline
              />
            </div>
            <ControlTray
              videoRef={videoRef}
              supportsVideo={true}
              onVideoStreamChange={setVideoStream}
              enableEditingSettings={true}
            />
          </main>
        </div>
      </LiveAPIProvider>
    </div>
  );
}
