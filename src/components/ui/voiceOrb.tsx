"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

// --- Voice Interactive Siri Orb Component ---
interface SiriOrbProps {
  size?: string;
  className?: string;
  colors?: {
    bg?: string;
    c1?: string;
    c2?: string;
    c3?: string;
  };
  animationDuration?: number;
  isListening?: boolean;
  audioLevel?: number;
}

const SiriOrb: React.FC<SiriOrbProps> = ({
  size = "192px",
  className,
  colors,
  animationDuration = 20,
  isListening = false,
  audioLevel = 0,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);

  // Use theme tokens for orb colors
  const defaultColors = {
    bg: "transparent",
    c1: "#6D8EC5",
    c2: "#D3622C",
    c3: "#F0C845",
  };

  const finalColors = { ...defaultColors, ...colors };
  const sizeValue = parseInt(size.replace("px", ""), 10);

  const blurAmount = Math.max(sizeValue * 0.08, 8);
  const contrastAmount = Math.max(sizeValue * 0.003, 1.8);
  const eyeWidth = sizeValue * 0.08;
  const eyeHeight = sizeValue * 0.25;
  const eyeSpacing = sizeValue * 0.15;

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 2000 + Math.random() * 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Voice reactive scaling
  const voiceScale = isListening ? 1 + audioLevel * 0.3 : 1;
  const eyeScale = isBlinking ? 0.1 : 1;

  return (
    <div
      className={cn("siri-orb relative", className)}
      style={
        {
          width: size,
          height: size,
          "--bg": finalColors.bg,
          "--c1": finalColors.c1,
          "--c2": finalColors.c2,
          "--c3": finalColors.c3,
          "--animation-duration": `${animationDuration}s`,
          "--blur-amount": `${blurAmount}px`,
          "--contrast-amount": contrastAmount,
          "--voice-scale": voiceScale,
        } as React.CSSProperties
      }
    >
      {/* Main Orb */}
      <div className="orb-container">
        {/* Eyes */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div
            className="flex items-center gap-2"
            style={{ gap: `${eyeSpacing}px` }}
          >
            {/* Left Eye */}
            <div
              className="eye rounded-full transition-transform duration-150 ease-out"
              style={{
                width: `${eyeWidth}px`,
                height: `${eyeHeight}px`,
                transform: `scaleY(${eyeScale})`,
              }}
            />
            {/* Right Eye */}
            <div
              className="eye rounded-full transition-transform duration-150 ease-out"
              style={{
                width: `${eyeWidth}px`,
                height: `${eyeHeight}px`,
                transform: `scaleY(${eyeScale})`,
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @property --angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }

        .siri-orb {
          display: grid;
          grid-template-areas: "stack";
          overflow: visible;
          border-radius: 50%;
          position: relative;
        }

        .orb-container {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          transform: scale(var(--voice-scale));
          transition: transform 0.1s ease-out;
          background: radial-gradient(
            circle,
            rgba(33, 40, 66, 0.1) 0%,
            rgba(33, 40, 66, 0.05) 30%,
            transparent 70%
          );
        }

        .orb-container::before {
          content: "";
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: conic-gradient(
              from calc(var(--angle) * 1.2) at 30% 65%,
              var(--c3) 0deg,
              transparent 45deg 315deg,
              var(--c3) 360deg
            ),
            conic-gradient(
              from calc(var(--angle) * 0.8) at 70% 35%,
              var(--c2) 0deg,
              transparent 60deg 300deg,
              var(--c2) 360deg
            ),
            conic-gradient(
              from calc(var(--angle) * -1.5) at 65% 75%,
              var(--c1) 0deg,
              transparent 90deg 270deg,
              var(--c1) 360deg
            ),
            conic-gradient(
              from calc(var(--angle) * 2.1) at 25% 25%,
              var(--c2) 0deg,
              transparent 30deg 330deg,
              var(--c2) 360deg
            ),
            conic-gradient(
              from calc(var(--angle) * -0.7) at 80% 80%,
              var(--c1) 0deg,
              transparent 45deg 315deg,
              var(--c1) 360deg
            ),
            radial-gradient(
              ellipse 120% 80% at 40% 60%,
              var(--c3) 0%,
              transparent 50%
            );
          filter: blur(var(--blur-amount)) contrast(var(--contrast-amount))
            saturate(1.2);
          animation: rotate var(--animation-duration) linear infinite;
          transform: translateZ(0);
          will-change: transform;
        }

        .orb-container::after {
          content: "";
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(
            circle at 45% 55%,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0.08) 30%,
            transparent 60%
          );
          mix-blend-mode: overlay;
        }

        .eye {
          background: #212842;
        }

        @keyframes rotate {
          from {
            --angle: 0deg;
          }
          to {
            --angle: 360deg;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .orb-container::before {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

// --- Voice Interactive Demo ---
type VoiceOrbProps = {
  active?: boolean;
  size?: string;
};

const VoiceInteractiveSiriOrb: React.FC<VoiceOrbProps> = ({
  active = false,
  size = "256px",
}) => {
  // Default sizing and animation without settings UI
  const [selectedSize] = useState<string>(size);
  const [animationDuration] = useState(20);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Audio level monitoring
  const startAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current =
        audioContextRef.current.createMediaStreamSource(stream);

      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyserRef.current && isListening) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average / 255);
          requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopAudioMonitoring = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    if (microphoneRef.current) {
      microphoneRef.current = null;
    }
    setAudioLevel(0);
  };

  // Sync listening state with external active prop (no transcription)
  useEffect(() => {
    let cancelled = false;
    const startIfNeeded = async () => {
      if (active && !isListening) {
        await startAudioMonitoring();
        if (!cancelled) setIsListening(true);
      }
      if (!active && isListening) {
        stopAudioMonitoring();
        if (!cancelled) setIsListening(false);
      }
    };
    startIfNeeded();
    // Cleanup on unmount
    return () => {
      cancelled = true;
      stopAudioMonitoring();
      setIsListening(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="flex flex-col items-center gap-6 text-foreground">
      <div className="flex flex-col items-center gap-6">
        <SiriOrb
          size={selectedSize}
          animationDuration={animationDuration}
          className="drop-shadow-2xl"
          isListening={isListening}
          audioLevel={audioLevel}
        />

        <div className="flex flex-col items-center gap-3">
          {isListening && (
            <div className="text-sm text-muted-foreground animate-pulse">
              Listening... Speak now
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceInteractiveSiriOrb;
