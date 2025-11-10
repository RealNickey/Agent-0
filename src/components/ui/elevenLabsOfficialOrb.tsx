"use client";

import { useCallback, useEffect, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { Orb, AgentState } from "./orb";

type ElevenLabsOfficialOrbProps = {
  size?: string;
};

const ElevenLabsOfficialOrb: React.FC<ElevenLabsOfficialOrbProps> = ({
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

  // Map Gemini states to ElevenLabs orb states
  const getAgentState = (): AgentState => {
    if (!connected) return null;
    if (isSpeaking) return "talking";
    return "listening";
  };

  // Use default ElevenLabs colors - beautiful gradient scheme
  const orbColors: [string, string] = [
    isSpeaking ? "#A855F7" : // Purple for speaking
    connected ? "#3B82F6" :   // Blue for listening
    "#6B7280",                // Gray for idle
    isSpeaking ? "#EC4899" :  // Pink for speaking
    connected ? "#06B6D4" :   // Cyan for listening
    "#9CA3AF"                 // Light gray for idle
  ];

  return (
    <div
      className="flex flex-col items-center"
      onClick={toggleConnected}
      role="button"
      title={connected ? "Disconnect voice" : "Connect voice"}
      style={{ cursor: "pointer", width: size, height: size }}
    >
      <Orb
        colors={orbColors}
        agentState={getAgentState()}
        volumeMode="manual"
        manualInput={connected ? volume : 0}
        manualOutput={isSpeaking ? volume : connected ? 0.3 : 0}
      />
    </div>
  );
};

export default ElevenLabsOfficialOrb;
