"use client";

import { useOrbSettings, defaultOrbColors } from "../../lib/orb-settings";
import { Button } from "../ui/button";

export default function OrbColorCustomizer() {
  const { colors, setColors, resetColors, selectedOrb } = useOrbSettings();

  // Show for both ElevenLabs orb variants
  if (selectedOrb !== "elevenlabs" && selectedOrb !== "elevenlabs-official") {
    return null;
  }

  const handleColorChange = (
    state: "idle" | "listening" | "speaking",
    type: "primary" | "secondary",
    value: string
  ) => {
    setColors({
      ...colors,
      [state]: {
        ...colors[state],
        [type]: value,
      },
    });
  };

  return (
    <div className="mt-4 p-4 border border-border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">Orb Colors</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={resetColors}
          className="h-7 text-xs"
        >
          Reset to Default
        </Button>
      </div>

      <div className="space-y-3">
        {/* Idle State */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Idle State
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground block mb-1">
                Primary
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={colors.idle.primary}
                  onChange={(e) =>
                    handleColorChange("idle", "primary", e.target.value)
                  }
                  className="h-8 w-12 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.idle.primary}
                  onChange={(e) =>
                    handleColorChange("idle", "primary", e.target.value)
                  }
                  className="flex-1 h-8 px-2 text-xs rounded border border-border bg-background"
                  placeholder="#6B7280"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground block mb-1">
                Secondary
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={colors.idle.secondary}
                  onChange={(e) =>
                    handleColorChange("idle", "secondary", e.target.value)
                  }
                  className="h-8 w-12 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.idle.secondary}
                  onChange={(e) =>
                    handleColorChange("idle", "secondary", e.target.value)
                  }
                  className="flex-1 h-8 px-2 text-xs rounded border border-border bg-background"
                  placeholder="#9CA3AF"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Listening State */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Listening State
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground block mb-1">
                Primary
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={colors.listening.primary}
                  onChange={(e) =>
                    handleColorChange("listening", "primary", e.target.value)
                  }
                  className="h-8 w-12 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.listening.primary}
                  onChange={(e) =>
                    handleColorChange("listening", "primary", e.target.value)
                  }
                  className="flex-1 h-8 px-2 text-xs rounded border border-border bg-background"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground block mb-1">
                Secondary
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={colors.listening.secondary}
                  onChange={(e) =>
                    handleColorChange("listening", "secondary", e.target.value)
                  }
                  className="h-8 w-12 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.listening.secondary}
                  onChange={(e) =>
                    handleColorChange("listening", "secondary", e.target.value)
                  }
                  className="flex-1 h-8 px-2 text-xs rounded border border-border bg-background"
                  placeholder="#06B6D4"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Speaking State */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Speaking State
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground block mb-1">
                Primary
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={colors.speaking.primary}
                  onChange={(e) =>
                    handleColorChange("speaking", "primary", e.target.value)
                  }
                  className="h-8 w-12 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.speaking.primary}
                  onChange={(e) =>
                    handleColorChange("speaking", "primary", e.target.value)
                  }
                  className="flex-1 h-8 px-2 text-xs rounded border border-border bg-background"
                  placeholder="#A855F7"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground block mb-1">
                Secondary
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={colors.speaking.secondary}
                  onChange={(e) =>
                    handleColorChange("speaking", "secondary", e.target.value)
                  }
                  className="h-8 w-12 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.speaking.secondary}
                  onChange={(e) =>
                    handleColorChange("speaking", "secondary", e.target.value)
                  }
                  className="flex-1 h-8 px-2 text-xs rounded border border-border bg-background"
                  placeholder="#EC4899"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
