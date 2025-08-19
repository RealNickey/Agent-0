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

import cn from "classnames";

import { memo, ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { UseMediaStreamResult } from "../../hooks/use-media-stream-mux";
import { useScreenCapture } from "../../hooks/use-screen-capture";
import { useWebcam } from "../../hooks/use-webcam";
import { AudioRecorder } from "../../lib/audio-recorder";
import AudioPulse from "../audio-pulse/AudioPulse";
import SettingsDialog from "../settings-dialog/SettingsDialog";

export type ControlTrayProps = {
  // Accept a ref whose current can initially be null (common when using useRef<HTMLVideoElement>(null))
  videoRef: RefObject<HTMLVideoElement | null>;
  children?: ReactNode;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  enableEditingSettings?: boolean;
};

type MediaStreamButtonProps = {
  isStreaming: boolean;
  onIcon: string;
  offIcon: string;
  start: () => Promise<any>;
  stop: () => any;
};

/**
 * button used for triggering webcam or screen-capture
 */
const MediaStreamButton = memo(
  ({ isStreaming, onIcon, offIcon, start, stop }: MediaStreamButtonProps) =>
    isStreaming ? (
      <button
        className="flex items-center justify-center bg-neutral-20 text-neutral-60 text-xl leading-7 lowercase cursor-pointer animate-opacity-pulse transition-all duration-200 ease-in-out w-12 h-12 rounded-[18px] border border-transparent select-none focus:border-2 focus:border-neutral-20 focus:outline focus:outline-2 focus:outline-neutral-80 hover:bg-transparent hover:border-neutral-20"
        onClick={stop}
      >
        <span className="material-symbols-outlined">{onIcon}</span>
      </button>
    ) : (
      <button
        className="flex items-center justify-center bg-neutral-20 text-neutral-60 text-xl leading-7 lowercase cursor-pointer animate-opacity-pulse transition-all duration-200 ease-in-out w-12 h-12 rounded-[18px] border border-transparent select-none focus:border-2 focus:border-neutral-20 focus:outline focus:outline-2 focus:outline-neutral-80 hover:bg-transparent hover:border-neutral-20"
        onClick={start}
      >
        <span className="material-symbols-outlined">{offIcon}</span>
      </button>
    )
);
MediaStreamButton.displayName = "MediaStreamButton";

function ControlTray({
  videoRef,
  children,
  onVideoStreamChange = () => {},
  supportsVideo,
  enableEditingSettings,
}: ControlTrayProps) {
  const videoStreams = [useWebcam(), useScreenCapture()];
  const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);
  const [webcam, screenCapture] = videoStreams;
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  const { client, connected, connect, disconnect, volume } =
    useLiveAPIContext();

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`
    );
  }, [inVolume]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = activeVideoStream;
    }

    let timeoutId = -1;

    function sendVideoFrame() {
      const video = videoRef.current;
      const canvas = renderCanvasRef.current;

      if (!video || !canvas) {
        return;
      }

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;
      if (canvas.width + canvas.height > 0 && videoRef.current) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 1.0);
        const data = base64.slice(base64.indexOf(",") + 1, Infinity);
        client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
      }
      if (connected) {
        timeoutId = window.setTimeout(sendVideoFrame, 1000 / 0.5);
      }
    }
    if (connected && activeVideoStream !== null) {
      requestAnimationFrame(sendVideoFrame);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [connected, activeVideoStream, client, videoRef]);

  //handler for swapping from one video-stream to the next
  const changeStreams = (next?: UseMediaStreamResult) => async () => {
    if (next) {
      const mediaStream = await next.start();
      setActiveVideoStream(mediaStream);
      onVideoStreamChange(mediaStream);
    } else {
      setActiveVideoStream(null);
      onVideoStreamChange(null);
    }

    videoStreams.filter((msr) => msr !== next).forEach((msr) => msr.stop());
  };

  return (
    <section className="absolute bottom-0 left-1/2 -translate-x-1/2 inline-flex justify-center items-start gap-2 pb-6">
      <canvas style={{ display: "none" }} ref={renderCanvasRef} />
      <nav
        className={cn(
          "bg-neutral-5 border border-neutral-30 rounded-[27px] inline-flex gap-3 items-center overflow-clip p-[10px] transition-all duration-[600ms] ease-in [&>*]:flex [&>*]:items-center [&>*]:flex-col [&>*]:gap-4",
          !connected &&
            "[&_.action-button]:bg-transparent [&_.action-button]:border-neutral-30 [&_.action-button]:text-neutral-30 [&_.action-button.disabled]:bg-transparent [&_.action-button.disabled]:border-neutral-30 [&_.action-button.disabled]:text-neutral-30"
        )}
      >
        <button
          className={cn(
            "relative flex items-center justify-center text-xl leading-7 lowercase cursor-pointer animate-opacity-pulse transition-all duration-200 ease-in-out w-12 h-12 rounded-[18px] border border-transparent select-none z-[1] text-black bg-accent-red hover:bg-red-400 focus:border-2 focus:border-neutral-20 focus:outline focus:outline-2 focus:outline-red-500",
            "before:absolute before:z-[-1] before:top-[calc(var(--volume)*-1)] before:left-[calc(var(--volume)*-1)] before:block before:content-[''] before:opacity-35 before:bg-red-500 before:w-[calc(100%+var(--volume)*2)] before:h-[calc(100%+var(--volume)*2)] before:rounded-[24px] before:transition-all before:duration-[20ms] before:ease-in-out",
            (muted || !connected) && "before:bg-transparent"
          )}
          onClick={() => setMuted(!muted)}
        >
          {!muted ? (
            <span className="material-symbols-outlined filled">mic</span>
          ) : (
            <span className="material-symbols-outlined filled">mic_off</span>
          )}
        </button>

        <div className="flex items-center justify-center bg-neutral-20 text-neutral-60 text-xl leading-7 lowercase cursor-pointer animate-opacity-pulse transition-all duration-200 ease-in-out w-12 h-12 rounded-[18px] border border-neutral-20 bg-neutral-2 select-none pointer-events-none">
          <AudioPulse volume={volume} active={connected} hover={false} />
        </div>

        {supportsVideo && (
          <>
            <MediaStreamButton
              isStreaming={screenCapture.isStreaming}
              start={changeStreams(screenCapture)}
              stop={changeStreams()}
              onIcon="cancel_presentation"
              offIcon="present_to_all"
            />
            <MediaStreamButton
              isStreaming={webcam.isStreaming}
              start={changeStreams(webcam)}
              stop={changeStreams()}
              onIcon="videocam_off"
              offIcon="videocam"
            />
          </>
        )}
        {children}
      </nav>

      <div
        className={cn(
          "flex flex-col justify-center items-center gap-1",
          connected && "connected"
        )}
      >
        <div className="rounded-[27px] border border-neutral-30 bg-neutral-5 p-[10px]">
          <button
            ref={connectButtonRef}
            className={cn(
              "flex items-center justify-center text-xl leading-7 lowercase cursor-pointer animate-opacity-pulse transition-all duration-200 ease-in-out w-12 h-12 rounded-[18px] border border-transparent select-none focus:border-2 focus:border-neutral-20 focus:outline focus:outline-2 focus:outline-neutral-80",
              connected
                ? "bg-blue-800 text-blue-500 hover:border-blue-500"
                : "bg-blue-500 text-neutral-5 focus:outline-neutral-80"
            )}
            onClick={connected ? disconnect : connect}
          >
            <span className="material-symbols-outlined filled">
              {connected ? "pause" : "play_arrow"}
            </span>
          </button>
        </div>
        <span
          className={cn(
            "text-[11px] text-blue-500 select-none transition-opacity",
            connected ? "opacity-100" : "opacity-0"
          )}
        >
          Streaming
        </span>
      </div>
      {enableEditingSettings ? <SettingsDialog /> : ""}
    </section>
  );
}

export default memo(ControlTray);
