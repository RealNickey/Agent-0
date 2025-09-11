"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback } from "react";

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
  isSleeping?: boolean;
}

const SiriOrb: React.FC<SiriOrbProps> = ({
  size = "192px",
  className,
  colors,
  animationDuration = 20,
  isListening = false,
  audioLevel = 0,
  isSleeping = false,
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
  // Close eyes completely while sleeping; otherwise blink
  const eyeScale = isSleeping ? 0.05 : isBlinking ? 0.1 : 1;

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

      {/* Sleeping ZZZ Animation (top-right) with smooth fade-out */}
      <div
        className="sleeping-overlay z-20"
        style={{
          position: "absolute",
          top: `-${sizeValue * 0.5}px`,
          right: `-${sizeValue * 0.12}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `rotate(20deg) translateY(${isSleeping ? 0 : -8}px)`,
          opacity: isSleeping ? 1 : 0,
          transition: "opacity 320ms ease, transform 320ms ease",
          pointerEvents: "none",
        }}
      >
        <div className="zzz-container" style={{ alignItems: "flex-end" }}>
          <span className="zzz-text zzz-1">Z</span>
          <span className="zzz-text zzz-2">Z</span>
          <span className="zzz-text zzz-3">Z</span>
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

        /* Sleeping ZZZ Animation */
        .sleeping-overlay {
          z-index: 20;
        }
        .zzz-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .zzz-text {
          font-size: 24px;
          font-weight: bold;
          color: rgba(255, 255, 255, 0.8);
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          animation: zzz-float 2s infinite ease-in-out;
        }
        .zzz-1 {
          animation-delay: 0s;
        }
        .zzz-2 {
          animation-delay: 0.3s;
        }
        .zzz-3 {
          animation-delay: 0.6s;
        }
        @keyframes zzz-float {
          0%,
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-15px) scale(1.2);
            opacity: 1;
          }
        }

        /* Thinking animation removed */

        @media (prefers-reduced-motion: reduce) {
          .orb-container::before {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

// --- Voice Interactive Demo (Integrated) ---
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";

type VoiceOrbProps = {
  size?: string;
};

const VoiceInteractiveSiriOrb: React.FC<VoiceOrbProps> = ({
  size = "256px",
}) => {
  const [selectedSize] = useState<string>(size);
  const [animationDuration] = useState(20);
  const { connected, connect, disconnect, volume } = useLiveAPIContext();

  // Manual connect: removed auto-connect to avoid unexpected permission prompts.
  // Connection is now toggled by clicking the orb.
  const toggleConnected = useCallback(async () => {
    try {
      if (connected) {
        await disconnect();
      } else {
        await connect();
      }
    } catch (e) {
      console.error("Toggle connect failed", e);
    }
  }, [connected, connect, disconnect]);

  // Determine orb states (thinking removed):
  // - sleeping when not connected
  // - listening whenever connected; audioLevel still reflects volume for visuals
  const isSleeping = !connected;
  const isListening = connected;
  const audioLevel = volume;

  return (
    <div
      className="flex flex-col items-center"
      onClick={toggleConnected}
      role="button"
      title={connected ? "Disconnect voice" : "Connect voice"}
      style={{ cursor: "pointer" }}
    >
      <SiriOrb
        size={selectedSize}
        animationDuration={animationDuration}
        className="drop-shadow-2xl"
        isSleeping={isSleeping}
        isListening={isListening}
        audioLevel={audioLevel}
      />
    </div>
  );
};

export default VoiceInteractiveSiriOrb;
