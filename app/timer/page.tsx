"use client"

import { useState } from "react"
import ArcCountdown from "@/components/arc-countdown"
import { Button } from "@/components/ui/button"

type Mode = "countdown" | "stopwatch"

export default function TimerPage() {
  const [mode, setMode] = useState<Mode>("countdown")
  const [key, setKey] = useState(0) // Force remount on mode change
  const [isPaused, setIsPaused] = useState(true) // Start paused
  const [isStarted, setIsStarted] = useState(false)

  const handleStart = () => {
    setIsStarted(true)
    setIsPaused(false)
  }

  const handleReset = () => {
    setKey((prev) => prev + 1)
    setIsPaused(true)
    setIsStarted(false)
  }

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    handleReset()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold text-gray-900">Arc Countdown Timer</h1>
        
        {/* Mode Selection */}
        <div className="flex gap-4">
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
        <div className="my-4">
          <ArcCountdown 
            key={key}
            initialSeconds={mode === "countdown" ? 140 : 0} 
            radius={160}
            mode={mode}
            isPaused={isPaused}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex gap-4">
          {!isStarted ? (
            <Button
              onClick={handleStart}
              variant="default"
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              Start
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setIsPaused(!isPaused)}
                variant="secondary"
                size="lg"
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button
                onClick={handleReset}
                variant="destructive"
                size="lg"
              >
                Stop
              </Button>
            </>
          )}
        </div>

        <p className="text-sm text-gray-500">
          Current mode: <span className="font-semibold">{mode === "countdown" ? "Timer (Countdown)" : "Stopwatch (Count Up)"}</span>
          {isStarted && isPaused && <span className="ml-2 text-orange-500">• Paused</span>}
          {!isStarted && <span className="ml-2 text-blue-500">• Ready to start</span>}
        </p>
      </div>
    </div>
  )
}
