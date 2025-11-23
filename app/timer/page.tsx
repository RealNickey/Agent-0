"use client";

import { useState } from "react";
import ArcCountdown from "@/components/arc-countdown";
import { Button } from "@/components/ui/button";

type Mode = "countdown" | "stopwatch";

export default function TimerPage() {
  const [mode, setMode] = useState<Mode>("countdown");
  const [key, setKey] = useState(0); // Force remount on mode change
  const [isPaused, setIsPaused] = useState(false); // Auto-start immediately

  const handleReset = () => {
    setKey((prev) => prev + 1);
    setIsPaused(false); // Auto-start on reset
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setKey((prev) => prev + 1);
    setIsPaused(false); // Auto-start on mode change
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-4xl font-bold text-gray-900">Arc Timer</h1>

        {/* Mode Selection */}
        <div className="flex gap-3">
          <Button
            onClick={() => handleModeChange("countdown")}
            variant={mode === "countdown" ? "default" : "outline"}
            size="lg"
          >
            Timer
          </Button>
          <Button
            onClick={() => handleModeChange("stopwatch")}
            variant={mode === "stopwatch" ? "default" : "outline"}
            size="lg"
          >
            Stopwatch
          </Button>
        </div>

        {/* Arc Countdown Component */}
        <ArcCountdown
          key={key}
          initialSeconds={mode === "countdown" ? 140 : 0}
          radius={160}
          mode={mode}
          isPaused={isPaused}
        />

        {/* Control Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => setIsPaused(!isPaused)}
            variant="secondary"
            size="lg"
          >
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button onClick={handleReset} variant="destructive" size="lg">
            Reset
          </Button>
        </div>

        <p className="text-sm text-gray-500">
          <span className="font-semibold">
            {mode === "countdown" ? "Timer" : "Stopwatch"}
          </span>
          {isPaused && <span className="ml-2 text-orange-500">• Paused</span>}
        </p>
      </div>
    </div>
  );
}
