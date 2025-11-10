"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";

// --- ElevenLabs-style Voice Orb Component ---
interface ElevenLabsOrbProps {
  size?: string;
  className?: string;
  isListening?: boolean;
  isSpeaking?: boolean;
  audioLevel?: number;
  isIdle?: boolean;
}

const ElevenLabsOrb: React.FC<ElevenLabsOrbProps> = ({
  size = "192px",
  className,
  isListening = false,
  isSpeaking = false,
  audioLevel = 0,
  isIdle = true,
}) => {
  const sizeValue = parseInt(size.replace("px", ""), 10);
  
  // Determine the current state for styling
  const getOrbState = () => {
    if (isSpeaking) return 'speaking';
    if (isListening) return 'listening';
    return 'idle';
  };

  const orbState = getOrbState();
  
  // Calculate scale based on audio level and state
  const getScale = () => {
    if (isSpeaking) {
      return 1 + audioLevel * 0.4; // More pronounced scaling when speaking
    }
    if (isListening) {
      return 1 + audioLevel * 0.2; // Subtle scaling when listening
    }
    return 1;
  };

  const scale = getScale();

  // Color scheme based on state
  const getColors = () => {
    switch (orbState) {
      case 'speaking':
        return {
          primary: '#A855F7', // Purple
          secondary: '#EC4899', // Pink
          glow: 'rgba(168, 85, 247, 0.5)',
        };
      case 'listening':
        return {
          primary: '#3B82F6', // Blue
          secondary: '#06B6D4', // Cyan
          glow: 'rgba(59, 130, 246, 0.5)',
        };
      default:
        return {
          primary: '#6B7280', // Gray
          secondary: '#9CA3AF', // Light gray
          glow: 'rgba(107, 114, 128, 0.3)',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className={cn("elevenlabs-orb relative", className)}
      style={{
        width: size,
        height: size,
      }}
    >
      {/* Main Orb Container */}
      <div
        className="orb-core absolute inset-0 rounded-full transition-transform duration-200 ease-out"
        style={{
          transform: `scale(${scale})`,
        }}
      >
        {/* Base gradient orb */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-500"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${colors.primary}, ${colors.secondary})`,
            boxShadow: `0 0 ${sizeValue * 0.4}px ${colors.glow}, inset 0 0 ${sizeValue * 0.2}px rgba(255, 255, 255, 0.2)`,
          }}
        />

        {/* Animated rings for speaking/listening states */}
        {(isSpeaking || isListening) && (
          <>
            <div
              className="pulse-ring absolute inset-0 rounded-full"
              style={{
                border: `2px solid ${colors.primary}`,
                opacity: 0.6,
              }}
            />
            <div
              className="pulse-ring-delayed absolute inset-0 rounded-full"
              style={{
                border: `2px solid ${colors.secondary}`,
                opacity: 0.4,
              }}
            />
          </>
        )}

        {/* Center highlight */}
        <div
          className="absolute rounded-full transition-opacity duration-500"
          style={{
            top: '20%',
            left: '20%',
            width: '35%',
            height: '35%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%)',
            opacity: isIdle ? 0.3 : 0.6,
          }}
        />

        {/* Audio bars for speaking state */}
        {isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="audio-bar bg-white rounded-full"
                  style={{
                    width: `${sizeValue * 0.02}px`,
                    height: `${sizeValue * (0.15 + Math.random() * audioLevel * 0.3)}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .elevenlabs-orb {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .pulse-ring {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .pulse-ring-delayed {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: 0.5s;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.6;
          }
        }

        .audio-bar {
          animation: audio-bounce 0.6s ease-in-out infinite alternate;
        }

        @keyframes audio-bounce {
          0% {
            transform: scaleY(0.5);
          }
          100% {
            transform: scaleY(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pulse-ring,
          .pulse-ring-delayed,
          .audio-bar {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

// --- Voice Interactive ElevenLabs Orb ---
type VoiceOrbProps = {
  size?: string;
};

const VoiceInteractiveElevenLabsOrb: React.FC<VoiceOrbProps> = ({
  size = "256px",
}) => {
  const { connected, connect, disconnect, volume } = useLiveAPIContext();
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Detect speaking state based on volume threshold
  useEffect(() => {
    if (connected && volume > 0.1) {
      setIsSpeaking(true);
      const timeout = setTimeout(() => setIsSpeaking(false), 300);
      return () => clearTimeout(timeout);
    } else {
      setIsSpeaking(false);
    }
  }, [volume, connected]);

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

  return (
    <div
      className="flex flex-col items-center"
      onClick={toggleConnected}
      role="button"
      title={connected ? "Disconnect voice" : "Connect voice"}
      style={{ cursor: "pointer" }}
    >
      <ElevenLabsOrb
        size={size}
        className="drop-shadow-2xl"
        isIdle={!connected}
        isListening={connected && !isSpeaking}
        isSpeaking={isSpeaking}
        audioLevel={volume}
      />
    </div>
  );
};

export default VoiceInteractiveElevenLabsOrb;
