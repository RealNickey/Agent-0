"use client";

import * as React from "react";
import {
  ArrowUpIcon,
  ChevronDown,
  Keyboard,
  Mic,
  MicOff,
  PhoneIcon,
  XIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VoiceButton } from "@/components/ui/voice-button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { AudioRecorder } from "@/lib/audio-recorder";

export interface ConversationBarProps {
  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Custom className for the waveform
   */
  waveformClassName?: string;

  /**
   * Callback when conversation connects
   */
  onConnect?: () => void;

  /**
   * Callback when conversation disconnects
   */
  onDisconnect?: () => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Callback when a message is received
   */
  onMessage?: (message: string) => void;

  /**
   * Callback when user sends a message
   */
  onSendMessage?: (message: string) => void;
}

export const ConversationBar = React.forwardRef<
  HTMLDivElement,
  ConversationBarProps
>(
  (
    {
      className,
      waveformClassName,
      onConnect,
      onDisconnect,
      onError,
      onMessage,
      onSendMessage,
    },
    ref
  ) => {
    const { client, connected, connect, disconnect, volume } =
      useLiveAPIContext();
    const [isMuted, setIsMuted] = React.useState(false);
    const [agentState, setAgentState] = React.useState<
      "disconnected" | "connecting" | "connected" | "disconnecting" | null
    >("disconnected");
    const [keyboardOpen, setKeyboardOpen] = React.useState(false);
    const [textInput, setTextInput] = React.useState("");
    const [inVolume, setInVolume] = React.useState(0);
    const [audioRecorder] = React.useState(() => new AudioRecorder());
    const [recordingFromSpace, setRecordingFromSpace] = React.useState(false);
    const [isSpacePressed, setIsSpacePressed] = React.useState(false);
    const spaceDownTimeRef = React.useRef<number>(0);
    const lastSpacePressTimeRef = React.useRef<number>(0);
    const spacePressCountRef = React.useRef<number>(0);
    const spacePressTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const wasManuallyMutedRef = React.useRef<boolean>(false);

    // VAD configuration
    const VAD_SILENCE_MS = 1000;
    const VAD_MIN_VOLUME = 0.005;
    const lastSpeechTimeRef = React.useRef<number>(Date.now());
    const inSpeechRef = React.useRef<boolean>(false);
    const vadIntervalRef = React.useRef<number | null>(null);

    // Sync agentState with Gemini connection status
    React.useEffect(() => {
      if (connected) {
        setAgentState("connected");
        setIsMuted(false); // Unmute when connected
        onConnect?.();
      } else {
        setAgentState("disconnected");
      }
    }, [connected, onConnect]);

    // Listen for content messages from Gemini
    React.useEffect(() => {
      const handleContent = (event: any) => {
        if (event?.serverContent?.modelTurn?.parts) {
          const textParts = event.serverContent.modelTurn.parts
            .filter((part: any) => part.text)
            .map((part: any) => part.text)
            .join(" ");
          if (textParts) {
            onMessage?.(textParts);
          }
        }
      };

      client.on("content", handleContent);
      return () => {
        client.off("content", handleContent);
      };
    }, [client, onMessage]);

    // Handle audio recording for voice input (when not in keyboard mode)
    React.useEffect(() => {
      const onData = (base64: string) => {
        client.sendRealtimeInput([
          {
            mimeType: "audio/pcm;rate=16000",
            data: base64,
          },
        ]);
      };

      const onVolume = (v: number) => {
        setInVolume(v);
        const now = Date.now();
        if (v >= VAD_MIN_VOLUME) {
          lastSpeechTimeRef.current = now;
          if (!inSpeechRef.current) {
            inSpeechRef.current = true;
          }
        }
      };

      // Only record audio when connected, not muted, and keyboard is closed (voice mode) or recording from spacebar
      if ((connected && !isMuted && !keyboardOpen) || recordingFromSpace) {
        audioRecorder.on("data", onData).on("volume", onVolume).start();

        // VAD interval for silence detection
        if (!vadIntervalRef.current) {
          vadIntervalRef.current = window.setInterval(() => {
            const now = Date.now();
            if (
              inSpeechRef.current &&
              now - lastSpeechTimeRef.current > VAD_SILENCE_MS
            ) {
              client.endAudioStream();
              inSpeechRef.current = false;
            }
          }, 250);
        }
      } else {
        audioRecorder.stop();
        if (vadIntervalRef.current) {
          clearInterval(vadIntervalRef.current);
          vadIntervalRef.current = null;
        }
        inSpeechRef.current = false;
      }

      return () => {
        audioRecorder.off("data", onData).off("volume", onVolume);
        if (vadIntervalRef.current) {
          clearInterval(vadIntervalRef.current);
          vadIntervalRef.current = null;
        }
      };
    }, [
      connected,
      client,
      isMuted,
      keyboardOpen,
      audioRecorder,
      VAD_MIN_VOLUME,
      VAD_SILENCE_MS,
      recordingFromSpace,
    ]);

    const startConversation = React.useCallback(async () => {
      try {
        setAgentState("connecting");
        await connect();
      } catch (error) {
        console.error("Error starting conversation:", error);
        setAgentState("disconnected");
        onError?.(error as Error);
      }
    }, [connect, onError]);

    const handleEndSession = React.useCallback(async () => {
      try {
        setAgentState("disconnecting");
        await disconnect();
        setAgentState("disconnected");
        onDisconnect?.();
        setKeyboardOpen(false);
      } catch (error) {
        console.error("Error ending session:", error);
        setAgentState("disconnected");
      }
    }, [disconnect, onDisconnect]);

    const toggleMute = React.useCallback(() => {
      setIsMuted((prev) => {
        const newMuted = !prev;
        // Stop audio recorder when muting
        if (newMuted && audioRecorder.recording) {
          audioRecorder.stop();
        }
        return newMuted;
      });
    }, [audioRecorder]);

    const handleStartOrEnd = React.useCallback(() => {
      if (agentState === "connected" || agentState === "connecting") {
        handleEndSession();
      } else if (agentState === "disconnected") {
        startConversation();
      }
    }, [agentState, handleEndSession, startConversation]);

    const isConnected = agentState === "connected";

    const handleSendText = React.useCallback(() => {
      if (!textInput.trim() || !isConnected) return;

      const messageToSend = textInput;
      client.send([{ text: messageToSend }]);
      setTextInput("");
      onSendMessage?.(messageToSend);
    }, [client, textInput, onSendMessage, isConnected]);

    const handleTextChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setTextInput(value);
      },
      []
    );

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSendText();
        }
      },
      [handleSendText]
    );

    // Spacebar interactions: 1 press starts call, 2 presses end call, hold mutes and enables push-to-talk
    React.useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        // Only handle spacebar when not typing in textarea or input
        if (
          e.code === "Space" &&
          !(e.target instanceof HTMLTextAreaElement) &&
          !(e.target instanceof HTMLInputElement)
        ) {
          if (spaceDownTimeRef.current === 0) {
            e.preventDefault();
            setIsSpacePressed(true);
            spaceDownTimeRef.current = Date.now();
          }
        }
      };

      const handleGlobalKeyUp = (e: KeyboardEvent) => {
        if (
          e.code === "Space" &&
          !(e.target instanceof HTMLTextAreaElement) &&
          !(e.target instanceof HTMLInputElement)
        ) {
          e.preventDefault();
          setIsSpacePressed(false);
          const pressDuration = Date.now() - spaceDownTimeRef.current;
          spaceDownTimeRef.current = 0;

          // If held for more than 300ms, it's push-to-talk
          if (pressDuration > 300 && connected) {
            // End push-to-talk recording and mute
            setRecordingFromSpace(false);
            client.endAudioStream();
            // Mute after releasing spacebar
            setIsMuted(true);
            wasManuallyMutedRef.current = true;
          } else {
            // Short press - count clicks
            const now = Date.now();
            if (now - lastSpacePressTimeRef.current < 400) {
              // Double press detected
              spacePressCountRef.current = 2;
              if (spacePressTimeoutRef.current) {
                clearTimeout(spacePressTimeoutRef.current);
                spacePressTimeoutRef.current = null;
              }

              if (connected) {
                // End call on double press
                handleEndSession();
              }
              spacePressCountRef.current = 0;
            } else {
              // First press
              spacePressCountRef.current = 1;
              lastSpacePressTimeRef.current = now;

              // Wait to see if there's a second press
              if (spacePressTimeoutRef.current) {
                clearTimeout(spacePressTimeoutRef.current);
              }
              spacePressTimeoutRef.current = setTimeout(() => {
                if (spacePressCountRef.current === 1) {
                  // Single press action
                  if (!connected && agentState === "disconnected") {
                    startConversation();
                  }
                }
                spacePressCountRef.current = 0;
              }, 400);
            }
          }
        }
      };

      // Handle hold for push-to-talk (unmute and record during hold)
      const holdCheckInterval = setInterval(() => {
        if (spaceDownTimeRef.current > 0 && connected) {
          const holdDuration = Date.now() - spaceDownTimeRef.current;
          if (holdDuration > 300 && !recordingFromSpace) {
            // Start push-to-talk: unmute and start recording
            setIsMuted(false);
            setRecordingFromSpace(true);
          }
        }
      }, 50);

      document.addEventListener("keydown", handleGlobalKeyDown);
      document.addEventListener("keyup", handleGlobalKeyUp);

      return () => {
        document.removeEventListener("keydown", handleGlobalKeyDown);
        document.removeEventListener("keyup", handleGlobalKeyUp);
        clearInterval(holdCheckInterval);
        if (spacePressTimeoutRef.current) {
          clearTimeout(spacePressTimeoutRef.current);
        }
      };
    }, [
      connected,
      agentState,
      startConversation,
      client,
      handleEndSession,
      isMuted,
    ]);

    // Handle voice button click
    const handleVoiceButtonClick = React.useCallback(() => {
      if (!connected && agentState === "disconnected") {
        startConversation();
      }
    }, [connected, agentState, startConversation]);

    React.useEffect(() => {
      return () => {
        if (connected) {
          disconnect();
        }
      };
    }, [connected, disconnect]);

    return (
      <div
        ref={ref}
        className={cn("flex w-full items-end justify-center p-4", className)}
      >
        <Card
          className={cn(
            "m-0 w-full gap-0 p-0 shadow-xl bg-white dark:bg-slate-900",
            "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform-gpu",
            isConnected ? "max-w-2xl" : "max-w-sm",
            isSpacePressed && "scale-[0.99] shadow-2xl",
            recordingFromSpace && "ring-2 ring-green-500/30"
          )}
        >
          <div className="flex flex-col-reverse">
            <div>
              {keyboardOpen && (
                <Separator className="bg-slate-200 dark:bg-slate-700" />
              )}
              <div className="flex items-center justify-between gap-2 p-2">
                <VoiceButton
                  state={
                    agentState === "connecting"
                      ? "processing"
                      : agentState === "connected" &&
                        ((connected && !isMuted && !keyboardOpen) ||
                          recordingFromSpace)
                      ? "recording"
                      : "idle"
                  }
                  trailing={
                    <span
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-bold transition-all duration-200",
                        "bg-gradient-to-r from-green-500 to-emerald-500",
                        "text-white shadow-lg shadow-green-500/50",
                        isSpacePressed && "scale-95 shadow-green-500/70",
                        recordingFromSpace && "animate-pulse"
                      )}
                    >
                      ⌥Space
                    </span>
                  }
                  onPress={handleVoiceButtonClick}
                  variant="outline"
                  size="default"
                  className={cn(
                    "h-10 min-w-[140px] md:h-12 md:min-w-[160px]",
                    "bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900",
                    "dark:from-slate-900 dark:via-slate-950 dark:to-black",
                    "border-2 transition-all duration-300 ease-out",
                    // globally remove browser focus outline/ring for this button
                    "focus:outline-none focus:ring-0 focus-visible:ring-0",
                    agentState === "disconnected" &&
                      "border-slate-600/50 dark:border-slate-700/50 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/20",
                    agentState === "connecting" &&
                      "border-blue-500/50 animate-pulse",
                    // Remove visible border when connected (keep shadow/glow only)
                    agentState === "connected" &&
                      !recordingFromSpace &&
                      "border-0 shadow-lg shadow-green-500/30",
                    recordingFromSpace &&
                      "border-green-400 shadow-xl shadow-green-400/50 ring-2 ring-green-400/30",
                    "text-slate-100 dark:text-slate-200",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    isSpacePressed && "border-0 scale-95 shadow-2xl",
                    "transform-gpu"
                  )}
                  waveformClassName={waveformClassName}
                  disabled={
                    agentState === "connecting" ||
                    agentState === "disconnecting"
                  }
                />
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    aria-pressed={isMuted}
                    className={cn(
                      "hover:bg-slate-100 dark:hover:bg-slate-800",
                      isMuted
                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        : "text-slate-600 dark:text-slate-400"
                    )}
                    disabled={!isConnected}
                  >
                    {isMuted ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setKeyboardOpen((v) => !v)}
                    aria-pressed={keyboardOpen}
                    className={cn(
                      "relative hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400",
                      keyboardOpen &&
                        "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    )}
                    disabled={!isConnected}
                  >
                    <Keyboard
                      className={
                        "h-5 w-5 transform-gpu transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] " +
                        (keyboardOpen
                          ? "scale-75 opacity-0"
                          : "scale-100 opacity-100")
                      }
                    />
                    <ChevronDown
                      className={
                        "absolute inset-0 m-auto h-5 w-5 transform-gpu transition-all delay-50 duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] " +
                        (keyboardOpen
                          ? "scale-100 opacity-100"
                          : "scale-75 opacity-0")
                      }
                    />
                  </Button>
                  <Separator
                    orientation="vertical"
                    className="mx-1 -my-2.5 bg-slate-200 dark:bg-slate-700"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleStartOrEnd}
                    disabled={agentState === "disconnecting"}
                    className={cn(
                      "hover:bg-slate-100 dark:hover:bg-slate-800",
                      isConnected
                        ? "text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                        : "text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                    )}
                  >
                    {isConnected || agentState === "connecting" ? (
                      <XIcon className="h-5 w-5" />
                    ) : (
                      <PhoneIcon className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-out",
                keyboardOpen ? "max-h-[120px]" : "max-h-0"
              )}
            >
              <div className="relative px-2 pt-2 pb-2">
                <Textarea
                  value={textInput}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="min-h-[100px] resize-none border-0 pr-12 shadow-none focus-visible:ring-0 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  disabled={!isConnected}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSendText}
                  disabled={!textInput.trim() || !isConnected}
                  className={cn(
                    "absolute right-3 bottom-3 h-8 w-8",
                    textInput.trim()
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }
);

ConversationBar.displayName = "ConversationBar";
