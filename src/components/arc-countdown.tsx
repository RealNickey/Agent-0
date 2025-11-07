"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

type Item = {
  id: number;
  slot: number;
  value: number; // seconds (0-59)
  isNew: boolean;
};

const SLOTS = 12; // full clock-like circle

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export default function ArcCountdown({
  initialSeconds = 2 * 60 + 20, // 02:20 default
  radius = 160, // slightly larger to comfortably fit a full ring
  mode = "countdown", // "countdown" or "stopwatch"
  isPaused = false,
  onTimeChange,
}: {
  initialSeconds?: number;
  radius?: number;
  mode?: "countdown" | "stopwatch";
  isPaused?: boolean;
  onTimeChange?: (seconds: number) => void;
}) {
  const [total, setTotal] = useState<number>(initialSeconds);
  const initialSec = initialSeconds % 60;

  // Seed the circle so the leftmost shows current seconds, then increase clockwise by 1
  const [items, setItems] = useState<Item[]>(() =>
    Array.from({ length: SLOTS }, (_, i) => ({
      id: i,
      slot: i, // 0 is far-left; increases clockwise
      value: (initialSec + i) % 60, // increment by 1 each position clockwise
      isNew: i === 0, // leftmost starts as "new"
    }))
  );

  const tickRef = useRef<number | null>(null);

  // Reset total and items when initialSeconds changes (mode switch or reset)
  useEffect(() => {
    setTotal(initialSeconds);
    const sec = initialSeconds % 60;
    setItems(
      Array.from({ length: SLOTS }, (_, i) => ({
        id: i,
        slot: i,
        value: (sec + i) % 60, // increment by 1 each position clockwise
        isNew: i === 0,
      }))
    );
  }, [initialSeconds]);

  const updateStopwatch = useCallback((prev: number) => {
    const next = prev + 1;
    const currentSec = next % 60;

    setItems((curr) =>
      curr.map((it) => {
        const nextSlot = (it.slot - 1 + SLOTS) % SLOTS;
        const becomesLeft = nextSlot === 0;
        const offset = nextSlot;
        const newValue = (currentSec + offset) % 60;
        return {
          ...it,
          slot: nextSlot,
          value: newValue,
          isNew: becomesLeft,
        };
      })
    );

    return next;
  }, []);

  const updateCountdown = useCallback((prev: number) => {
    if (prev <= 0) return 0;
    const next = prev - 1;
    const currentSec = next % 60;

    setItems((curr) =>
      curr.map((it) => {
        const nextSlot = (it.slot + 1) % SLOTS;
        const becomesLeft = nextSlot === 0;
        const offset = nextSlot;
        const newValue = (currentSec + offset) % 60;
        return {
          ...it,
          slot: nextSlot,
          value: newValue,
          isNew: becomesLeft,
        };
      })
    );

    return next;
  }, []);

  useEffect(() => {
    if (isPaused) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }

    const updateFn = mode === "stopwatch" ? updateStopwatch : updateCountdown;

    tickRef.current = window.setInterval(() => {
      setTotal(updateFn);
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [mode, isPaused, updateStopwatch, updateCountdown]);

  // Notify parent of time changes
  useEffect(() => {
    onTimeChange?.(total);
  }, [total, onTimeChange]);

  // Compute evenly spaced positions across a full circle, starting at the far left (π),
  // advancing clockwise by equal steps.
  const positions = useMemo(() => {
    const step = (2 * Math.PI) / SLOTS;
    return Array.from({ length: SLOTS }, (_, slot) => {
      const a = Math.PI + slot * step; // start at left (π), move clockwise (increase angle)
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius;
      return { x, y: -y }; // invert Y for CSS coordinates
    });
  }, [radius]);

  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return (
    <div className="relative" aria-label="Countdown timer">
      <div
        className="relative"
        style={{
          width: radius * 2 + 160, // extra whitespace like the reference
          height: radius * 2 + 160,
        }}
      >
        {/* Center timer */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
          aria-live="polite"
        >
          <div className="text-3xl font-semibold tracking-tight tabular-nums text-black">
            {pad2(minutes)}:{pad2(seconds)}
          </div>
        </div>

        {/* Circular labels */}
        {items.map((it) => {
          const pos = positions[it.slot];
          const display = pad2(it.value).replace(/^0/, ""); // no leading zero on ring labels
          return (
            <div
              key={it.id}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none will-change-transform"
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                transition: "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <span
                className={[
                  "text-2xl font-semibold tabular-nums transition-colors duration-500",
                  it.isNew ? "text-yellow-400" : "text-black",
                ].join(" ")}
              >
                {display}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
