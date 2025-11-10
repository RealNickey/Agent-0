import { useCallback } from "react";
import Select from "react-select";
import { useOrbSettings, OrbType } from "../../lib/orb-settings";

const orbOptions = [
  { value: "siri" as OrbType, label: "Siri Orb" },
  { value: "elevenlabs" as OrbType, label: "ElevenLabs Orb (Custom)" },
  { value: "elevenlabs-official" as OrbType, label: "ElevenLabs Orb (Official)" },
];

export default function OrbSelector() {
  const { selectedOrb, setSelectedOrb } = useOrbSettings();

  const selectedOption = orbOptions.find((opt) => opt.value === selectedOrb) || orbOptions[0];

  const handleChange = useCallback(
    (option: { value: OrbType; label: string } | null) => {
      if (option) {
        setSelectedOrb(option.value);
      }
    },
    [setSelectedOrb]
  );

  return (
    <div className="flex flex-col gap-1 h-[70px]">
      <label htmlFor="orb-selector" className="text-[10px]">
        Orb Style
      </label>
      <Select
        id="orb-selector"
        className="bg-neutral-20 text-neutral-90 w-[193px] h-[30px]"
        classNamePrefix="react-select"
        styles={{
          control: (baseStyles) => ({
            ...baseStyles,
            background: "var(--Neutral-15)",
            color: "var(--Neutral-90)",
            minHeight: "33px",
            maxHeight: "33px",
            border: 0,
          }),
          option: (styles, { isFocused, isSelected }) => ({
            ...styles,
            backgroundColor: isFocused
              ? "var(--Neutral-30)"
              : isSelected
              ? "var(--Neutral-20)"
              : undefined,
          }),
          menu: (styles) => ({
            ...styles,
            background: "var(--Neutral-20)",
            color: "var(--Neutral-90)",
          }),
          singleValue: (styles) => ({
            ...styles,
            color: "var(--Neutral-90)",
          }),
        }}
        value={selectedOption}
        options={orbOptions}
        onChange={handleChange}
      />
    </div>
  );
}
