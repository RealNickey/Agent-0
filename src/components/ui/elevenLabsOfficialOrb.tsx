"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { Orb, AgentState } from "./orb";
import { useOrbSettings } from "../../lib/orb-settings";

type ElevenLabsOfficialOrbProps = {
  size?: string;
};

const ElevenLabsOfficialOrb: React.FC<ElevenLabsOfficialOrbProps> = ({
  size = "256px",
}) => {
  const { connected, connect, disconnect, volume } = useLiveAPIContext();
  const { colors } = useOrbSettings();
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

  // Use custom colors from settings - convert to the orb's color format
  const orbColors: [string, string] = [
    isSpeaking ? colors.speaking.primary : 
    connected ? colors.listening.primary : 
    colors.idle.primary,
    isSpeaking ? colors.speaking.secondary :
    connected ? colors.listening.secondary :
    colors.idle.secondary
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
