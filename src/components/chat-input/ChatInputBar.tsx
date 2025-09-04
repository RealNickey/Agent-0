"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import cn from "classnames";

/**
 * ChatInputBar
 * A ChatGPT-style bottom input bar that sends text to the Live API client.
 * Reuses the logic from the SidePanel input (placeholder + enter to send).
 */
export default function ChatInputBar() {
  const { client, connected } = useLiveAPIContext();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-grow textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px"; // reset
    const scrollH = el.scrollHeight;
    el.style.height = Math.min(scrollH, 180) + "px"; // cap height
  }, [value]);

  const send = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      client.send([{ text: trimmed }]);
      setValue("");
    } catch (e) {
      console.error("Send failed", e);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        // increased margin to mb-40 to move higher
        "w-full flex justify-center px-4 pb-4 pt-2 mb-40 -translate-y-0.5",
      )}
    >
      <div
        className={cn(
          "relative w-full max-w-3xl transition-colors",
          "border rounded-xl px-3 py-1.5 bg-muted/60 hover:bg-muted/70",
          "focus-within:bg-muted/80 focus-within:border-border/80",
          !connected && "opacity-60 pointer-events-none"
        )}
      >
        <textarea
          ref={textareaRef}
            className={cn(
            "block w-full resize-none bg-transparent outline-none text-xs leading-tight py-0.5",
            "placeholder:text-muted-foreground pr-12"
          )}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={connected ? "Type something..." : "Connect to start chatting..."}
          disabled={!connected}
        />
  {/* Removed inner gradient overlay */}
        <div className="flex items-center justify-end gap-2 mt-1">
          <button
            type="button"
            onClick={send}
            disabled={!value.trim() || !connected}
            className={cn(
              "h-6 px-3 text-xs font-medium rounded",
              "bg-primary text-primary-foreground shadow-sm",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:bg-primary/90 transition-colors"
            )}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
