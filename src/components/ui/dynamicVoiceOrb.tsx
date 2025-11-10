"use client";

import dynamic from "next/dynamic";
import { useOrbSettings } from "../../lib/orb-settings";

const SiriOrb = dynamic(() => import("./voiceOrb"), {
  ssr: false,
});

const ElevenLabsOrb = dynamic(() => import("./elevenLabsOrb"), {
  ssr: false,
});

const ElevenLabsOfficialOrb = dynamic(() => import("./elevenLabsOfficialOrb"), {
  ssr: false,
});

type DynamicVoiceOrbProps = {
  size?: string;
};

const DynamicVoiceOrb: React.FC<DynamicVoiceOrbProps> = ({ size = "256px" }) => {
  const { selectedOrb } = useOrbSettings();

  if (selectedOrb === "elevenlabs-official") {
    return <ElevenLabsOfficialOrb size={size} />;
  }

  if (selectedOrb === "elevenlabs") {
    return <ElevenLabsOrb size={size} />;
  }

  return <SiriOrb size={size} />;
};

export default DynamicVoiceOrb;
