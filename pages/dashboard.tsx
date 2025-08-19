import { useRef, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import cn from "classnames";
import { LiveClientOptions } from "../src/types";
import type { GetServerSideProps } from 'next';

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

export default function Dashboard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const API_KEY =
    typeof window !== "undefined"
      ? (process.env.REACT_APP_GEMINI_API_KEY as string)
      : "";

  const apiOptions: LiveClientOptions = { apiKey: API_KEY };

  return (
    <>
      <Head>
        <title>Dashboard - Multimodal Live Console</title>
        <meta name="description" content="Multimodal Live API Web Console" />
      </Head>
      <div className="App">
        <LiveAPIProvider options={apiOptions}>
          <div className="streaming-console flex h-screen w-screen">
            <SidePanel />
            <main className="flex flex-col items-center justify-center flex-grow gap-4 max-w-full overflow-hidden">
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
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  try {
    const { getAuth } = await import('@clerk/nextjs/server');
    const auth = getAuth(ctx.req);
    if (!auth?.userId) {
      return { redirect: { destination: '/', permanent: false } };
    }
  } catch (e) {}
  return { props: {} };
};
