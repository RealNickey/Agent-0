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
import { motion, AnimatePresence } from "framer-motion";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { UseMediaStreamResult } from "../../hooks/use-media-stream-mux";
import { useScreenCapture } from "../../hooks/use-screen-capture";
import { useWebcam } from "../../hooks/use-webcam";
import { AudioRecorder } from "../../lib/audio-recorder";
import AudioPulse from "../audio-pulse/AudioPulse";
import SettingsDialog from "../settings-dialog/SettingsDialog";
import { Button } from "../ui/button";

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

// Modern animation variants
const containerVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1,
    },
  },
};

const buttonVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.95,
  },
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.1, 1],
  },
};

/**
 * button used for triggering webcam or screen-capture
 */
const MediaStreamButton = memo(
  ({ isStreaming, onIcon, offIcon, start, stop }: MediaStreamButtonProps) => (
    <motion.div
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
    >
      <Button
        variant={isStreaming ? "secondary" : "outline"}
        size="icon"
        className={cn("modern-media-button", { active: isStreaming })}
        onClick={isStreaming ? stop : start}
      >
        <span className="material-symbols-outlined filled">
          {isStreaming ? onIcon : offIcon}
        </span>
      </Button>
    </motion.div>
  )
);
MediaStreamButton.displayName = 'MediaStreamButton';

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
    <motion.section 
      className="control-tray modern-control-tray"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <canvas style={{ display: "none" }} ref={renderCanvasRef} />
      
      <motion.nav 
        className={cn("actions-nav modern-actions-nav", { disabled: !connected })}
        variants={buttonVariants}
      >
        {/* Mic Button with Volume Indicator */}
        <motion.div
          className="mic-container"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            variant={muted ? "outline" : "accent"}
            size="icon"
            className={cn("modern-mic-button", { muted })}
            onClick={() => setMuted(!muted)}
            disabled={!connected}
          >
            <span className="material-symbols-outlined filled">
              {!muted ? "mic" : "mic_off"}
            </span>
          </Button>
          
          {/* Volume indicator with modern design */}
          <motion.div 
            className="volume-indicator"
            variants={muted ? {} : pulseVariants}
            animate={connected && !muted ? "pulse" : ""}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Audio Pulse Visualization */}
        <motion.div 
          className="audio-pulse-container modern-pulse-container"
          variants={buttonVariants}
        >
          <div className="pulse-wrapper">
            <AudioPulse volume={volume} active={connected} hover={false} />
          </div>
        </motion.div>

        {/* Video Stream Controls */}
        {supportsVideo && (
          <motion.div 
            className="video-controls"
            variants={buttonVariants}
          >
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
          </motion.div>
        )}
        
        {children}
      </motion.nav>

      {/* Main Connection Control */}
      <motion.div 
        className={cn("connection-container modern-connection", { connected })}
        variants={buttonVariants}
      >
        <div className="connection-button-container modern-connection-wrapper">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              ref={connectButtonRef}
              variant={connected ? "secondary" : "default"}
              size="icon"
              className={cn("connect-toggle modern-connect-button", { connected })}
              onClick={connected ? disconnect : connect}
            >
              <motion.span 
                className="material-symbols-outlined filled"
                animate={{ rotate: connected ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {connected ? "pause" : "play_arrow"}
              </motion.span>
            </Button>
          </motion.div>
        </div>
        
        <AnimatePresence>
          {connected && (
            <motion.span 
              className="text-indicator modern-status-text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              Streaming
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      
      {enableEditingSettings ? <SettingsDialog /> : ""}
    </motion.section>
  );
}

export default memo(ControlTray);
