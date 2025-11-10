"use client";

import { RiSparklingLine } from "react-icons/ri";
import { useClerk } from "@clerk/nextjs";
import { useUsage } from "../../contexts/UsageContext";
import cn from "classnames";

export function AccountWidget() {
  const { openSignIn } = useClerk();
  const { isAnonymous, remainingMessages, messageLimit, usagePercentage } =
    useUsage();

  if (!isAnonymous) return null;

  if (!isAnonymous) return null;

  return (
    <div className="absolute bottom-4 left-4 z-50">
      <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
          <RiSparklingLine className="h-4 w-4" />
          <span>Free Messages</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between text-[10px]">
            <span className="text-muted-foreground">
              {remainingMessages} of {messageLimit} remaining
            </span>
            <span className="text-[9px] text-muted-foreground/70">
              {Math.round(usagePercentage)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                usagePercentage >= 80
                  ? "bg-destructive"
                  : usagePercentage >= 50
                  ? "bg-yellow-500"
                  : "bg-primary"
              )}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => {
            try {
              openSignIn?.();
            } catch {
              window.location.href = "/";
            }
          }}
          className="w-full mt-2 px-2 py-1 text-[10px] font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Sign in for unlimited access
        </button>
      </div>
    </div>
  );
}
