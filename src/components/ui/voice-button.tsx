"use client";

import * as React from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LiveWaveform } from "@/components/ui/live-waveform";

export type VoiceButtonState =
  | "idle"
  | "recording"
  | "processing"
  | "success"
  | "error";

export interface VoiceButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onError"> {
  /**
   * Current state of the voice button
   * @default "idle"
   */
  state?: VoiceButtonState;

  /**
   * Callback when button is clicked
   */
  onPress?: () => void;

  /**
   * Content to display on the left side (label)
   * Can be a string or ReactNode for custom components
   */
  label?: React.ReactNode;

  /**
   * Content to display on the right side (e.g., keyboard shortcut)
   * Can be a string or ReactNode for custom components
   * @example "⌥Space" or <kbd>⌘K</kbd>
   */
  trailing?: React.ReactNode;

  /**
   * Icon to display in the center when idle (for icon size buttons)
   */
  icon?: React.ReactNode;

  /**
   * Custom variant for the button
   * @default "outline"
   */
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";

  /**
   * Size of the button
   * @default "default"
   */
  size?: "default" | "sm" | "lg" | "icon";

  /**
   * Custom className for the button
   */
  className?: string;

  /**
   * Custom className for the waveform container
   */
  waveformClassName?: string;

  /**
   * Duration in ms to show success/error states
   * @default 1500
   */
  feedbackDuration?: number;

  /**
   * Disable the button
   */
  disabled?: boolean;
}

export const VoiceButton = React.forwardRef<
  HTMLButtonElement,
  VoiceButtonProps
>(
  (
    {
      state = "idle",
      onPress,
      label,
      trailing,
      icon,
      variant = "outline",
      size = "default",
      className,
      waveformClassName,
      feedbackDuration = 1500,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const [showFeedback, setShowFeedback] = React.useState(false);

    React.useEffect(() => {
      if (state === "success" || state === "error") {
        setShowFeedback(true);
        const timeout = setTimeout(
          () => setShowFeedback(false),
          feedbackDuration
        );
        return () => clearTimeout(timeout);
      } else {
        // Reset feedback when state changes away from success/error
        setShowFeedback(false);
      }
    }, [state, feedbackDuration]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      onPress?.();
    };

    const isRecording = state === "recording";
    const isProcessing = state === "processing";
    const isSuccess = state === "success";
    const isError = state === "error";

    const buttonVariant = variant;
    const isDisabled = disabled || isProcessing;

    const displayLabel = label;

    const shouldShowWaveform = isRecording || isProcessing || showFeedback;
    const shouldShowTrailing = !shouldShowWaveform && trailing;

    return (
      <Button
        ref={ref}
        type="button"
        variant={buttonVariant}
        size={size}
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "gap-2 transition-all duration-200",
          size === "icon" && "relative",
          className
        )}
        aria-label={"Voice Button"}
        {...props}
      >
        {size !== "icon" && displayLabel && (
          <span className="inline-flex shrink-0 items-center justify-start">
            {displayLabel}
          </span>
        )}

        <motion.div
          className={cn(
            "relative flex items-center justify-center overflow-hidden",
            size === "icon"
              ? "absolute inset-0 rounded-sm border-0 shrink-0"
              : "h-5 flex-1 rounded-md border",
            isRecording
              ? "bg-green-500/20 dark:bg-green-500/10 border-green-500/40"
              : size === "icon"
              ? "bg-muted/50 border-0"
              : "border-green-500/30 bg-slate-700/50 dark:bg-slate-800/50",
            waveformClassName
          )}
          animate={{
            scale: isRecording ? [1, 1.02, 1] : 1,
            boxShadow: isRecording
              ? "0 0 20px rgba(34, 197, 94, 0.3)"
              : "0 0 0px rgba(34, 197, 94, 0)",
          }}
          transition={{
            scale: {
              duration: 1.5,
              repeat: isRecording ? Infinity : 0,
              ease: "easeInOut",
            },
            boxShadow: {
              duration: 0.3,
            },
          }}
        >
          <AnimatePresence mode="wait">
            {shouldShowWaveform && (
              <motion.div
                key="waveform"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <LiveWaveform
                  active={isRecording}
                  processing={isProcessing || isSuccess}
                  barWidth={2}
                  barGap={1}
                  barRadius={4}
                  fadeEdges={false}
                  sensitivity={1.8}
                  smoothingTimeConstant={0.85}
                  height={20}
                  mode="static"
                  className="h-full w-full"
                />
              </motion.div>
            )}

            {shouldShowTrailing && (
              <motion.div
                key="trailing"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {typeof trailing === "string" ? (
                  <span className="text-muted-foreground px-1.5 font-mono text-[10px] font-medium select-none">
                    {trailing}
                  </span>
                ) : (
                  trailing
                )}
              </motion.div>
            )}

            {!shouldShowWaveform &&
              !shouldShowTrailing &&
              icon &&
              size === "icon" && (
                <motion.div
                  key="icon"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {icon}
                </motion.div>
              )}

            {isSuccess && showFeedback && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                className="bg-background/80 absolute inset-0 flex items-center justify-center"
              >
                <span className="text-primary text-[10px] font-medium">
                  <CheckIcon className="size-3.5" />
                </span>
              </motion.div>
            )}

            {isError && showFeedback && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: [0, -10, 10, -10, 10, 0],
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.5 }}
                className="bg-background/80 absolute inset-0 flex items-center justify-center"
              >
                <span className="text-destructive text-[10px] font-medium">
                  <XIcon className="size-3.5" />
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Button>
    );
  }
);

VoiceButton.displayName = "VoiceButton";
