"use client";

import { RiSparklingLine } from "react-icons/ri";
import { useClerk, useUser } from "@clerk/nextjs";
import { useUsage } from "../../contexts/UsageContext";
import cn from "classnames";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiLogoutBoxRLine, RiUserSettingsLine } from "react-icons/ri";

function useClerkData() {
  const { openSignIn, signOut, openUserProfile } = useClerk();
  const { user } = useUser();
  return { openSignIn, signOut, user, openUserProfile };
}

export function AccountWidget() {
  const { openSignIn, signOut, user, openUserProfile } = useClerkData();
  const { isAnonymous, remainingMessages, messageLimit, usagePercentage } =
    useUsage();
  const [isOpen, setIsOpen] = useState(false);

  if (isAnonymous) {
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

  return (
    <div className="absolute bottom-4 left-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full left-0 mb-3 w-60 origin-bottom-left bg-card/90 backdrop-blur-lg border border-border rounded-xl shadow-2xl"
          >
            <div className="flex items-center gap-3 p-3 border-b border-border">
              <img
                src={user?.imageUrl}
                alt="User profile"
                className="h-10 w-10 rounded-full"
              />
              <div className="text-sm overflow-hidden">
                <p className="font-semibold text-foreground truncate">
                  {user?.fullName || "User"}
                </p>
                <p className="text-muted-foreground truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
            <div className="p-1.5">
              <button
                onClick={() => openUserProfile?.()}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <RiUserSettingsLine className="h-4 w-4" />
                <span>Manage Account</span>
              </button>
              <button
                onClick={() => signOut?.({ redirectUrl: "/dashboard" })}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <RiLogoutBoxRLine className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <img
          src={user?.imageUrl}
          alt="Open user menu"
          className="h-12 w-12 rounded-full border-2 border-border"
        />
      </motion.button>
    </div>
  );
}
