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

import { useRef, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import cn from "classnames";
import { LiveClientOptions } from "../src/types";

// Dynamically import components that use browser APIs
const LiveAPIProvider = dynamic(
  () =>
    import("../src/contexts/LiveAPIContext").then((mod) => ({
      default: mod.LiveAPIProvider,
    })),
  { ssr: false }
);

const SidePanel = dynamic(
  () => import("../src/components/side-panel/SidePanel"),
  { ssr: false }
);

const Altair = dynamic(
  () =>
    import("../src/components/altair/Altair").then((mod) => ({
      default: mod.Altair,
    })),
  { ssr: false }
);

const ControlTray = dynamic(
  () => import("../src/components/control-tray/ControlTray"),
  { ssr: false }
);

export default function Home() {
  // this video reference is used for displaying the active stream, whether that is the webcam or screen capture
  // feel free to style as you see fit
  const videoRef = useRef<HTMLVideoElement>(null);
  // either the screen capture, the video or null, if null we hide it
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  // Check API key only on client side
  const API_KEY =
    typeof window !== "undefined"
      ? (process.env.REACT_APP_GEMINI_API_KEY as string)
      : "";

  if (typeof window !== "undefined" && typeof API_KEY !== "string") {
    throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
  }

  const apiOptions: LiveClientOptions = {
    apiKey: API_KEY,
  };

  return (
    <>
      <Head>
        <title>Multimodal Live - Console</title>
        <meta name="description" content="Multimodal Live API Web Console" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="App">
        <LiveAPIProvider options={apiOptions}>
          <div className="bg-neutral-15 text-gray-300 flex h-screen w-screen">
            <SidePanel />
            <main className="relative flex flex-col items-center justify-center flex-grow gap-4 max-w-full overflow-hidden">
              <div className="flex flex-1 items-center justify-center">
                {/* APP goes here */}
                <Altair />
                <video
                  className={cn("flex-grow max-w-[90%] rounded-3xl max-h-fit", {
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
              >
                {/* put your own buttons here */}
              </ControlTray>
            </main>
          </div>
        </LiveAPIProvider>
      </div>
    </>
  );
}
