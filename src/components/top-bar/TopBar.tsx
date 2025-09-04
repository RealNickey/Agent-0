"use client";

import cn from "classnames";
import React from "react";

type TopBarProps = {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

/**
 * TopBar: Full-width top navigation bar.
 * - Left: typically brand/logo
 * - Center: page-level actions (e.g., app toggles)
 * - Right: quick controls (e.g., ThemeToggle)
 */
export function TopBar({ left, center, right, className }: TopBarProps) {
  return (
    <div
      className={cn(
        "w-full h-12 shrink-0 border-b border-neutral-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-10",
        className
      )}
    >
      <div className="mx-auto h-full max-w-[1400px] px-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2">{left}</div>
        <div className="flex-1 min-w-0 flex items-center justify-center">{center}</div>
        <div className="min-w-0 flex items-center gap-2">{right}</div>
      </div>
    </div>
  );
}
